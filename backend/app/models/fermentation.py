# backend/app/models/fermentation.py
"""Fermentation data points — iSpindel / manual entry."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FermentationDataPoint(Base):
    __tablename__ = "fermentation_data"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    session_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("brew_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Sensor readings
    temperature: Mapped[float | None] = mapped_column(Float)          # °C
    gravity: Mapped[float | None] = mapped_column(Float)              # SG e.g. 1.050
    angle: Mapped[float | None] = mapped_column(Float)                # iSpindel tilt angle
    battery: Mapped[float | None] = mapped_column(Float)              # iSpindel battery V
    rssi: Mapped[int | None] = mapped_column(Integer)                 # WiFi signal
    source: Mapped[str] = mapped_column(
        String(20), default="manual", nullable=False
    )  # "ispindel" | "manual" | "tilt"

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    session: Mapped[Any] = relationship("BrewSession", back_populates="fermentation_data")
