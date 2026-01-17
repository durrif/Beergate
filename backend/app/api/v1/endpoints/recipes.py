from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.recipe import Recipe, RecipeStatus
from typing import Optional

router = APIRouter()


@router.get("/")
async def list_recipes(
    skip: int = 0,
    limit: int = 50,
    status: Optional[RecipeStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    """List recipes."""
    from sqlalchemy import select
    
    query = select(Recipe).order_by(Recipe.created_at.desc()).offset(skip).limit(limit)
    
    if status:
        query = query.where(Recipe.status == status)
    
    result = await db.execute(query)
    recipes = result.scalars().all()
    
    return {
        "recipes": [
            {
                "id": str(r.id),
                "name": r.name,
                "style_bjcp": r.style_bjcp,
                "batch_size_liters": float(r.batch_size_liters),
                "abv": float(r.abv) if r.abv else None,
                "ibu": float(r.ibu) if r.ibu else None,
                "status": r.status,
                "cost_calculated": float(r.cost_calculated) if r.cost_calculated else None
            }
            for r in recipes
        ]
    }


@router.post("/import-beerxml")
async def import_beerxml(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Import recipe from BeerXML."""
    content = await file.read()
    
    # TODO: Parse BeerXML and create recipe
    # from app.services.beerxml_parser import parse_beerxml
    # recipe_data = parse_beerxml(content.decode('utf-8'))
    
    return {
        "message": "BeerXML import not implemented yet",
        "filename": file.filename
    }


@router.get("/{recipe_id}")
async def get_recipe(
    recipe_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get recipe details."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Recipe)
        .where(Recipe.id == recipe_id)
        .options(selectinload(Recipe.ingredients))
    )
    recipe = result.scalar_one_or_none()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    return {
        "id": str(recipe.id),
        "name": recipe.name,
        "style_bjcp": recipe.style_bjcp,
        "batch_size_liters": float(recipe.batch_size_liters),
        "abv": float(recipe.abv) if recipe.abv else None,
        "ibu": float(recipe.ibu) if recipe.ibu else None,
        "srm": float(recipe.srm) if recipe.srm else None,
        "og": float(recipe.og) if recipe.og else None,
        "fg": float(recipe.fg) if recipe.fg else None,
        "status": recipe.status,
        "ingredients_json": recipe.ingredients_json,
        "notes": recipe.notes
    }


@router.post("/{recipe_id}/brew")
async def brew_recipe(
    recipe_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Mark recipe as brewed and deduct ingredients from inventory."""
    from sqlalchemy import select
    from app.models.ingredient import Ingredient
    from app.models.movement import Movement, MovementType
    from datetime import datetime
    
    # TODO: Get user_id from auth
    user_id = "00000000-0000-0000-0000-000000000000"
    
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    if not recipe.ingredients_json:
        raise HTTPException(status_code=400, detail="Recipe has no ingredients")
    
    # Check if ingredients are available
    for ing_data in recipe.ingredients_json:
        ingredient_id = ing_data.get("ingredient_id")
        quantity = ing_data.get("quantity")
        
        result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
        ingredient = result.scalar_one_or_none()
        
        if not ingredient:
            raise HTTPException(
                status_code=400,
                detail=f"Ingredient {ingredient_id} not found"
            )
        
        if ingredient.quantity < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient {ingredient.name}: {ingredient.quantity} {ingredient.unit} available, {quantity} needed"
            )
    
    # Deduct ingredients and create movements
    movements_created = []
    total_cost = 0
    
    for ing_data in recipe.ingredients_json:
        ingredient_id = ing_data.get("ingredient_id")
        quantity = ing_data.get("quantity")
        unit = ing_data.get("unit")
        
        result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
        ingredient = result.scalar_one_or_none()
        
        # Deduct quantity
        ingredient.quantity -= quantity
        
        # Calculate cost
        cost = float(quantity * ingredient.cost_per_unit) if ingredient.cost_per_unit else 0
        total_cost += cost
        
        # Create movement
        movement = Movement(
            ingredient_id=ingredient_id,
            recipe_id=recipe_id,
            type=MovementType.USAGE,
            quantity=quantity,
            unit=unit,
            cost=cost,
            created_by=user_id,
            notes=f"Usado en receta: {recipe.name}"
        )
        db.add(movement)
        movements_created.append(movement)
    
    # Update recipe
    recipe.status = RecipeStatus.COMPLETED
    recipe.brewed_at = datetime.utcnow()
    recipe.cost_calculated = total_cost
    
    await db.commit()
    
    return {
        "message": "Recipe brewed successfully",
        "recipe_id": str(recipe.id),
        "cost_actual": total_cost,
        "movements_created": len(movements_created)
    }
