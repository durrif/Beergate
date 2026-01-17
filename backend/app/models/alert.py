from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class AlertType(str, enum.Enum):
    LOW_STOCK = "low_stock"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"
    REORDER_SUGGESTION = "reorder_suggestion"


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=True, index=True)
    
    type = Column(SQLEnum(AlertType), nullable=False, index=True)
    message = Column(Text, nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, default=AlertSeverity.INFO)
    
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.type}, severity={self.severity})>"
