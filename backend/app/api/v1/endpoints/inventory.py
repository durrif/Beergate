from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.database import get_db
from app.models.ingredient import Ingredient, IngredientCategory, IngredientStatus
from app.models.movement import Movement
from decimal import Decimal
from datetime import date

router = APIRouter()


@router.get("/")
async def list_inventory(
    category: Optional[IngredientCategory] = None,
    status: Optional[IngredientStatus] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List inventory with filters."""
    query = select(Ingredient)
    
    # Apply filters
    filters = []
    if category:
        filters.append(Ingredient.category == category)
    if status:
        filters.append(Ingredient.status == status)
    if search:
        filters.append(Ingredient.name.ilike(f"%{search}%"))
    
    if filters:
        query = query.where(and_(*filters))
    
    query = query.offset(skip).limit(limit).order_by(Ingredient.name)
    
    result = await db.execute(query)
    ingredients = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(ing.id),
                "name": ing.name,
                "category": ing.category,
                "quantity": float(ing.quantity),
                "unit": ing.unit,
                "status": ing.status,
                "supplier": ing.supplier,
                "expiry_date": ing.expiry_date.isoformat() if ing.expiry_date else None,
                "min_threshold": float(ing.min_threshold) if ing.min_threshold else None
            }
            for ing in ingredients
        ],
        "total": len(ingredients)
    }


@router.post("/")
async def create_ingredient(
    name: str,
    category: IngredientCategory,
    quantity: float,
    unit: str,
    subcategory: Optional[str] = None,
    supplier: Optional[str] = None,
    cost_per_unit: Optional[float] = None,
    min_threshold: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a new ingredient."""
    # TODO: Get user_id from auth token
    user_id = "00000000-0000-0000-0000-000000000000"  # Placeholder
    
    ingredient = Ingredient(
        user_id=user_id,
        name=name,
        category=category,
        subcategory=subcategory,
        quantity=Decimal(str(quantity)),
        unit=unit,
        supplier=supplier,
        cost_per_unit=Decimal(str(cost_per_unit)) if cost_per_unit else None,
        min_threshold=Decimal(str(min_threshold)) if min_threshold else None,
        status=IngredientStatus.AVAILABLE
    )
    
    db.add(ingredient)
    await db.commit()
    await db.refresh(ingredient)
    
    return {
        "id": str(ingredient.id),
        "name": ingredient.name,
        "category": ingredient.category,
        "quantity": float(ingredient.quantity),
        "unit": ingredient.unit
    }


@router.get("/{ingredient_id}")
async def get_ingredient(
    ingredient_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get ingredient details."""
    result = await db.execute(
        select(Ingredient).where(Ingredient.id == ingredient_id)
    )
    ingredient = result.scalar_one_or_none()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    return {
        "id": str(ingredient.id),
        "name": ingredient.name,
        "category": ingredient.category,
        "subcategory": ingredient.subcategory,
        "quantity": float(ingredient.quantity),
        "unit": ingredient.unit,
        "cost_per_unit": float(ingredient.cost_per_unit) if ingredient.cost_per_unit else None,
        "supplier": ingredient.supplier,
        "purchase_date": ingredient.purchase_date.isoformat() if ingredient.purchase_date else None,
        "expiry_date": ingredient.expiry_date.isoformat() if ingredient.expiry_date else None,
        "status": ingredient.status,
        "min_threshold": float(ingredient.min_threshold) if ingredient.min_threshold else None,
        "aa_percent": float(ingredient.aa_percent) if ingredient.aa_percent else None,
        "form": ingredient.form,
        "notes": ingredient.notes
    }


@router.get("/{ingredient_id}/movements")
async def get_ingredient_movements(
    ingredient_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get movement history for an ingredient."""
    result = await db.execute(
        select(Movement)
        .where(Movement.ingredient_id == ingredient_id)
        .order_by(Movement.created_at.desc())
        .limit(limit)
    )
    movements = result.scalars().all()
    
    return {
        "movements": [
            {
                "id": str(m.id),
                "type": m.type,
                "quantity": float(m.quantity),
                "unit": m.unit,
                "cost": float(m.cost) if m.cost else None,
                "notes": m.notes,
                "created_at": m.created_at.isoformat()
            }
            for m in movements
        ]
    }


@router.get("/stats")
async def get_inventory_stats(
    db: AsyncSession = Depends(get_db)
):
    """Get inventory statistics."""
    # Total ingredients
    result = await db.execute(select(Ingredient))
    all_ingredients = result.scalars().all()
    
    total_value = sum(
        float(ing.quantity * ing.cost_per_unit) if ing.cost_per_unit else 0
        for ing in all_ingredients
    )
    
    # Low stock count
    low_stock = sum(
        1 for ing in all_ingredients
        if ing.min_threshold and ing.quantity < ing.min_threshold
    )
    
    # Expiring soon (next 30 days)
    from datetime import datetime, timedelta
    soon = date.today() + timedelta(days=30)
    expiring_soon = sum(
        1 for ing in all_ingredients
        if ing.expiry_date and ing.expiry_date <= soon and ing.expiry_date >= date.today()
    )
    
    return {
        "total_ingredients": len(all_ingredients),
        "total_value_eur": round(total_value, 2),
        "low_stock_alerts": low_stock,
        "expiring_soon": expiring_soon
    }
