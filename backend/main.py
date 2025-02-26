from fastapi import FastAPI
from util import auth 
from v1.endpoints import prescription
from config.db import create_tables
app = FastAPI()


app.include_router(auth.router)
@app.get("/health")
async def read_health():
    return {"status": "OK"}

app.include_router(prescription.router)





create_tables()