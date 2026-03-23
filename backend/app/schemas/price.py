# backend/app/schemas/price.py
"""Pydantic schemas for price comparison."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class PriceResultOut(BaseModel):
    ingredient_name: str
    shop_name: str
    shop_url: str
    product_url: str
    product_name: str
    price: float
    unit: str
    price_per_kg: float | None
    in_stock: bool
    cached: bool = False
    scraped_at: datetime | None = None


class RecipePriceComparison(BaseModel):
    ingredient_name: str
    cheapest_price: float | None
    cheapest_shop: str | None
    all_offers: list[PriceResultOut]
