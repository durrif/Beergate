# backend/app/models/price.py
"""Price records and alert models for competitive price comparison."""
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PriceRecord(Base):
    __tablename__ = "price_records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    # canonical ingredient name (normalised for cross-shop comparison)
    ingredient_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    shop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    shop_url: Mapped[str | None] = mapped_column(String(500))
    product_url: Mapped[str | None] = mapped_column(String(500))
    product_name: Mapped[str | None] = mapped_column(String(300))  # raw shop title
    price: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")
    price_per_kg: Mapped[float | None] = mapped_column(Float)  # normalised to €/kg
    in_stock: Mapped[bool | None] = mapped_column()
    scraped_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


class AlertType(str, enum.Enum):
    price_drop = "price_drop"
    back_in_stock = "back_in_stock"
    price_increase = "price_increase"


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    brewery_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ingredient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    alert_type: Mapped[AlertType] = mapped_column(
        Enum(AlertType, name="alert_type_enum"), nullable=False
    )
    threshold_price: Mapped[float | None] = mapped_column(Float)  # alert if below this
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    last_triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
