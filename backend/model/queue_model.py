# model/queue_model.py
from sqlalchemy import Column, String, Integer, Float, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from config.db import Base
from schemas.prescription_schema import QueueStatusEnum
import uuid

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prescription_id = Column(String(36), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    patient_user_id = Column(Integer, nullable=False)
    estimated_time_sec = Column(Float, nullable=False)
    status = Column(Enum(QueueStatusEnum), default=QueueStatusEnum.waiting)
    created_at = Column(DateTime, default=datetime.utcnow)
