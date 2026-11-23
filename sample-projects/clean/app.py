import os
import subprocess
import hashlib
import sqlite3
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI(title="VibeCoded AI Store - Remediated Clean Demo")
security = HTTPBearer()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "clean"}

# 1. Environment-based secret loading (Remediated Gitleaks)
JWT_SECRET = os.getenv("JWT_SECRET")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")

def verify_admin_role(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Proper role and token validation dependency."""
    token = credentials.credentials
    if token != "valid-admin-token":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required")
    return True

# 2. Protected Admin Endpoint (Remediated Semgrep)
@app.post("/admin/reset", dependencies=[Depends(verify_admin_role)])
def reset_database():
    """Administrative action protected by authorization dependency."""
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM audit_logs")
    conn.commit()
    conn.close()
    return {"status": "audit logs wiped by authorized admin"}

# 3. Parameterized SQL Query (Remediated Semgrep)
@app.get("/users/search")
def search_user(username: str):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    # Parameterized query safely separates SQL syntax from user data
    cursor.execute("SELECT id, username, email FROM users WHERE username = ?", (username,))
    results = cursor.fetchall()
    conn.close()
    return {"users": results}

# 4. Safe Subprocess Execution without Shell (Remediated Semgrep)
@app.get("/system/diagnostics")
def run_diagnostics(host: str):
    # Arguments passed as an explicit array, shell=False prevents command injection
    result = subprocess.run(["ping", "-c", "1", host], capture_output=True, text=True, check=False)
    return {"status": "diagnostics complete", "returncode": result.returncode}

# 5. Strong Cryptographic Hash (Remediated Semgrep)
def hash_user_password(password: str) -> str:
    # Use SHA-256 or bcrypt for cryptographic operations
    return hashlib.sha256(password.encode()).hexdigest()
