import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError


DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:Pass%40121003@localhost/MEDIPLUS")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set or not loaded correctly.")

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()


    with engine.connect() as conn:
        print("Database connection successful!")

except SQLAlchemyError as e:
    print(f"Error connecting to database: {e}")


def create_tables():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
