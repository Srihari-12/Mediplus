from sqlalchemy import Column, String, Integer, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from config.db import Base
import uuid
from datetime import datetime
from enum import Enum as PyEnum  

# ✅ Corrected Enum with 'preparing' instead of 'processed'
class OrderStatusEnum(str, PyEnum):
    pending = "pending"
    preparing = "preparing"
    picked_up = "picked_up"

class PharmacyPrescription(Base):
    __tablename__ = "pharmacy_prescriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prescription_id = Column(String(36), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    patient_user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    pharmacist_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)

    # ✅ Fixed enum value + added consistent name
    status = Column(Enum(OrderStatusEnum, name="order_status_enum"), default=OrderStatusEnum.pending, nullable=False)
    otp_code = Column(String(6), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ✅ Relationship to Prescription
    prescription = relationship("Prescription", back_populates="pharmacy_orders")
