@app.get("/admin/audit-logs")
def view_audit_logs():
    return {"logs": []}