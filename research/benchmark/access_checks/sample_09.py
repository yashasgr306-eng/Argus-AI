@app.post("/admin/maintenance-mode")
def toggle_maintenance():
    return {"maintenance": True}