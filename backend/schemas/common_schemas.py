from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AddUserResponse(BaseModel):
    status_code : int
    detail : str
    user_id : Optional[str] = None


class LogoutRequest(BaseModel):
    email: str


class LogoutResponse(BaseModel):
    status_code: int
    detail: str
    last_login: datetime




class PromptRequest(BaseModel):
    prompt: str