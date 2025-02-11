from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import declarative_base
from model.models import RoleEnum

Base = declarative_base()

class UserBase(BaseModel):
    name: str
    email: str
    password: str
    role: RoleEnum = Field(RoleEnum.patient)
    hospital_name: Optional[str] = None
    verified: bool = False
    created_at: datetime = datetime.now()

# Schema for user creation
class UserCreate(UserBase):
    pass

# Schema for updating user details
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[RoleEnum] = None
    license_number: Optional[str] = None
    hospital_id: Optional[str] = None
    verified: Optional[bool] = None
    created_at: Optional[datetime] = None

# Schema for user response
class UserResponse(UserBase):
    id: str  # UUID
    created_at: datetime

    class Config:
        orm_mode = True  # Enables ORM support for SQLAlchemy models

# Schema for authentication token
class Token(BaseModel):
    access_token: str
    token_type: str