from fastapi import FastAPI
app = FastAPI()
#health
@app.get("/health")
async def read_health():
    return {"status": "OK"}




