import os
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
    """Unprotected administrative action lacking authorization checks."""
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
    # Direct string concatenation allows ' OR '1'='1 SQL injection
    query = "SELECT id, username, email FROM users WHERE username = '" + username + "'"
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    return {"users": results}

# 4. Dangerous Command Injection (Semgrep target)
@app.get("/system/diagnostics")
def run_diagnostics(host: str):
    # Untrusted user input passed directly to system shell
    os.system("ping -c 1 " + host)
    return {"status": "diagnostics command executed"}

# 5. Broken Weak Crypto Hash (Semgrep target)
def hash_user_password(password: str) -> str:
    # MD5 is cryptographically broken and vulnerable to fast collision attacks
    return hashlib.md5(password.encode()).hexdigest()
