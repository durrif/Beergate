# backend/app/models/ingredient.py
from sqlalchemy import Column, String, Float, Integer, Date, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin
import enum


class IngredientCategory(str, enum.Enum):
    malta_base = "malta_base"
    malta_especial = "malta_especial"
    malta_otra = "malta_otra"
    lupulo = "lupulo"
    levadura = "levadura"
    adjunto = "adjunto"
    otro = "otro"


class IngredientUnit(str, enum.Enum):
    kg = "kg"
    g = "g"
    l = "l"
    ml = "ml"
    pkt = "pkt"
    unit = "unit"


class Ingredient(Base, TimestampMixin):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    brewery_id = Column(Integer, ForeignKey("breweries.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(SAEnum(IngredientCategory), nullable=False, index=True)
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(SAEnum(IngredientUnit), nullable=False, default=IngredientUnit.kg)
    min_stock = Column(Float, nullable=True)
    purchase_price = Column(Float, nullable=True)
    supplier = Column(String(255), nullable=True)
    origin = Column(String(255), nullable=True)
    flavor_profile = Column(Text, nullable=True)
    expiry_date = Column(Date, nullable=True, index=True)
    lot_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    brewery = relationship("Brewery", back_populates="ingredients")
    purchase_items = relationship("PurchaseItem", back_populates="ingredient", cascade="all, delete-orphan")
