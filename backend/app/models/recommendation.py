from sqlalchemy import Column, String, Numeric, DateTime, Enum as SQLEnum, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class RecommendationType(str, enum.Enum):
    POSSIBLE_RECIPES = "possible_recipes"
    SUBSTITUTION = "substitution"
    OPTIMIZATION = "optimization"
    REORDER = "reorder"


class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=True, index=True)
    
    type = Column(SQLEnum(RecommendationType), nullable=False, index=True)
    
    # Structure: [{"item": "...", "reason": "...", "confidence": 0.85}]
    suggestions_json = Column(JSONB, nullable=False)
    confidence_score = Column(Numeric(4, 3), nullable=True)
    
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    def __repr__(self):
        return f"<Recommendation(id={self.id}, type={self.type}, confidence={self.confidence_score})>"
