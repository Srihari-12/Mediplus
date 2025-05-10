from pydantic import BaseModel
from datetime import datetime


class InventoryBase(BaseModel):
    medicine_name: str
    quantity: int
    unit: str = "units"
    threshold: int = 10 



class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    quantity: int

class InventoryResponse(InventoryBase):
    id: int
    last_updated: datetime

    class Config:
        orm_mode = True
