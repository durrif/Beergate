# backend/app/schemas/water.py
"""Pydantic schemas for water profile analysis."""
from __future__ import annotations

from pydantic import BaseModel, Field


class WaterProfileIn(BaseModel):
    name: str = "Mi Agua"
    calcium: float = Field(ge=0, le=1000, default=0)
    magnesium: float = Field(ge=0, le=500, default=0)
    sodium: float = Field(ge=0, le=500, default=0)
    sulfate: float = Field(ge=0, le=1000, default=0)
    chloride: float = Field(ge=0, le=1000, default=0)
    bicarbonate: float = Field(ge=0, le=1000, default=0)
    ph: float = Field(ge=0, le=14, default=7.0)


class AdjustmentRequest(BaseModel):
    profile: WaterProfileIn
    style: str = "balanced"
    batch_liters: float = Field(ge=1, le=1000, default=20)
