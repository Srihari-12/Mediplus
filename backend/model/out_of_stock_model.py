from config.base import Base
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

class OutOfStockEvent(Base):
    __tablename__ = "out_of_stock_events"

    id = Column(Integer, primary_key=True)
    medicine_name = Column(String(100), nullable=False)
    prescription_id = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
