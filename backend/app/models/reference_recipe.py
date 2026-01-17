from sqlalchemy import Column, String, Numeric, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class ReferenceRecipe(Base):
    """Reference recipes from competitions (BJCP, World Beer Cup, etc.)."""
    __tablename__ = "reference_recipes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    name = Column(String, nullable=False, index=True)
    style_bjcp = Column(String, nullable=False, index=True)
    source = Column(String, nullable=False)  # e.g., "GABF 2023", "Brewing Network"
    
    # Awards: [{"competition": "GABF", "year": 2023, "medal": "gold"}]
    awards_json = Column(JSONB, nullable=True)
    
    # Normalized ingredients for comparison
    # Structure: {"malts": [...], "hops": [...], "yeast": "..."}
    ingredients_json = Column(JSONB, nullable=False)
    
    # Beer specs
    abv = Column(Numeric(4, 2), nullable=True)
    ibu = Column(Numeric(6, 2), nullable=True)
    srm = Column(Numeric(5, 2), nullable=True)
    og = Column(Numeric(5, 4), nullable=True)
    fg = Column(Numeric(5, 4), nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<ReferenceRecipe(id={self.id}, name={self.name}, style={self.style_bjcp})>"
