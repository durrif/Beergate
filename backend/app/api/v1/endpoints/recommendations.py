from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from typing import Optional

router = APIRouter()


@router.post("/possible-recipes")
async def get_possible_recipes(
    available_only: bool = True,
    style: Optional[str] = None,
    abv_min: Optional[float] = None,
    abv_max: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get recipes that can be brewed with current inventory."""
    # TODO: Implement recommendation engine
    return {
        "message": "Recommendation engine not implemented yet",
        "recipes": []
    }


@router.post("/substitutions")
async def get_substitutions(
    ingredient_id: str,
    quantity: float,
    unit: str,
    db: AsyncSession = Depends(get_db)
):
    """Get substitution suggestions for an ingredient."""
    # TODO: Implement ML-based substitution engine
    return {
        "message": "Substitution engine not implemented yet",
        "substitutions": []
    }


@router.post("/optimize-recipe")
async def optimize_recipe(
    recipe_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Compare recipe with reference recipes and suggest optimizations."""
    # TODO: Implement comparison with reference recipes
    return {
        "message": "Recipe optimization not implemented yet",
        "suggestions": []
    }


@router.get("/alerts")
async def get_reorder_alerts(
    db: AsyncSession = Depends(get_db)
):
    """Get reorder alerts based on inventory levels."""
    from sqlalchemy import select, and_
    from app.models.ingredient import Ingredient
    from datetime import date, timedelta
    
    # Low stock
    result = await db.execute(
        select(Ingredient).where(
            and_(
                Ingredient.min_threshold.isnot(None),
                Ingredient.quantity < Ingredient.min_threshold
            )
        )
    )
    low_stock = result.scalars().all()
    
    # Expiring soon (next 30 days)
    soon = date.today() + timedelta(days=30)
    result = await db.execute(
        select(Ingredient).where(
            and_(
                Ingredient.expiry_date.isnot(None),
                Ingredient.expiry_date <= soon,
                Ingredient.expiry_date >= date.today()
            )
        )
    )
    expiring = result.scalars().all()
    
    return {
        "low_stock": [
            {
                "id": str(ing.id),
                "name": ing.name,
                "quantity": float(ing.quantity),
                "unit": ing.unit,
                "min_threshold": float(ing.min_threshold),
                "supplier": ing.supplier
            }
            for ing in low_stock
        ],
        "expiring_soon": [
            {
                "id": str(ing.id),
                "name": ing.name,
                "quantity": float(ing.quantity),
                "unit": ing.unit,
                "expiry_date": ing.expiry_date.isoformat(),
                "days_until_expiry": (ing.expiry_date - date.today()).days
            }
            for ing in expiring
        ]
    }
