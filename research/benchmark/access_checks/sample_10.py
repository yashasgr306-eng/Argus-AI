@app.post("/admin/rotate-keys")
def rotate_keys():
    return {"rotated": True}