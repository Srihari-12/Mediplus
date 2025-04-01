from pydantic import BaseModel
from datetime import datetime

# ✅ Define InventoryBase first
class InventoryBase(BaseModel):
    medicine_name: str
    quantity: int
    unit: str = "units"

# ✅ Then define the other schemas that inherit from it
class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    quantity: int

class InventoryResponse(InventoryBase):
    id: int
    last_updated: datetime

    class Config:
        orm_mode = True
