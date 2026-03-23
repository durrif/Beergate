# backend/app/schemas/brewing.py
"""Pydantic schemas for brew sessions."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, Field

from app.models.brew_session import SessionPhase

StrID = Annotated[str, BeforeValidator(str)]


class SessionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    recipe_id: int | None = None
    batch_number: int | None = None
    planned_batch_liters: float | None = None
    planned_og: float | None = None
    planned_fg: float | None = None
    brew_date: datetime | None = None
    notes: str | None = None


class SessionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    phase: SessionPhase | None = None
    actual_batch_liters: float | None = None
    actual_og: float | None = None
    actual_fg: float | None = None
    actual_abv: float | None = None
    efficiency_pct: float | None = None
    fermentation_start: datetime | None = None
    packaging_date: datetime | None = None
    step_log: list[dict] | None = None
    notes: str | None = None


class SessionOut(BaseModel):
    id: StrID
    brewery_id: StrID
    recipe_id: StrID | None
    name: str
    batch_number: int | None
    phase: str
    planned_batch_liters: float | None
    actual_batch_liters: float | None
    planned_og: float | None
    actual_og: float | None
    planned_fg: float | None
    actual_fg: float | None
    actual_abv: float | None
    efficiency_pct: float | None
    brew_date: datetime | None
    fermentation_start: datetime | None
    packaging_date: datetime | None
    step_log: list[dict] | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PhaseAdvance(BaseModel):
    phase: SessionPhase
    notes: str | None = None
