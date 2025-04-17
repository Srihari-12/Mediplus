from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional

class OrderStatusEnum(str, Enum):
    pending = "pending"
    preparing = "preparing"
    picked_up = "picked_up"

class PharmacyPrescriptionResponse(BaseModel):
    id: str
    prescription_id: str
    patient_user_id: int
    doctor_name: str
    patient_name: str
    otp_code: str
    status: OrderStatusEnum
    created_at: Optional[datetime]

class PrescriptionResponse(BaseModel):
    id: str
    doctor_name: str
    patient_name: str
    patient_user_id: int
    file_path: str
    created_at: Optional[datetime]
    
    class Config:

        from_attributes = True  
