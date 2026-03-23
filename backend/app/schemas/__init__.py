# backend/app/schemas/__init__.py
"""Re-export all schema classes for convenient access."""

from app.schemas.auth import (
    InviteAcceptRequest,
    InviteRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.brewery import BreweryCreate, BreweryOut, BreweryUpdate
from app.schemas.brewing import PhaseAdvance, SessionCreate, SessionOut, SessionUpdate
from app.schemas.fermentation import DataPointIn, DataPointOut, ISpindelPayload
from app.schemas.ingredient import IngredientCreate, IngredientOut, IngredientUpdate, StockAdjust
from app.schemas.price import PriceResultOut, RecipePriceComparison
from app.schemas.purchase import PurchaseCreate, PurchaseItemCreate, PurchaseItemOut, PurchaseOut, PurchaseUpdate
from app.schemas.recipe import CanBrewItem, CanBrewLowStock, CanBrewResult, RecipeCreate, RecipeOut, RecipeUpdate
from app.schemas.user import UserOut, UserUpdate
from app.schemas.water import AdjustmentRequest, WaterProfileIn

__all__ = [
    # Auth
    "RegisterRequest", "LoginRequest", "TokenResponse", "RefreshRequest",
    "InviteRequest", "InviteAcceptRequest",
    # Brewery
    "BreweryCreate", "BreweryOut", "BreweryUpdate",
    # Brewing
    "SessionCreate", "SessionUpdate", "SessionOut", "PhaseAdvance",
    # Fermentation
    "DataPointIn", "DataPointOut", "ISpindelPayload",
    # Ingredient
    "IngredientCreate", "IngredientUpdate", "IngredientOut", "StockAdjust",
    # Price
    "PriceResultOut", "RecipePriceComparison",
    # Purchase
    "PurchaseCreate", "PurchaseUpdate", "PurchaseOut",
    "PurchaseItemCreate", "PurchaseItemOut",
    # Recipe
    "RecipeCreate", "RecipeUpdate", "RecipeOut",
    "CanBrewItem", "CanBrewLowStock", "CanBrewResult",
    # User
    "UserOut", "UserUpdate",
    # Water
    "WaterProfileIn", "AdjustmentRequest",
]
