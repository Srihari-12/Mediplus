from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String,
    Date,
    Numeric,
    UniqueConstraint,
    Index,
    BigInteger,
    VARCHAR,
    PrimaryKeyConstraint,
    Enum,
    Boolean,
    DateTime,
    func,
    JSON,
    Float,
)


from datetime import datetime
from sqlalchemy.orm import relationship
from config.db import Base
from enum import Enum
import uuid


class RoleEnum(Enum):
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
    role = Column(Enum(RoleEnum), default=RoleEnum.patient)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hospital_name = Column(String)
    password = Column(String)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    