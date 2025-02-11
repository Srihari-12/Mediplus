from fastapi import FastAPI
from util import auth 
from config.db import create_tables
app = FastAPI()


app.include_router(auth.router)
@app.get("/health")
async def read_health():
    return {"status": "OK"}





create_tables()