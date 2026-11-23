@app.delete("/admin/tables")
def drop_tables():
    return {"status": "dropped"}