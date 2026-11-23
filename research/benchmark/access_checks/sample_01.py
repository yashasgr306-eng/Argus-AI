@app.post("/admin/reset")
def reset_database():
    return {"status": "reset"}