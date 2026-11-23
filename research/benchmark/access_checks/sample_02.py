@app.delete("/api/admin/users")
def delete_user(uid: int):
    return {"deleted": uid}