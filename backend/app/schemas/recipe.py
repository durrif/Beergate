# backend/app/schemas/recipe.py
"""Pydantic schemas for recipes and can-brew check."""
from __future__ import annotations

from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, Field

from app.models.recipe import RecipeStatus

StrID = Annotated[str, BeforeValidator(str)]


class RecipeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    style: str | None = Field(None, max_length=100)
    style_code: str | None = Field(None, max_length=20)
    description: str | None = None
    batch_size_liters: float | None = None
    efficiency_pct: float | None = None
    og: float | None = None
    fg: float | None = None
    abv: float | None = None
    ibu: float | None = None
    srm: float | None = None
    ebc: float | None = None
    fermentables: list[dict] | None = None
    hops: list[dict] | None = None
    yeasts: list[dict] | None = None
    adjuncts: list[dict] | None = None
    mash_steps: list[dict] | None = None
    water_profile: dict | None = None
    notes: str | None = None


class RecipeUpdate(RecipeCreate):
    name: str | None = None  # type: ignore[assignment]
    status: RecipeStatus | None = None


class RecipeOut(BaseModel):
    id: StrID
    brewery_id: StrID
    name: str
    style: str | None
    style_code: str | None
    description: str | None
    status: str
    batch_size_liters: float | None
    efficiency_pct: float | None
    og: float | None
    fg: float | None
    abv: float | None
    ibu: float | None
    srm: float | None
    ebc: float | None
    fermentables: list[dict] | None
    hops: list[dict] | None
    yeasts: list[dict] | None
    adjuncts: list[dict] | None
    mash_steps: list[dict] | None
    water_profile: dict | None
    notes: str | None
    brewers_friend_id: str | None
    created_at: Any | None = None
    updated_at: Any | None = None

    model_config = {"from_attributes": True}


class CanBrewItem(BaseModel):
    name: str
    required: float
    unit: str


class CanBrewLowStock(BaseModel):
    name: str
    required: float
    available: float
    unit: str


class CanBrewResult(BaseModel):
    status: str  # ready | partial | missing
    missing: list[CanBrewItem]
    low_stock: list[CanBrewLowStock]
    available: list[str]
