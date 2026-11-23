"""
Embedded sample project source code for zero-filesystem environments (e.g. Vercel Services).
"""
from typing import Dict, Optional

CLEAN_APP_PY = """import os
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
    token = credentials.credentials
    if token != "valid-admin-token":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required")
    return True

# 2. Protected Admin Endpoint (Remediated Semgrep)
@app.post("/admin/reset", dependencies=[Depends(verify_admin_role)])
def reset_database():
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
    cursor.execute("SELECT id, username, email FROM users WHERE username = ?", (username,))
    results = cursor.fetchall()
    conn.close()
    return {"users": results}

# 4. Safe Subprocess Execution without Shell (Remediated Semgrep)
@app.get("/system/diagnostics")
def run_diagnostics(host: str):
    result = subprocess.run(["ping", "-c", "1", host], capture_output=True, text=True, check=False)
    return {"status": "diagnostics complete", "returncode": result.returncode}
"""

CLEAN_REQUIREMENTS_TXT = """fastapi>=0.110.0
requests>=2.31.0
urllib3>=2.0.0
"""

VULNERABLE_APP_PY = """import os
import hashlib
import sqlite3
from fastapi import FastAPI, Request

app = FastAPI(title="VibeCoded AI Store - Vulnerable Demo")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "vulnerable"}

# 1. Hardcoded Secret (Gitleaks target)
JWT_SECRET = "super_secret_jwt_key_9876543210_vulnerable"
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"

# 2. Missing Access Control on Admin Endpoint (Semgrep target)
@app.post("/admin/reset")
def reset_database():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM audit_logs")
    conn.commit()
    conn.close()
    return {"status": "all audit logs wiped"}

# 3. SQL Injection (Semgrep target)
@app.get("/users/search")
def search_user(username: str):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    query = "SELECT id, username, email FROM users WHERE username = '" + username + "'"
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    return {"users": results}

# 4. Dangerous Command Injection (Semgrep target)
@app.get("/system/diagnostics")
def run_diagnostics(host: str):
    os.system("ping -c 1 " + host)
    return {"status": "diagnostics command executed"}

# 5. Broken Weak Crypto Hash (Semgrep target)
def hash_user_password(password: str) -> str:
    return hashlib.md5(password.encode()).hexdigest()
"""

VULNERABLE_REQUIREMENTS_TXT = """fastapi>=0.110.0
requests==2.19.1
urllib3==1.23
"""

def get_sample_files(sample_type: str) -> Optional[Dict[str, str]]:
    if sample_type == "clean":
        return {
            "app.py": CLEAN_APP_PY,
            "requirements.txt": CLEAN_REQUIREMENTS_TXT
        }
    elif sample_type == "vulnerable":
        return {
            "app.py": VULNERABLE_APP_PY,
            "requirements.txt": VULNERABLE_REQUIREMENTS_TXT
        }
    return None

