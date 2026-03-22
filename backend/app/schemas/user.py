# backend/app/schemas/user.py
from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, BeforeValidator, EmailStr, Field
from app.models.user import RoleEnum

StrID = Annotated[str, BeforeValidator(str)]


class UserOut(BaseModel):
    id: StrID
    email: EmailStr
    full_name: str
    role: RoleEnum
    is_active: bool
    preferred_language: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=150)
    preferred_language: str | None = Field(None, pattern="^(es|en)$")
