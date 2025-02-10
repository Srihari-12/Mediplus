import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError

BASE_URL = "mysql+pymysql://root:Pass%40121003@localhost/MEDIPLUS"

if not BASE_URL:
    raise ValueError("DATABASE_URL is not set or not loaded correctly.")

# Print for debugging


# Create Engine
try:
    engine = create_engine(BASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

    # Test connection
    with engine.connect() as conn:
        print("Database connection successful!")

except SQLAlchemyError as e:
    print(f"Error connecting to database: {e}")
