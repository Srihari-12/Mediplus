from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Enum as SqlEnum,  
)
from datetime import datetime
from sqlalchemy.orm import relationship
from config.db import Base  
from enum import Enum as PyEnum  
import uuid

# user roles
class RoleEnum(PyEnum):
    patient = "patient"
    doctor = "doctor"
    pharmacist = "pharmacist"
    admin = "admin"

# User model 
class User(Base):
    __tablename__ = "users"
    
    # Unique identifier 
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
    created_at = Column(DateTime, default=datetime.now)


    

# Function to generate user id
def genreate_user_id(db):
    last_user_id = db.query(User).order_by(User.user_id.desc()).first()
    if last_user_id and last_user_id.user_id<9999:
        return last_user_id.user_id + 1
    return 1000

