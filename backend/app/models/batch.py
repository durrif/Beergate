from sqlalchemy import Column, String, Numeric, DateTime, Enum as SQLEnum, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class BatchStatus(str, enum.Enum):
    ACTIVE = "active"
    DEPLETED = "depleted"
    EXPIRED = "expired"


class Batch(Base):
    __tablename__ = "batches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False, index=True)
    
    batch_number = Column(String, nullable=False, index=True)
    quantity_initial = Column(Numeric(10, 3), nullable=False)
    quantity_remaining = Column(Numeric(10, 3), nullable=False)
    unit = Column(String, nullable=False)
    
    cost_per_unit = Column(Numeric(10, 2), nullable=True)
    purchase_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    supplier = Column(String, nullable=True)
    
    status = Column(SQLEnum(BatchStatus), nullable=False, default=BatchStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    ingredient = relationship("Ingredient", back_populates="batches")
    
    def __repr__(self):
        return f"<Batch(id={self.id}, batch_number={self.batch_number}, remaining={self.quantity_remaining} {self.unit})>"
