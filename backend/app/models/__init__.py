# backend/app/models/__init__.py
# Import all models here so Alembic autogenerate can detect them
from app.models.base import Base, TimestampMixin
from app.models.user import User, RoleEnum
from app.models.brewery import Brewery
from app.models.ingredient import Ingredient, IngredientCategory, IngredientUnit
from app.models.purchase import Purchase, PurchaseItem, PurchaseStatus
from app.models.conversation import AIConversation, AIMessage, MessageRole
from app.models.recipe import Recipe, RecipeStatus
from app.models.brew_session import BrewSession, SessionPhase
from app.models.fermentation import FermentationDataPoint
from app.models.price import PriceRecord, PriceAlert, AlertType

__all__ = [
    "Base", "TimestampMixin",
    "User", "RoleEnum",
    "Brewery",
    "Ingredient", "IngredientCategory", "IngredientUnit",
    "Purchase", "PurchaseItem", "PurchaseStatus",
    "AIConversation", "AIMessage", "MessageRole",
    "Recipe", "RecipeStatus",
    "BrewSession", "SessionPhase",
    "FermentationDataPoint",
    "PriceRecord", "PriceAlert", "AlertType",
]

