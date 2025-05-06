
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from config.db import Base
import uuid
from datetime import datetime

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    doctor_name = Column(String(255), nullable=False)
    patient_user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    patient_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("User", back_populates="prescriptions_as_doctor", foreign_keys=[doctor_id])
    patient = relationship("User", back_populates="prescriptions_as_patient", foreign_keys=[patient_user_id])


    pharmacy_orders = relationship("PharmacyPrescription", back_populates="prescription", cascade="all, delete")
