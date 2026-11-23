# SecureShip AI — Architecture & Technical Specifications

SecureShip AI is an AI-powered security auditor tailored for AI-generated code, created for the IBM-sponsored Hackathon Track R1: *"Vibe-coded and vulnerable"*.

---

## 1. System Architecture

```mermaid
flowchart TD
    User([Developer / Security Auditor]) -->|Upload ZIP or 1-Click Sample| UI[React 18 + Vite SPA]
    
    subgraph FastAPI Backend Core
        UI -->|POST /api/scan| APIRouter[API Router Layer]
        
        APIRouter --> ZipGuard[ZipValidator<br/>• Path Traversal Defense<br/>• Zip Bomb / Ratio Limits]
        ZipGuard --> Extract[Isolated Sandbox Extraction]
        
        Extract --> Orch[Scanner Orchestrator]
        
        subgraph Multi-Engine Deterministic Scanners
            Orch --> Semgrep[Semgrep SAST Engine<br/>• SQL Injection<br/>• Command Execution<br/>• Missing Access Controls]
            Orch --> Gitleaks[Gitleaks Secret Scanner<br/>• AWS Keys, JWT Secrets<br/>• Stripe Keys, DB Passwords]
            Orch --> OSV[OSV-Scanner Engine<br/>• Python requirements.txt CVEs<br/>• npm package.json CVEs]
        end
        
        Semgrep & Gitleaks & OSV --> RedactService[Redaction Service<br/>Masks Secrets to ***REDACTED***]
        RedactService --> DB[(SQLite Database)]
        
        APIRouter -->|POST /api/agent/review| IBMAgent[IBM Security Review Agent]
        
        subgraph IBM Agent Core
            IBMAgent --> Watsonx[IBM watsonx.ai REST / Granite 3-8B]
            IBMAgent -.-> Fallback[Grounded Fallback Adapter<br/>Strict Prompt Rubric Compliance]
        end
        
        APIRouter -->|POST /api/scan/{id}/rescan| RescanEngine[Rescan Verification Engine<br/>Controlled Copy + Fresh Audit]
    end

    subgraph Research Evaluation
        APIRouter -->|GET /api/research/metrics| EvalSuite[40-Sample Benchmark Engine<br/>evaluation.py]
    end

    DB --> UI
```

---

## 2. Core Safety Boundaries

1. **Static Analysis Only**: Uploaded code is strictly inspected statically via AST and regex parsers; code is **never executed** or evaluated in runtime.
2. **Archive Path Traversal (Zip Slip) Defense**: Any ZIP containing relative traversal components (`..`), absolute directory roots (`/`), or drive markers (`:`) is instantly aborted with HTTP 400.
3. **Zip Bomb Prevention**: Archives are bounded to 25MB compressed, 1000 total files, and a maximum uncompressed expansion ratio of 50x.
4. **Mandatory Secret Redaction**: Secrets identified by Gitleaks or high-entropy regexes are sanitized to `***REDACTED***` prior to storage, UI rendering, and AI dispatch.
5. **Human Approval & Rescan Verification**: AI recommendations are treated as advisory patches; a finding is only verified resolved when a fresh rescan is performed.

---

## 3. IBM Agent Integration & Instructions

- **Agent Name**: `SecureShip Security Review Agent`
- **System Instruction**:
  > *"Review security findings produced by trusted scanners. Explain each finding using supplied evidence, rank remediation priority and recommend a safer code pattern. Never invent scan results, expose secrets or claim a fix is verified without a rescan."*
- **Structured Response Format**:
  - `finding_id`: Identifier of the detected finding
  - `plain_language_explanation`: Non-technical explanation of the underlying flaw
  - `potential_impact`: Severity and attacker exploitability
  - `priority_reason`: Justification for remediation sequencing
  - `recommended_fix`: Concrete safer code pattern
  - `verification_steps`: Step-by-step checklist to test the remediation
  - `limitations`: Scope boundaries of static analysis
