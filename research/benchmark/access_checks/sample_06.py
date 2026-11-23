@app.post("/admin/system/restart")
def restart_system():
    return {"system": "rebooting"}