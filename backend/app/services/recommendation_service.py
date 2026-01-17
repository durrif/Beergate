"""Service for ingredient recommendations and matching."""
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.ingredient import Ingredient, IngredientCategory
from app.models.recipe import Recipe
from decimal import Decimal


class RecommendationService:
    """Service for recipe recommendations and ingredient matching."""
    
    @staticmethod
    async def find_possible_recipes(
        db: AsyncSession,
        user_id: str,
        available_only: bool = True,
        style: Optional[str] = None
    ) -> List[Dict]:
        """Find recipes that can be brewed with current inventory."""
        # Get all recipes
        query = select(Recipe).where(Recipe.user_id == user_id)
        if style:
            query = query.where(Recipe.style_bjcp.like(f"%{style}%"))
        
        result = await db.execute(query)
        recipes = result.scalars().all()
        
        # Get current inventory
        result = await db.execute(
            select(Ingredient).where(
                and_(
                    Ingredient.user_id == user_id,
                    Ingredient.status == "available"
                )
            )
        )
        ingredients = result.scalars().all()
        
        # Build inventory lookup
        inventory = {str(ing.id): float(ing.quantity) for ing in ingredients}
        
        possible_recipes = []
        
        for recipe in recipes:
            if not recipe.ingredients_json:
                continue
            
            can_brew = True
            missing = []
            sufficient = True
            
            for ing_data in recipe.ingredients_json:
                ingredient_id = ing_data.get("ingredient_id")
                required_qty = float(ing_data.get("quantity", 0))
                
                if ingredient_id not in inventory:
                    can_brew = False
                    missing.append(ing_data.get("name", "Unknown"))
                elif inventory[ingredient_id] < required_qty:
                    sufficient = False
                    missing.append(
                        f"{ing_data.get('name', 'Unknown')} "
                        f"(need {required_qty}, have {inventory[ingredient_id]})"
                    )
            
            if can_brew and (sufficient or not available_only):
                possible_recipes.append({
                    "recipe_id": str(recipe.id),
                    "name": recipe.name,
                    "style": recipe.style_bjcp,
                    "can_brew": sufficient,
                    "missing": missing if not sufficient else []
                })
        
        return possible_recipes
    
    @staticmethod
    async def find_substitutions(
        db: AsyncSession,
        ingredient_id: str,
        quantity: float
    ) -> List[Dict]:
        """Find substitution suggestions for an ingredient."""
        # Get the ingredient
        result = await db.execute(
            select(Ingredient).where(Ingredient.id == ingredient_id)
        )
        ingredient = result.scalar_one_or_none()
        
        if not ingredient:
            return []
        
        # Find similar ingredients in same category
        result = await db.execute(
            select(Ingredient).where(
                and_(
                    Ingredient.category == ingredient.category,
                    Ingredient.id != ingredient_id,
                    Ingredient.quantity >= quantity,
                    Ingredient.status == "available"
                )
            )
        )
        candidates = result.scalars().all()
        
        # TODO: Use ML embeddings for better matching
        # For now, simple name similarity
        substitutions = []
        for candidate in candidates[:5]:  # Top 5
            substitutions.append({
                "ingredient_id": str(candidate.id),
                "name": candidate.name,
                "quantity_available": float(candidate.quantity),
                "unit": candidate.unit,
                "notes": f"Similar to {ingredient.name}"
            })
        
        return substitutions
