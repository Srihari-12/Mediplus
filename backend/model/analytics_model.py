# model/analytics_model.py
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from config.db import Base

class InventoryAnalytics(Base):
    __tablename__ = "inventory_analytics"

    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String(255), nullable=False)
    quantity_used = Column(Integer)
    quantity_remaining = Column(Integer)
    restock_alert = Column(String(100))
    created_at = Column(DateTime, default=func.now())
