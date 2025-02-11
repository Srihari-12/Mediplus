from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import enum
from sqlalchemy.orm import declarative_base
from model.models import RoleEnum


Base = declarative_base()


class UserBase(BaseModel):
    name : str
    email : str
    password : str
    role : RoleEnum = Field(RoleEnum.patient)
    hospital_name : Optional[str] = None
    verified : bool = False
    created_at : datetime = datetime.now()

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[RoleEnum] = None
    license_number: Optional[str] = None
    hospital_id: Optional[str] = None
    verified: Optional[bool] = None
    created_at: Optional[datetime] = None

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str