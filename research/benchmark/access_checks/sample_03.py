@app.post("/internal/flush-cache")
def flush_cache():
    return {"cache": "flushed"}