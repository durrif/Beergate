# backend/app/models/brew_session.py
"""Brew session and step models."""
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


class SessionPhase(str, enum.Enum):
    planned = "planned"
    mashing = "mashing"
    lautering = "lautering"
    boiling = "boiling"
    cooling = "cooling"
    fermenting = "fermenting"
    conditioning = "conditioning"
    packaging = "packaging"
    completed = "completed"
    aborted = "aborted"


class BrewSession(Base):
    __tablename__ = "brew_sessions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    brewery_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipe_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    batch_number: Mapped[int | None] = mapped_column(Integer)
    phase: Mapped[SessionPhase] = mapped_column(
        Enum(SessionPhase, name="session_phase_enum"),
        default=SessionPhase.planned,
        nullable=False,
    )

    # Planned vs actual measurements
    planned_batch_liters: Mapped[float | None] = mapped_column(Float)
    actual_batch_liters: Mapped[float | None] = mapped_column(Float)
    planned_og: Mapped[float | None] = mapped_column(Float)
    actual_og: Mapped[float | None] = mapped_column(Float)
    planned_fg: Mapped[float | None] = mapped_column(Float)
    actual_fg: Mapped[float | None] = mapped_column(Float)
    actual_abv: Mapped[float | None] = mapped_column(Float)
    efficiency_pct: Mapped[float | None] = mapped_column(Float)

    # Timing
    brew_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fermentation_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    packaging_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Step log as JSON [{step, start, end, notes}, …]
    step_log: Mapped[list[dict] | None] = mapped_column(JSON)
    notes: Mapped[str | None] = mapped_column(Text)

    # Brewer's Friend sync
    brewers_friend_batch_id: Mapped[str | None] = mapped_column(String(64))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    brewery: Mapped[Any] = relationship("Brewery", back_populates="brew_sessions")
    recipe: Mapped[Any] = relationship("Recipe", back_populates="brew_sessions")
    fermentation_data: Mapped[list["FermentationDataPoint"]] = relationship(
        "FermentationDataPoint",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="FermentationDataPoint.recorded_at",
    )
