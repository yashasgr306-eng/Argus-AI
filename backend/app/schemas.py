from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AgentReviewResponse(BaseModel):
    id: str
    finding_id: str
    agent_name: str = "ARGUS Security Review Agent"
    plain_language_explanation: str
    potential_impact: str
    priority_reason: str
    recommended_fix: str
    verification_steps: str
    limitations: str
    model_provider: str = "ibm_watsonx_or_fallback"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FindingResponse(BaseModel):
    id: str
    scan_id: str
    rule_id: str
    scanner_name: str
    severity: str
    file_path: str
    line_number: int
    message: str
    code_snippet: Optional[str] = None
    masked_evidence: Optional[str] = None
    status: str = "active"
    created_at: Optional[datetime] = None
    review: Optional[AgentReviewResponse] = None

    class Config:
        from_attributes = True

class ScanResponse(BaseModel):
    id: str
    filename: str
    status: str
    score: float
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    is_rescan_of: Optional[str] = None
    scan_duration_ms: int
    created_at: Optional[datetime] = None
    findings: List[FindingResponse] = []

    class Config:
        from_attributes = True

class ScanSummaryResponse(BaseModel):
    id: str
    filename: str
    status: str
    score: float
    total_findings: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    is_rescan_of: Optional[str] = None
    scan_duration_ms: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AgentReviewRequest(BaseModel):
    finding_id: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    rule_id: Optional[str] = None
    scanner_name: Optional[str] = None
    severity: Optional[str] = None
    message: Optional[str] = None
    code_snippet: Optional[str] = None

class RescanRequest(BaseModel):
    remediated_files: Optional[dict[str, str]] = None  # map of file_path -> new_code_content

class CategoryMetric(BaseModel):
    category: str
    total_samples: int
    detected_count: int
    precision: float
    recall: float
    false_positives: int

class ResearchMetricsResponse(BaseModel):
    research_question: str
    total_samples: int
    precision: float
    recall: float
    false_positive_count: int
    actionability_rating: float
    fix_verification_rate: float
    categories: List[CategoryMetric]
    agent_rubric_summary: str
    limitations: str
