from sqlalchemy import Column, String, Numeric, DateTime, Enum as SQLEnum, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class IngredientCategory(str, enum.Enum):
    MALT = "malt"
    HOP = "hop"
    YEAST = "yeast"
    ADJUNCT = "adjunct"
    FINING = "fining"
    CHEMICAL = "chemical"
    CONSUMABLE = "consumable"
    PACKAGING = "packaging"
    OTHER = "other"


class IngredientStatus(str, enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    EXPIRED = "expired"
    OUT_OF_STOCK = "out_of_stock"


class HopForm(str, enum.Enum):
    PELLET = "pellet"
    FLOWER = "flower"
    PLUG = "plug"


class Ingredient(Base):
    __tablename__ = "ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Basic info
    name = Column(String, nullable=False, index=True)
    category = Column(SQLEnum(IngredientCategory), nullable=False, index=True)
    subcategory = Column(String, nullable=True)  # "base malt", "crystal", "bittering hop", etc.
    
    # Quantity
    quantity = Column(Numeric(10, 3), nullable=False, default=0)
    unit = Column(String, nullable=False)  # kg, g, oz, lb, L, ml, units
    
    # Cost
    cost_per_unit = Column(Numeric(10, 2), nullable=True)
    currency = Column(String, default="EUR", nullable=False)
    
    # Purchase info
    supplier = Column(String, nullable=True, index=True)
    purchase_date = Column(Date, nullable=True)
    opened_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True, index=True)
    batch_number = Column(String, nullable=True)
    
    # Hop-specific
    aa_percent = Column(Numeric(5, 2), nullable=True)  # Alpha acid %
    form = Column(SQLEnum(HopForm), nullable=True)
    
    # Status & inventory
    status = Column(SQLEnum(IngredientStatus), nullable=False, default=IngredientStatus.AVAILABLE)
    min_threshold = Column(Numeric(10, 3), nullable=True)
    lead_time_days = Column(Numeric(5, 0), nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    movements = relationship("Movement", back_populates="ingredient", cascade="all, delete-orphan")
    batches = relationship("Batch", back_populates="ingredient", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Ingredient(id={self.id}, name={self.name}, quantity={self.quantity} {self.unit})>"
