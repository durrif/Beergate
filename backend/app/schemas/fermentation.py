# backend/app/schemas/fermentation.py
"""Pydantic schemas for fermentation data and iSpindel payloads."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, Field

StrID = Annotated[str, BeforeValidator(str)]


class DataPointIn(BaseModel):
    temperature: float | None = None
    gravity: float | None = None
    angle: float | None = None
    battery: float | None = None
    rssi: int | None = None
    source: str = Field("manual", max_length=20)
    recorded_at: datetime | None = None


class DataPointOut(BaseModel):
    id: StrID
    session_id: StrID
    temperature: float | None
    gravity: float | None
    angle: float | None
    battery: float | None
    rssi: int | None
    source: str
    recorded_at: datetime

    model_config = {"from_attributes": True}


class ISpindelPayload(BaseModel):
    """iSpindel sends this JSON to the webhook URL."""
    name: str
    ID: int
    angle: float
    temperature: float
    temp_units: str = "C"
    battery: float
    gravity: float
    interval: int
    RSSI: int
