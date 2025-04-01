
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from util.get_db import get_db
from model.analytics_model import InventoryAnalytics
from model.user_model import User, RoleEnum
from util.auth import oauth2_bearer, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter(tags=["Analytics"], prefix="/analytics")

def get_current_admin(token: str = Depends(oauth2_bearer), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()

        if not user or user.role != RoleEnum.admin:
            raise HTTPException(status_code=403, detail="Only admin can view analytics")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/inventory")
async def get_inventory_analytics(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    analytics = db.query(InventoryAnalytics).all()
    return analytics
