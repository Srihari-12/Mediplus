from fastapi import Depends, HTTPException, status
from model.user_model import RoleEnum
from util.auth import get_current_user
from model.user_model import User

def admin_only(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access only"
        )
    return current_user
