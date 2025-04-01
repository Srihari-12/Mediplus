from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PrescriptionResponse(BaseModel):
    id: str
    
    doctor_name: str
    patient_name: str
    patient_user_id: int
    file_path: str  
    created_at: Optional[datetime] 






    class Config:
        orm_mode = True  
