# backend/app/schemas/purchase.py
from datetime import datetime
from typing import Annotated, Optional, List
from pydantic import BaseModel, BeforeValidator, Field
from app.models.purchase import PurchaseStatus

StrID = Annotated[str, BeforeValidator(str)]


class PurchaseItemCreate(BaseModel):
    ingredient_id: Optional[int] = None
    ingredient_name: str = Field(..., min_length=1, max_length=255)
    quantity: float = Field(..., gt=0)
    unit: str = Field(..., max_length=10)
    unit_price: Optional[float] = Field(None, ge=0)
    total_price: Optional[float] = Field(None, ge=0)


class PurchaseItemOut(BaseModel):
    id: StrID
    purchase_id: StrID
    ingredient_id: Optional[StrID]
    ingredient_name: str
    quantity: float
    unit: str
    unit_price: Optional[float]
    total_price: Optional[float]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PurchaseCreate(BaseModel):
    supplier: Optional[str] = Field(None, max_length=255)
    invoice_number: Optional[str] = Field(None, max_length=100)
    total_amount: Optional[float] = Field(None, ge=0)
    currency: str = Field("EUR", max_length=3)
    notes: Optional[str] = None
    purchase_date: Optional[datetime] = None
    items: List[PurchaseItemCreate] = []


class PurchaseUpdate(BaseModel):
    supplier: Optional[str] = Field(None, max_length=255)
    invoice_number: Optional[str] = Field(None, max_length=100)
    total_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    status: Optional[PurchaseStatus] = None


class PurchaseOut(BaseModel):
    id: StrID
    brewery_id: StrID
    supplier: Optional[str]
    invoice_number: Optional[str]
    invoice_url: Optional[str]
    total_amount: Optional[float]
    currency: str
    status: PurchaseStatus
    notes: Optional[str]
    purchase_date: Optional[datetime]
    items: List[PurchaseItemOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
