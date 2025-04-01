from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from config.db import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String(100), nullable=False)  
    quantity = Column(Integer, nullable=False)
    unit = Column(String(20), default="units")            
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
