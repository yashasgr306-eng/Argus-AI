@app.post("/admin/promote")
def promote_user(uid: int):
    return {"role": "admin"}