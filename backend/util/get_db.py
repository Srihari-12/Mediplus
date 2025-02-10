from fastapi import Depends
from config.db import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Depends(get_db)