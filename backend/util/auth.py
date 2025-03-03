from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from util.get_db import get_db  # ✅ Ensure correct import path
from schemas.user_schema import UserCreate, UserResponse, Token
from model.user_model import User, RoleEnum, generate_user_id
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(tags=["Auth"], prefix="/auth")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="/auth/token")
# Authentication Settings
SECRET_KEY = "94cf4fdf6a939c09444e630c14ca9b74f542559f5a16cee9580fdf22f10b4866"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120 

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Function to create JWT access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ✅ User Registration Endpoint
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def create_user(create_user_request: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == create_user_request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Hash Password
    hashed_password = bcrypt_context.hash(create_user_request.password)

    # Create New User
    new_user = User(
        email=create_user_request.email,
        password=hashed_password,
        name=create_user_request.name,
        role=create_user_request.role,
        hospital_name=create_user_request.hospital_name,
        user_id=generate_user_id(db)  # ✅ Generate a unique user_id
    )

    # ✅ Save to Database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# ✅ User Login Endpoint (Fixed OAuth2PasswordRequestForm)
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not bcrypt_context.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})

    return {"access_token": access_token, "token_type": "bearer"}
