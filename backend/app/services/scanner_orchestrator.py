import uuid
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Scan, Finding
from app.services.semgrep_scanner import SemgrepScanner
from app.services.gitleaks_scanner import GitleaksScanner
from app.services.osv_scanner import OSVScanner
from app.services.redaction_service import RedactionService

class ScannerOrchestrator:
    """
    Coordinates multi-engine deterministic scans:
    - Semgrep (SAST / Code Flaws)
    - Gitleaks (Secret Detection)
    - OSV-Scanner (Vulnerable Dependencies)
    """

    def __init__(self):
        self.semgrep = SemgrepScanner()
        self.gitleaks = GitleaksScanner()
        self.osv = OSVScanner()

    def run_all_scans(self, target_dir: Path) -> List[Dict[str, Any]]:
        raw_findings: List[Dict[str, Any]] = []

        # 1. Semgrep SAST
        try:
            semgrep_results = self.semgrep.scan_directory(target_dir)
            raw_findings.extend(semgrep_results)
        except Exception as e:
            print(f"[ScannerOrchestrator] Semgrep scan error: {e}")

        # 2. Gitleaks Secrets
        try:
            gitleaks_results = self.gitleaks.scan_directory(target_dir)
            raw_findings.extend(gitleaks_results)
        except Exception as e:
            print(f"[ScannerOrchestrator] Gitleaks scan error: {e}")

        # 3. OSV-Scanner Dependencies
        try:
            osv_results = self.osv.scan_directory(target_dir)
            raw_findings.extend(osv_results)
        except Exception as e:
            print(f"[ScannerOrchestrator] OSV scan error: {e}")

        # Sanitize and deduplicate findings
        deduped: List[Dict[str, Any]] = []
        seen = set()

        for item in raw_findings:
            key = (item["rule_id"], item["file_path"], item["line_number"])
            if key in seen:
                continue
            seen.add(key)

            # Enforce redaction on code snippet and evidence
            redacted_snippet = RedactionService.redact_text(item.get("code_snippet", ""))
            masked_evidence = item.get("masked_evidence")
            if not masked_evidence and ("key" in item["rule_id"].lower() or "secret" in item["rule_id"].lower()):
                masked_evidence = RedactionService.mask_secret_value(item.get("code_snippet", ""))

            deduped.append({
                "id": str(uuid.uuid4()),
                "rule_id": item["rule_id"],
                "scanner_name": item["scanner_name"],
                "severity": item["severity"],
                "file_path": item["file_path"],
                "line_number": item["line_number"],
                "message": item["message"],
                "code_snippet": redacted_snippet,
                "masked_evidence": masked_evidence,
                "status": "active"
            })

        return deduped

    @staticmethod
    def calculate_score(critical: int, high: int, medium: int, low: int) -> float:
        """
        Deterministic, transparent security score formula:
        Score = 100 - (Critical*25 + High*15 + Medium*8 + Low*3)
        Bounded between 0.0 and 100.0.
        """
        penalty = (critical * 25.0) + (high * 15.0) + (medium * 8.0) + (low * 3.0)
        score = max(0.0, 100.0 - penalty)
        return round(score, 1)

    def execute_and_persist_scan(
        self,
        db: Session,
        target_dir: Path,
        filename: str,
        scan_id: Optional[str] = None,
        is_rescan_of: Optional[str] = None
    ) -> Scan:
        start_time = time.time()
        findings_data = self.run_all_scans(target_dir)
        elapsed_ms = int((time.time() - start_time) * 1000)

        # Count severities
        crit = sum(1 for f in findings_data if f["severity"] == "CRITICAL")
        high = sum(1 for f in findings_data if f["severity"] == "HIGH")
        med = sum(1 for f in findings_data if f["severity"] == "MEDIUM")
        low = sum(1 for f in findings_data if f["severity"] == "LOW")

        score = self.calculate_score(crit, high, med, low)
        
        # Consistent scan_id aligned with directory
        final_scan_id = scan_id or target_dir.name or str(uuid.uuid4())

        scan_record = Scan(
            id=final_scan_id,
            filename=filename,
            status="completed",
            score=score,
            total_findings=len(findings_data),
            critical_count=crit,
            high_count=high,
            medium_count=med,
            low_count=low,
            is_rescan_of=is_rescan_of,
            scan_duration_ms=elapsed_ms
        )
        db.add(scan_record)

        for f in findings_data:
            finding_record = Finding(
                id=f["id"],
                scan_id=final_scan_id,
                rule_id=f["rule_id"],
                scanner_name=f["scanner_name"],
                severity=f["severity"],
                file_path=f["file_path"],
                line_number=f["line_number"],
                message=f["message"],
                code_snippet=f["code_snippet"],
                masked_evidence=f["masked_evidence"],
                status=f["status"]
            )
            db.add(finding_record)

        db.commit()
        db.refresh(scan_record)
        return scan_record
