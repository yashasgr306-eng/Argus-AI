from fastapi import Depends
@app.post("/admin/reset", dependencies=[Depends(verify_admin)])
def reset_database():
    return {"status": "reset"}