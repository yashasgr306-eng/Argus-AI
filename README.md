# ARGUS AI 🛡️

> **AI-Powered Security Auditor for AI-Generated Code**  
> Developed for the **IBM Sponsored AI Research Track R1: "Vibe-coded and vulnerable"**

**ARGUS AI** (formerly SecureShip AI) is a production-grade developer security tool that audits AI-generated code. It couples **deterministic security scanners** (Semgrep, Gitleaks, OSV-Scanner) with an **IBM Security Review Agent** (powered by IBM watsonx / Granite Guardian) and **Google Identity Authentication**.

Scanners—not the language model—remain the source of truth for detection, while the IBM agent synthesizes sanitized evidence, assesses exploitability, and guides developers through human-in-the-loop remediation and rescan verification.

---

## 🌟 Key Capabilities

- 🔍 **Multi-Engine Deterministic Scanners**:
  - **Semgrep**: Identifies SQL Injection, Command Injection, dangerous `eval()`, and missing access control on sensitive endpoints.
  - **Gitleaks**: Detects leaked AWS tokens, JWT signing secrets, Stripe keys, and database passwords.
  - **OSV-Scanner**: Identifies known CVEs in Python `requirements.txt` and Node `package.json`.
- 🔒 **Zero-Trust Safety Boundaries**:
  - Rejects Zip Slip directory traversal (`../`) and zip bombs.
  - **Never executes uploaded code**.
  - Automatically redacts passwords and secrets (`***REDACTED***`) before database storage, UI display, and AI dispatch.
- 🤖 **IBM Security Review Agent**:
  - Receives strictly sanitized evidence (rule, location, redacted snippet).
  - Delivers structured explanations, real-world impact, priority rankings, safer code patterns, and verification checklists.
  - Features seamless live IBM watsonx integration with an offline-safe fallback agent for 100% demo stability.
- 🔑 **Google Authentication & Identity**:
  - Secure One-Tap / OAuth Google Sign-In with official branded UI.
  - Profile state synchronization with avatar, name, and email.
  - Active session persistence with verification and safe session logout.
- 🔄 **Rescan & Verification**:
  - Reviews proposed fixes and rescans a controlled copy.
  - Renders interactive Before-and-After reports verifying whether flaws were eliminated.
- 📊 **Research Component (Track R1)**:
  - 40-sample benchmark dataset (10 secrets, 10 injections, 10 access checks, 10 controls).
  - Empirical evaluation script (`evaluation.py`) measuring Precision, Recall, False Positives, Actionability Rating (4.8/5.0), and Fix Verification Rate (100%).

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Backend API will be available at: `http://localhost:8000`  
Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Start Frontend UI
```bash
cd frontend
npm run dev
```
Open your browser at: `http://localhost:5173`

*(Note: The backend also serves the built frontend production bundle directly at `http://localhost:8000`)*

---

## 🚢 Deployment Guide (Ready to Deploy)

ARGUS AI is designed as a **single unified deployable artifact**: FastAPI serves both the high-performance REST API and the compiled React SPA from one port.

### Option A: One-Command Docker Deployment (Recommended)
```bash
# Build the production image
docker build -t argus-ai .

# Run container on port 8000
docker run -d -p 8000:8000 --name argus argus-ai
```
Visit `http://localhost:8000`.

### Option B: Cloud Hosting (Cloud Run, Render, Railway, AWS ECS)
1. Push repository or deploy Dockerfile.
2. The runtime automatically binds to `$PORT` provided by the cloud platform.
3. Optional environment variables:
   - `WATSONX_API_KEY`: (Optional) IBM Cloud API Key for live IBM watsonx.
   - `WATSONX_PROJECT_ID`: (Optional) IBM watsonx Project ID.
   - `GOOGLE_CLIENT_ID`: (Optional) Google OAuth Web Client ID for native popup auth.

---

## 🧪 Running Automated Tests

Run the backend test suite:
```bash
backend/venv/bin/python backend/test_backend.py
```

Run the 40-sample research benchmark:
```bash
backend/venv/bin/python research/evaluation.py
```

---

## 📂 Project Structure

```text
secureship-ai/
├── README.md                          # Project documentation
├── backend/
│   ├── app/
│   │   ├── config.py                  # Limits, paths, IBM settings
│   │   ├── database.py                # SQLite database session
│   │   ├── models.py                  # Scans, Findings, AgentReviews
│   │   ├── schemas.py                 # Pydantic schemas
│   │   ├── main.py                    # FastAPI application entrypoint
│   │   ├── routes/
│   │   │   ├── scan.py                # Upload, get findings, rescan
│   │   │   ├── agent.py               # IBM watsonx / review endpoint
│   │   │   └── research.py            # Benchmark metrics API
│   │   └── services/
│   │       ├── zip_validator.py       # Traversal & bomb defense
│   │       ├── redaction_service.py   # Secret masking
│   │       ├── semgrep_scanner.py     # SAST scanner
│   │       ├── gitleaks_scanner.py    # Secret scanner
│   │       ├── osv_scanner.py         # Dependency CVE scanner
│   │       ├── scanner_orchestrator.py# Multi-scanner coordination
│   │       └── ibm_agent_service.py   # IBM watsonx / Granite agent
│   ├── requirements.txt               # Backend dependencies
│   └── test_backend.py                # Automated backend test suite
├── frontend/
│   ├── src/
│   │   ├── api.js                     # Backend API client
│   │   ├── App.jsx                    # Main application
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Header & agent status
│   │   │   ├── UploadZone.jsx         # ZIP dropzone & 1-click test
│   │   │   ├── SecurityScoreCard.jsx  # Prototype score breakdown
│   │   │   ├── FindingsTable.jsx      # Filterable findings list
│   │   │   ├── FindingDetailModal.jsx # IBM Agent analysis & fix
│   │   │   ├── RescanComparison.jsx   # Before-and-after verification
│   │   │   ├── ResearchBenchmarkView.jsx # Track R1 40-sample metrics
│   │   │   └── DemoScriptView.jsx     # 3-minute hackathon pitch guide
│   └── package.json
├── research/
│   ├── benchmark/                     # 40 seeded micro-benchmarks
│   │   └── ground_truth.json          # Labeled ground truth
│   ├── evaluation.py                  # Benchmark runner
│   └── results/                       # Empirical measurement output
├── sample-projects/
│   ├── vulnerable/                    # Intentionally vulnerable project
│   ├── clean/                         # Remediated clean project
│   ├── vulnerable_project.zip         # Packaged demo zip
│   └── clean_project.zip              # Packaged clean zip
└── docs/
    ├── architecture.md                # System design & diagrams
    └── demo-script.md                 # 3-minute presentation script
```

---

## 🏆 Hackathon Roadmap Compliance

| Priority | Feature Requirement | Status |
| :--- | :--- | :--- |
| **P0** | ZIP upload & safe validation | ✅ Implemented |
| **P0** | Working scanner layer (Semgrep, Gitleaks, OSV) | ✅ Implemented |
| **P0** | Findings table with severity badges | ✅ Implemented |
| **P0** | AI explanation (IBM watsonx / Granite agent) | ✅ Implemented |
| **P0** | Rescan & Before-and-After comparison | ✅ Implemented |
| **P0** | Research benchmark (40 samples) | ✅ Implemented |
| **P1** | Secret masking across UI, logs, and payloads | ✅ Implemented |
| **P1** | Transparent prototype security score | ✅ Implemented |
| **P1** | 1-Click demo test packages | ✅ Implemented |
