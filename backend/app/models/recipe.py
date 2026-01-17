from sqlalchemy import Column, String, Numeric, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class RecipeStatus(str, enum.Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    BREWING = "brewing"
    COMPLETED = "completed"


class RecipeSource(str, enum.Enum):
    MANUAL = "manual"
    BEERXML = "beerxml"
    IMPORTED = "imported"


class FermentationType(str, enum.Enum):
    ALE = "ale"
    LAGER = "lager"
    MIXED = "mixed"
    SPONTANEOUS = "spontaneous"


class UsageType(str, enum.Enum):
    MASH = "mash"
    BOIL = "boil"
    FERMENTATION = "fermentation"
    DRY_HOP = "dry_hop"
    PACKAGING = "packaging"


class Recipe(Base):
    __tablename__ = "recipes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Basic info
    name = Column(String, nullable=False, index=True)
    style_bjcp = Column(String, nullable=True, index=True)  # e.g., "21A American IPA"
    batch_size_liters = Column(Numeric(8, 2), nullable=False)
    
    # Beer specs
    abv = Column(Numeric(4, 2), nullable=True)
    ibu = Column(Numeric(6, 2), nullable=True)
    srm = Column(Numeric(5, 2), nullable=True)
    og = Column(Numeric(5, 4), nullable=True)
    fg = Column(Numeric(5, 4), nullable=True)
    fermentation_type = Column(SQLEnum(FermentationType), nullable=True)
    
    # Ingredients (denormalized for quick queries)
    # Structure: [{"ingredient_id": "uuid", "quantity": 5.0, "unit": "kg", "usage_type": "mash"}]
    ingredients_json = Column(JSONB, nullable=True)
    
    # BeerXML
    beerxml_content = Column(Text, nullable=True)
    
    # Source & status
    source = Column(SQLEnum(RecipeSource), nullable=False, default=RecipeSource.MANUAL)
    status = Column(SQLEnum(RecipeStatus), nullable=False, default=RecipeStatus.DRAFT, index=True)
    
    # Cost
    cost_calculated = Column(Numeric(10, 2), nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    brewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    movements = relationship("Movement", back_populates="recipe")
    
    def __repr__(self):
        return f"<Recipe(id={self.id}, name={self.name}, status={self.status})>"


class RecipeIngredient(Base):
    """Junction table for recipe ingredients with detailed info."""
    __tablename__ = "recipe_ingredients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.id"), nullable=False, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id"), nullable=False, index=True)
    
    quantity = Column(Numeric(10, 3), nullable=False)
    unit = Column(String, nullable=False)
    usage_type = Column(SQLEnum(UsageType), nullable=True)
    timing_minutes = Column(Numeric(5, 0), nullable=True)  # e.g., 60 min boil
    
    # Relationships
    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient")
    
    def __repr__(self):
        return f"<RecipeIngredient(recipe_id={self.recipe_id}, ingredient_id={self.ingredient_id}, quantity={self.quantity})>"
