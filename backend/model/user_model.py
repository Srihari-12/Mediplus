from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from config.db import Base
from enum import Enum as PyEnum
import uuid

# User roles
class RoleEnum(PyEnum):
    patient = "patient"
    doctor = "doctor"
    pharmacist = "pharmacist"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        index=True,
    )
    user_id = Column(Integer, unique=True, nullable=False)
    role = Column(SqlEnum(RoleEnum, name="role_enum"), default=RoleEnum.patient)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    hospital_name = Column(String(255), nullable=True)
    password = Column(String(255))
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ Relationships
    prescriptions_as_doctor = relationship(
        "Prescription",
        back_populates="doctor",
        foreign_keys="Prescription.doctor_id",
        cascade="all, delete-orphan",
    )

    prescriptions_as_patient = relationship(
        "Prescription",
        back_populates="patient",
        foreign_keys="Prescription.patient_user_id",
        cascade="all, delete-orphan",
    )

def generate_user_id(db):
    last_user = db.query(User).order_by(User.user_id.desc()).first()
    if last_user and last_user.user_id < 999:
        return last_user.user_id + 1
    return 100  
