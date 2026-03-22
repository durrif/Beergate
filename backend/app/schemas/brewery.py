# backend/app/schemas/brewery.py
from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, BeforeValidator, Field

StrID = Annotated[str, BeforeValidator(str)]


class BreweryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: str | None = None
    location: str | None = None


class BreweryOut(BaseModel):
    id: StrID
    name: str
    description: str | None
    location: str | None
    logo_url: str | None
    owner_id: StrID
    created_at: datetime

    model_config = {"from_attributes": True}


class BreweryUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=200)
    description: str | None = None
    location: str | None = None
