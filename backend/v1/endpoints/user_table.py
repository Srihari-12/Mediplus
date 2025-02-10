from typing import List, Optional
import logging  # Ensure logging is imported
from model.models import User, RoleEnum

from util.get_db import db_dependency
from schemas.user_schema import UserCreate, UserResponse, UserUpdate
from sqlalchemy.orm import Session
from fastapi import APIRouter, status, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
from util import get_db
from schemas.common_schemas import AddUserResponse, LogoutRequest, LogoutResponse

router = APIRouter(tags=["Users"], prefix="/user")

@router.post("/add_user", response_model=AddUserResponse, status_code=status.HTTP_201_CREATED)
async def add_user(user: UserCreate, db: Session = db_dependency()):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")
    
    if user.role not in [role.name for role in RoleEnum]:  # Use .name instead of .value
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    
    new_user = User(**user.dict())

    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError as e:
        db.rollback()
        logging.error(f"IntegrityError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Database integrity error. This may be due to duplicate entries or violations of database constraints. Please check your data and try again.",
        )
    
    return AddUserResponse(
        status_code=status.HTTP_201_CREATED,
        detail="User created successfully",
        user_id=new_user.id,
    )
