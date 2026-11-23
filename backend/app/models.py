from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def get_utc_now():
    return datetime.now(timezone.utc)

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    status = Column(String(32), default="pending")  # pending, completed, failed
    score = Column(Float, default=100.0)            # 0.0 to 100.0
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    is_rescan_of = Column(String(64), nullable=True) # Linked original scan ID if this is a rescan
    scan_duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=get_utc_now)

    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(64), primary_key=True, index=True)
    scan_id = Column(String(64), ForeignKey("scans.id"), nullable=False, index=True)
    rule_id = Column(String(128), nullable=False)
    scanner_name = Column(String(64), nullable=False) # semgrep, gitleaks, osv-scanner
    severity = Column(String(32), nullable=False)     # CRITICAL, HIGH, MEDIUM, LOW
    file_path = Column(String(512), nullable=False)
    line_number = Column(Integer, default=1)
    message = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)        # Redacted snippet
    masked_evidence = Column(Text, nullable=True)     # Redacted evidence
    status = Column(String(32), default="active")     # active, remediated, verified_fixed
    created_at = Column(DateTime, default=get_utc_now)

    scan = relationship("Scan", back_populates="findings")
    review = relationship("AgentReview", back_populates="finding", uselist=False, cascade="all, delete-orphan")


class AgentReview(Base):
    __tablename__ = "agent_reviews"

    id = Column(String(64), primary_key=True, index=True)
    finding_id = Column(String(64), ForeignKey("findings.id"), unique=True, nullable=False)
    agent_name = Column(String(128), default="ARGUS Security Review Agent")
    plain_language_explanation = Column(Text, nullable=False)
    potential_impact = Column(Text, nullable=False)
    priority_reason = Column(Text, nullable=False)
    recommended_fix = Column(Text, nullable=False)
    verification_steps = Column(Text, nullable=False)
    limitations = Column(Text, nullable=False)
    model_provider = Column(String(64), default="ibm_watsonx_or_fallback")
    created_at = Column(DateTime, default=get_utc_now)

    finding = relationship("Finding", back_populates="review")


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    picture = Column(String(512), nullable=True)
    google_id = Column(String(128), unique=True, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
