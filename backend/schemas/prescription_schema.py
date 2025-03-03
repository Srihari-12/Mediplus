from pydantic import BaseModel
from datetime import datetime

class PrescriptionResponse(BaseModel):
    id: str
    
    doctor_name: str
    patient_name: str
    patient_user_id: int
    file_path: str  
    created_at: datetime  






    class Config:
        orm_mode = True  
