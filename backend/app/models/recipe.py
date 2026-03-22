# backend/app/models/recipe.py
"""Recipe and style models for Beergate v2."""
from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class RecipeStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    brewery_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    style: Mapped[str | None] = mapped_column(String(100))          # BJCP style name
    style_code: Mapped[str | None] = mapped_column(String(20))      # e.g. "10A"
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[RecipeStatus] = mapped_column(
        Enum(RecipeStatus, name="recipe_status_enum"),
        default=RecipeStatus.draft,
        nullable=False,
    )

    # Batch parameters
    batch_size_liters: Mapped[float | None] = mapped_column(Float)
    efficiency_pct: Mapped[float | None] = mapped_column(Float, default=75.0)

    # Calculated parameters (stored for quick display)
    og: Mapped[float | None] = mapped_column(Float)      # Original Gravity
    fg: Mapped[float | None] = mapped_column(Float)      # Final Gravity
    abv: Mapped[float | None] = mapped_column(Float)     # % vol
    ibu: Mapped[float | None] = mapped_column(Float)     # Bitterness
    srm: Mapped[float | None] = mapped_column(Float)     # Colour (SRM)
    ebc: Mapped[float | None] = mapped_column(Float)     # Colour (EBC)

    # Structured recipe data (ingredients, steps, water profile, mash schedule)
    fermentables: Mapped[list[dict] | None] = mapped_column(JSON)    # [{name, amount_kg, color_ebc, type}, …]
    hops: Mapped[list[dict] | None] = mapped_column(JSON)            # [{name, amount_g, alpha_pct, time_min, use}, …]
    yeasts: Mapped[list[dict] | None] = mapped_column(JSON)          # [{name, lab, attenuation_pct, temp_range}, …]
    adjuncts: Mapped[list[dict] | None] = mapped_column(JSON)        # [{name, amount, unit, use}, …]
    mash_steps: Mapped[list[dict] | None] = mapped_column(JSON)      # [{name, temp_c, duration_min}, …]
    water_profile: Mapped[dict | None] = mapped_column(JSON)         # {ca, mg, na, cl, so4, hco3} ppm
    notes: Mapped[str | None] = mapped_column(Text)

    # External IDs
    brewers_friend_id: Mapped[str | None] = mapped_column(String(64))
    beerxml_source: Mapped[str | None] = mapped_column(String(500))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    brewery: Mapped[Any] = relationship("Brewery", back_populates="recipes")
    brew_sessions: Mapped[list["BrewSession"]] = relationship(
        "BrewSession", back_populates="recipe"
    )
