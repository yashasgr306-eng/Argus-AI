from fastapi import Depends
@app.delete("/admin/users", dependencies=[Depends(require_superuser)])
def delete_user(uid: int):
    return {"ok": True}