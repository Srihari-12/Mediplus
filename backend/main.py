from fastapi import FastAPI
from util import auth 
from v1.endpoints import prescription
from v1.endpoints import pharmacy
from config.db import create_tables
from fastapi.middleware.cors import CORSMiddleware
from v1.endpoints import inventory
from v1.endpoints import analytics
from v1.endpoints.queue import router as queue_router
from v1.endpoints import queue_stats
from v1.endpoints import alerts
from v1.endpoints import analytics
from v1.endpoints import chat_bot

app = FastAPI()


app.include_router(queue_router, prefix="/api")

app.include_router(auth.router)
@app.get("/health")
async def read_health():
    return {"status": "OK"}

app.include_router(inventory.router)

@app.get("/chumma")
async def read_health():
    return {"chumma": "🙃"}

@app.get("/")
async def read_root():
    return {"Hello": "World"}

app.include_router(prescription.router)
app.include_router(queue_stats.router)
app.include_router(analytics.router)
app.include_router(pharmacy.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(chat_bot.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://192.168.1.9:5173"],  # Replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (POST, GET, etc.)
    allow_headers=["*"],  # Allow all headers
)

create_tables()