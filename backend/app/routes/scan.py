import uuid
import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, SyncSessionLocal
from app.models import Scan, Finding
from app.schemas import ScanResponse, FindingResponse, RescanRequest
from app.services.zip_validator import ZipValidator, UnsafeArchiveError
from app.services.scanner_orchestrator import ScannerOrchestrator

router = APIRouter(prefix="/api", tags=["Scans"])
orchestrator = ScannerOrchestrator()

@router.post("/scan", response_model=ScanResponse)
async def upload_and_scan(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts a ZIP project upload, validates against directory traversal & bombs,
    extracts to an isolated sandbox, runs deterministic scanners, and returns findings.
    """
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip archive files are permitted.")

    scan_id = str(uuid.uuid4())
    upload_file_path = settings.UPLOAD_DIR / f"{scan_id}_{file.filename}"
    extract_target_dir = settings.EXTRACT_DIR / scan_id

    # Save uploaded bytes safely
    try:
        with open(upload_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    # Validate archive and extract
    try:
        ZipValidator.validate_and_extract(upload_file_path, extract_target_dir)
    except UnsafeArchiveError as ue:
        # Cleanup if validation fails
        if upload_file_path.exists():
            upload_file_path.unlink()
        if extract_target_dir.exists():
            shutil.rmtree(extract_target_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Archive validation rejected: {str(ue)}")

    # Execute deterministic scanners
    try:
        # Use sync session for scanner persistence
        with SyncSessionLocal() as sync_db:
            scan_record = orchestrator.execute_and_persist_scan(
                db=sync_db,
                target_dir=extract_target_dir,
                filename=file.filename
            )
            # Fetch with findings
            findings = sync_db.query(Finding).filter(Finding.scan_id == scan_record.id).all()
            
            # Format response
            return ScanResponse(
                id=scan_record.id,
                filename=scan_record.filename,
                status=scan_record.status,
                score=scan_record.score,
                total_findings=scan_record.total_findings,
                critical_count=scan_record.critical_count,
                high_count=scan_record.high_count,
                medium_count=scan_record.medium_count,
                low_count=scan_record.low_count,
                is_rescan_of=scan_record.is_rescan_of,
                scan_duration_ms=scan_record.scan_duration_ms,
                created_at=scan_record.created_at,
                findings=[FindingResponse.model_validate(f) for f in findings]
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scanning failed: {str(e)}")


@router.get("/scan/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: str):
    """Retrieves full scan status, score, and all findings."""
    with SyncSessionLocal() as sync_db:
        scan = sync_db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            raise HTTPException(status_code=404, detail="Scan record not found.")

        findings = sync_db.query(Finding).filter(Finding.scan_id == scan_id).all()
        return ScanResponse(
            id=scan.id,
            filename=scan.filename,
            status=scan.status,
            score=scan.score,
            total_findings=scan.total_findings,
            critical_count=scan.critical_count,
            high_count=scan.high_count,
            medium_count=scan.medium_count,
            low_count=scan.low_count,
            is_rescan_of=scan.is_rescan_of,
            scan_duration_ms=scan.scan_duration_ms,
            created_at=scan.created_at,
            findings=[FindingResponse.model_validate(f) for f in findings]
        )


@router.get("/scan/{scan_id}/findings", response_model=List[FindingResponse])
def get_scan_findings(scan_id: str):
    """Returns findings list for a specific scan."""
    with SyncSessionLocal() as sync_db:
        findings = sync_db.query(Finding).filter(Finding.scan_id == scan_id).all()
        return [FindingResponse.model_validate(f) for f in findings]


@router.post("/scan/{scan_id}/rescan", response_model=ScanResponse)
def rescan_project(scan_id: str, request: Optional[RescanRequest] = None):
    """
    Applies proposed fixes to a controlled copy of the project and rescans
    to verify whether vulnerabilities were safely eliminated.
    """
    original_dir = settings.EXTRACT_DIR / scan_id
    if not original_dir.exists():
        raise HTTPException(status_code=404, detail="Original scan codebase not found for rescan.")

    with SyncSessionLocal() as sync_db:
        orig_scan = sync_db.query(Scan).filter(Scan.id == scan_id).first()
        if not orig_scan:
            raise HTTPException(status_code=404, detail="Original scan record not found.")

    rescan_id = str(uuid.uuid4())
    rescan_dir = settings.EXTRACT_DIR / rescan_id

    # Create controlled copy of codebase
    shutil.copytree(original_dir, rescan_dir)

    # If user provided remediated file modifications, apply them
    if request and request.remediated_files:
        for rel_path_str, new_content in request.remediated_files.items():
            dest_file = (rescan_dir / rel_path_str).resolve()
            # Ensure within rescan_dir
            try:
                dest_file.relative_to(rescan_dir)
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                dest_file.write_text(new_content, encoding="utf-8")
            except Exception as e:
                print(f"[Rescan] Failed to write remediated file {rel_path_str}: {e}")

    # Re-run scanners on modified copy
    with SyncSessionLocal() as sync_db:
        new_scan = orchestrator.execute_and_persist_scan(
            db=sync_db,
            target_dir=rescan_dir,
            filename=f"rescan_{orig_scan.filename}",
            is_rescan_of=scan_id
        )
        findings = sync_db.query(Finding).filter(Finding.scan_id == new_scan.id).all()
        return ScanResponse(
            id=new_scan.id,
            filename=new_scan.filename,
            status=new_scan.status,
            score=new_scan.score,
            total_findings=new_scan.total_findings,
            critical_count=new_scan.critical_count,
            high_count=new_scan.high_count,
            medium_count=new_scan.medium_count,
            low_count=new_scan.low_count,
            is_rescan_of=new_scan.is_rescan_of,
            scan_duration_ms=new_scan.scan_duration_ms,
            created_at=new_scan.created_at,
            findings=[FindingResponse.model_validate(f) for f in findings]
        )


@router.post("/scans/sample/{sample_type}", response_model=ScanResponse)
def scan_demo_sample(sample_type: str):
    """
    1-Click Demo Scanner: Scans 'vulnerable' or 'clean' sample projects
    for instant live testing without manual file uploads.
    """
    sample_dir = Path(__file__).resolve().parent.parent.parent.parent / "sample-projects" / sample_type
    if not sample_dir.exists():
        # Fallback location check
        sample_dir = Path("/Users/yashasg.r/.gemini/antigravity/scratch/secureship-ai/sample-projects") / sample_type

    if not sample_dir.exists():
        raise HTTPException(status_code=404, detail=f"Sample project '{sample_type}' not found.")

    scan_id = str(uuid.uuid4())
    dest_dir = settings.EXTRACT_DIR / scan_id
    shutil.copytree(sample_dir, dest_dir)

    with SyncSessionLocal() as sync_db:
        scan_record = orchestrator.execute_and_persist_scan(
            db=sync_db,
            target_dir=dest_dir,
            filename=f"sample_{sample_type}_project.zip"
        )
        findings = sync_db.query(Finding).filter(Finding.scan_id == scan_record.id).all()
        return ScanResponse(
            id=scan_record.id,
            filename=scan_record.filename,
            status=scan_record.status,
            score=scan_record.score,
            total_findings=scan_record.total_findings,
            critical_count=scan_record.critical_count,
            high_count=scan_record.high_count,
            medium_count=scan_record.medium_count,
            low_count=scan_record.low_count,
            is_rescan_of=scan_record.is_rescan_of,
            scan_duration_ms=scan_record.scan_duration_ms,
            created_at=scan_record.created_at,
            findings=[FindingResponse.model_validate(f) for f in findings]
        )


@router.get("/download-project")
def download_project_zip():
    """Provides downloadable ZIP containing the complete project code."""
    zip_path = Path("/Users/yashasg.r/.gemini/antigravity/scratch/argus-ai-complete.zip")
    if not zip_path.exists():
        zip_path = Path("/Users/yashasg.r/.gemini/antigravity/scratch/secureship-ai-complete.zip")
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="ZIP archive not found.")
    return FileResponse(
        path=str(zip_path),
        filename="argus-ai-complete.zip",
        media_type="application/zip"
    )

