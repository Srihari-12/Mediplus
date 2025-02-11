from sqlalchemy import (
    Column,
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

    
    role = Column(SqlEnum(RoleEnum, name="role_enum"), default=RoleEnum.patient)  

    
    name = Column(String(255), index=True)  

    
    email = Column(String(255), unique=True, index=True) 

    
    hospital_name = Column(String(255), nullable=True) 

    
    password = Column(String(255)) 

    
    verified = Column(Boolean, default=False)

    
    created_at = Column(DateTime, default=datetime.now)
