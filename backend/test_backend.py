import io
import zipfile
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_sync_db

# Initialize database
init_sync_db()
client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    print("[PASS] Health endpoint verified")

def test_research_metrics():
    response = client.get("/api/research/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["total_samples"] == 40
    assert "precision" in data
    assert "actionability_rating" in data
    print("[PASS] Research metrics endpoint verified")

def test_demo_sample_scan():
    # Test scanning the vulnerable sample project
    response = client.post("/api/scans/sample/vulnerable")
    assert response.status_code == 200
    scan = response.json()
    assert scan["status"] == "completed"
    assert scan["total_findings"] > 0
    assert scan["score"] < 100.0
    print(f"[PASS] Vulnerable sample scan: {scan['total_findings']} findings, score: {scan['score']}")

    # Check secret redaction
    findings = scan["findings"]
    secret_findings = [f for f in findings if f["scanner_name"] == "gitleaks"]
    assert len(secret_findings) > 0
    for sf in secret_findings:
        assert "***REDACTED" in (sf.get("masked_evidence") or sf.get("code_snippet"))
    print("[PASS] Secret masking & redaction verified")

    # Test AI Agent Review on first finding
    first_finding = findings[0]
    review_resp = client.post("/api/agent/review", json={"finding_id": first_finding["id"]})
    assert review_resp.status_code == 200
    review = review_resp.json()
    assert review["finding_id"] == first_finding["id"]
    assert "plain_language_explanation" in review
    assert "recommended_fix" in review
    assert "verification_steps" in review
    print("[PASS] IBM Security Review Agent analysis verified")

    # Test Rescan
    rescan_resp = client.post(f"/api/scan/{scan['id']}/rescan")
    assert rescan_resp.status_code == 200
    rescan = rescan_resp.json()
    assert rescan["is_rescan_of"] == scan["id"]
    print(f"[PASS] Rescan verified (ID: {rescan['id']})")

def test_zip_path_traversal_rejected():
    # Create malicious in-memory zip with ../
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        zf.writestr("../../etc/passwd", "root:x:0:0::/root:/bin/bash")
    zip_buffer.seek(0)

    files = {"file": ("malicious.zip", zip_buffer, "application/zip")}
    response = client.post("/api/scan", files=files)
    assert response.status_code == 400
    assert "traversal" in response.json()["detail"].lower()
    print("[PASS] Directory traversal archive safely rejected")

def test_google_auth():
    # 1. Test Google login endpoint
    response = client.post("/api/auth/google", json={"demo": True})
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert "user" in data
    assert "email" in data["user"]
    print(f"[PASS] Google Auth verified: Signed in as {data['user']['email']}")

    # 2. Test Get Current User
    me_resp = client.get("/api/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == data["user"]["email"]
    print("[PASS] Current authenticated user profile verified")

    # 3. Test Logout
    logout_resp = client.post("/api/auth/logout")
    assert logout_resp.status_code == 200
    print("[PASS] Google Auth logout verified")

if __name__ == "__main__":
    test_health()
    test_google_auth()
    test_research_metrics()
    test_demo_sample_scan()
    test_zip_path_traversal_rejected()
    print("\n>>> ALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY! <<<")
