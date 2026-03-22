# backend/app/schemas/ingredient.py
from datetime import date, datetime
from typing import Annotated, Optional
from pydantic import BaseModel, BeforeValidator, Field, model_validator
from app.models.ingredient import IngredientCategory, IngredientUnit

# Coerce int IDs to strings so the API always returns string IDs
StrID = Annotated[str, BeforeValidator(str)]


class IngredientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: IngredientCategory
    quantity: float = Field(..., ge=0)
    unit: IngredientUnit = IngredientUnit.kg
    min_stock: Optional[float] = Field(None, ge=0)
    purchase_price: Optional[float] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=255)
    origin: Optional[str] = Field(None, max_length=255)
    flavor_profile: Optional[str] = None
    expiry_date: Optional[date] = None
    lot_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class IngredientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[IngredientCategory] = None
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[IngredientUnit] = None
    min_stock: Optional[float] = Field(None, ge=0)
    purchase_price: Optional[float] = Field(None, ge=0)
    supplier: Optional[str] = Field(None, max_length=255)
    origin: Optional[str] = Field(None, max_length=255)
    flavor_profile: Optional[str] = None
    expiry_date: Optional[date] = None
    lot_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class IngredientOut(BaseModel):
    id: StrID
    brewery_id: StrID
    name: str
    category: IngredientCategory
    quantity: float
    unit: IngredientUnit
    min_stock: Optional[float]
    purchase_price: Optional[float]
    supplier: Optional[str]
    origin: Optional[str]
    flavor_profile: Optional[str]
    expiry_date: Optional[date]
    lot_number: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StockAdjust(BaseModel):
    """Adjust stock by delta (positive = add, negative = remove)."""
    delta: float
    reason: Optional[str] = None
