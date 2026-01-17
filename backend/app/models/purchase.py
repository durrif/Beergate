from sqlalchemy import Column, String, Numeric, DateTime, Enum as SQLEnum, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class PurchaseStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    MATCHED = "matched"
    COMPLETED = "completed"


class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    supplier = Column(String, nullable=True, index=True)
    purchase_date = Column(Date, nullable=False, index=True)
    total_cost = Column(Numeric(10, 2), nullable=True)
    currency = Column(String, default="EUR", nullable=False)
    
    invoice_number = Column(String, nullable=True, index=True)
    invoice_file_path = Column(String, nullable=True)  # Path to uploaded PDF
    invoice_parsed_data = Column(JSONB, nullable=True)  # Raw parsed data from OCR
    
    status = Column(SQLEnum(PurchaseStatus), nullable=False, default=PurchaseStatus.PENDING, index=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")
    movements = relationship("Movement", back_populates="purchase")
    
    def __repr__(self):
        return f"<Purchase(id={self.id}, supplier={self.supplier}, status={self.status})>"


class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    purchase_id = Column(UUID(as_uuid=True), ForeignKey("purchases.id"), nullable=False, index=True)
    
    product_name_raw = Column(String, nullable=False)  # Raw name from invoice
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True, index=True)  # Matched ingredient
    
    quantity = Column(Numeric(10, 3), nullable=False)
    unit = Column(String, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=True)
    total_price = Column(Numeric(10, 2), nullable=True)
    
    matched_confidence = Column(Numeric(4, 3), nullable=True)  # 0.0-1.0 confidence score from ML matching
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    purchase = relationship("Purchase", back_populates="items")
    ingredient = relationship("Ingredient")
    
    def __repr__(self):
        return f"<PurchaseItem(id={self.id}, product={self.product_name_raw}, matched_id={self.ingredient_id})>"
