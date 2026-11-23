@app.post("/admin/export-secrets")
def export_secrets():
    return {"keys": []}