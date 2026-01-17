from sqlalchemy import Column, String, Numeric, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class MovementType(str, enum.Enum):
    PURCHASE = "purchase"
    USAGE = "usage"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"
    EXPIRY = "expiry"


class Movement(Base):
    __tablename__ = "movements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False, index=True)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=True, index=True)
    purchase_id = Column(UUID(as_uuid=True), ForeignKey("purchases.id"), nullable=True, index=True)
    
    type = Column(SQLEnum(MovementType), nullable=False, index=True)
    quantity = Column(Numeric(10, 3), nullable=False)
    unit = Column(String, nullable=False)
    cost = Column(Numeric(10, 2), nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    ingredient = relationship("Ingredient", back_populates="movements")
    recipe = relationship("Recipe", back_populates="movements")
    purchase = relationship("Purchase", back_populates="movements")
    
    def __repr__(self):
        return f"<Movement(id={self.id}, type={self.type}, quantity={self.quantity} {self.unit})>"
