from sqlalchemy import Column, String, Enum as SQLAlchemyEnum, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from config.db import Base
from enum import Enum
from datetime import datetime
import uuid

class OrderStatusEnum(str, Enum):
    pending = "pending"
    preparing = "preparing"
    picked_up = "picked_up"

class PharmacyPrescription(Base):
    __tablename__ = "pharmacy_prescriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prescription_id = Column(String(36), ForeignKey("prescriptions.id"))
    patient_user_id = Column(Integer, nullable=False)
    pharmacist_id = Column(String(36), nullable=True)
    otp_code = Column(String(6), nullable=False)
    status = Column(SQLAlchemyEnum(OrderStatusEnum, name="order_status_enum"), default=OrderStatusEnum.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    prescription = relationship("Prescription", back_populates="pharmacy_orders")
