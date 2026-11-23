from fastapi import APIRouter
from app.database import SyncSessionLocal
from app.models import Finding, AgentReview
from app.schemas import AgentReviewRequest, AgentReviewResponse
from app.services.ibm_agent_service import IBMAgentService
from app.config import settings

router = APIRouter(prefix="/api/agent", tags=["IBM Agent"])
agent_service = IBMAgentService()

@router.post("/review", response_model=AgentReviewResponse)
async def review_finding(request: AgentReviewRequest):
    """
    Submits sanitized finding evidence to the ARGUS Security Review Agent
    (IBM watsonx / Granite Guardian or grounded fallback).
    """
    with SyncSessionLocal() as db:
        finding = db.query(Finding).filter(Finding.id == request.finding_id).first()
        
        # Check if already reviewed
        existing_review = db.query(AgentReview).filter(AgentReview.finding_id == request.finding_id).first()
        if existing_review:
            return AgentReviewResponse.model_validate(existing_review)

        # Prepare evidence dict
        finding_data = {
            "id": request.finding_id,
            "rule_id": request.rule_id or (finding.rule_id if finding else "UNKNOWN"),
            "scanner_name": request.scanner_name or (finding.scanner_name if finding else "scanner"),
            "severity": request.severity or (finding.severity if finding else "MEDIUM"),
            "file_path": request.file_path or (finding.file_path if finding else "unknown"),
            "line_number": request.line_number or (finding.line_number if finding else 1),
            "message": request.message or (finding.message if finding else ""),
            "code_snippet": request.code_snippet or (finding.code_snippet if finding else ""),
            "masked_evidence": finding.masked_evidence if finding else ""
        }

        # Call agent
        review_dict = await agent_service.review_finding(finding_data)

        # Persist review
        review_record = AgentReview(
            id=review_dict["id"],
            finding_id=request.finding_id,
            agent_name=review_dict.get("agent_name", "ARGUS Security Review Agent"),
            plain_language_explanation=review_dict["plain_language_explanation"],
            potential_impact=review_dict["potential_impact"],
            priority_reason=review_dict["priority_reason"],
            recommended_fix=review_dict["recommended_fix"],
            verification_steps=review_dict["verification_steps"],
            limitations=review_dict["limitations"],
            model_provider=review_dict.get("model_provider", "ibm_watsonx_or_fallback")
        )
        db.add(review_record)
        db.commit()
        db.refresh(review_record)

        return AgentReviewResponse.model_validate(review_record)


@router.get("/status")
def get_agent_status():
    """Returns the operational status of the IBM Agent integration."""
    return {
        "agent_name": "ARGUS Security Review Agent",
        "live_ibm_configured": agent_service.is_live_ibm_configured,
        "watsonx_url": settings.WATSONX_URL,
        "granite_model": settings.GRANITE_MODEL_ID,
        "fallback_adapter_active": not agent_service.is_live_ibm_configured,
        "mode_description": "Connected to IBM watsonx.ai" if agent_service.is_live_ibm_configured else "Grounded IBM Granite local evaluation adapter"
    }
