# backend/app/models/brewery.py
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Brewery(Base, TimestampMixin):
    """
    One brewery per user (brewer role).
    All inventory, recipes, sessions, etc. are scoped by brewery_id FK.
    """
    __tablename__ = "breweries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    water_profile: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Owner FK
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    owner: Mapped["User"] = relationship("User", back_populates="brewery")
    ingredients = relationship("Ingredient", back_populates="brewery", cascade="all, delete-orphan")
    purchases = relationship("Purchase", back_populates="brewery", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="brewery", cascade="all, delete-orphan")
    recipes = relationship("Recipe", back_populates="brewery", cascade="all, delete-orphan")
    brew_sessions = relationship("BrewSession", back_populates="brewery", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_breweries_owner_id", "owner_id"),
    )

    def __repr__(self) -> str:
        return f"<Brewery id={self.id} name={self.name}>"
