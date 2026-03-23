# backend/app/api/v1/recipes.py
"""Recipe CRUD + BeerXML import + Brewer's Friend sync."""
from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from typing import Any

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.recipe import Recipe, RecipeStatus
from app.schemas.recipe import (
    CanBrewItem,
    CanBrewLowStock,
    CanBrewResult,
    RecipeCreate,
    RecipeOut,
    RecipeUpdate,
)
from app.utils.beerxml import parse_beerxml

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipes", tags=["Recipes"])


# ---------------------------------------------------------------------------
# Helpers (BeerXML parsing moved to app.utils.beerxml)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=list[RecipeOut])
async def list_recipes(
    status_filter: RecipeStatus | None = Query(None, alias="status"),
    search: str | None = Query(None, max_length=100),
    skip: int = 0,
    limit: int = Query(50, le=200),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    q = select(Recipe).where(Recipe.brewery_id == brewery.id)
    if status_filter:
        q = q.where(Recipe.status == status_filter)
    if search:
        q = q.where(Recipe.name.ilike(f"%{search}%"))
    q = q.order_by(Recipe.updated_at.desc()).offset(skip).limit(limit)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    data: RecipeCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    recipe = Recipe(brewery_id=brewery.id, **data.model_dump())
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.get("/{recipe_id}", response_model=RecipeOut)
async def get_recipe(
    recipe_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = await db.scalar(
        select(Recipe).where(
            Recipe.id == recipe_id,
            Recipe.brewery_id == current_user.brewery.id,
        )
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.patch("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(
    recipe_id: int,
    data: RecipeUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = await db.scalar(
        select(Recipe).where(
            Recipe.id == recipe_id,
            Recipe.brewery_id == current_user.brewery.id,
        )
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(recipe, field, value)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipe = await db.scalar(
        select(Recipe).where(
            Recipe.id == recipe_id,
            Recipe.brewery_id == current_user.brewery.id,
        )
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    await db.delete(recipe)
    await db.commit()


@router.post("/import/beerxml", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def import_beerxml(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Import a BeerXML 1.0 file and create a new recipe."""
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    # Validate file type
    ALLOWED_EXTENSIONS = (".xml", ".beerxml")
    ALLOWED_MIMES = ("text/xml", "application/xml", "application/octet-stream")
    filename = file.filename or ""
    if not any(filename.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Only .xml or .beerxml files accepted")
    if file.content_type and file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"Invalid content type: {file.content_type}")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

    try:
        recipes = parse_beerxml(content)
        if not recipes:
            raise HTTPException(status_code=422, detail="No recipes found in BeerXML file")
        recipe_data = recipes[0]  # Import first recipe
    except (ET.ParseError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid BeerXML: {exc}") from exc

    recipe = Recipe(brewery_id=brewery.id, **recipe_data)
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.post("/import/brewers-friend/{bf_recipe_id}", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
async def import_brewers_friend(
    bf_recipe_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch a recipe from Brewer's Friend API and import it."""
    if not settings.BREWERS_FRIEND_API_KEY:
        raise HTTPException(status_code=503, detail="Brewer's Friend API key not configured")

    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"https://www.brewersfriend.com/homebrew/recipe/view/{bf_recipe_id}/format/json",
            headers={"API-KEY": settings.BREWERS_FRIEND_API_KEY},
        )

    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Recipe not found on Brewer's Friend")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Brewer's Friend API error")

    raw: dict = resp.json()
    name = raw.get("name", "BF Import")
    recipe = Recipe(
        brewery_id=brewery.id,
        name=name,
        style=raw.get("style_name"),
        og=raw.get("og"),
        fg=raw.get("fg"),
        abv=raw.get("abv"),
        ibu=raw.get("ibu"),
        srm=raw.get("color"),
        batch_size_liters=raw.get("batch_size"),
        efficiency_pct=raw.get("efficiency"),
        fermentables=raw.get("fermentables", []),
        hops=raw.get("hops", []),
        yeasts=raw.get("yeasts", []),
        brewers_friend_id=str(bf_recipe_id),
    )
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


# ---------------------------------------------------------------------------
# Can-brew check + brew session creation
# ---------------------------------------------------------------------------



@router.get("/{recipe_id}/can-brew", response_model=CanBrewResult)
async def check_can_brew(
    recipe_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if we have enough inventory to brew this recipe."""
    from app.models.ingredient import Ingredient

    recipe = await db.scalar(
        select(Recipe).where(
            Recipe.id == recipe_id,
            Recipe.brewery_id == current_user.brewery.id,
        )
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Gather all ingredients from the recipe
    needed: list[dict[str, Any]] = []
    for f in (recipe.fermentables or []):
        needed.append({"name": f.get("name", ""), "amount": f.get("amount_kg", 0), "unit": "kg"})
    for h in (recipe.hops or []):
        needed.append({"name": h.get("name", ""), "amount": (h.get("amount_g", 0) or 0) / 1000, "unit": "kg"})
    for y in (recipe.yeasts or []):
        needed.append({"name": y.get("name", ""), "amount": 1, "unit": "pkt"})

    # Get inventory
    inv_result = await db.execute(
        select(Ingredient).where(Ingredient.brewery_id == current_user.brewery.id)
    )
    inventory = {ing.name.lower(): ing for ing in inv_result.scalars().all()}

    missing = []
    low_stock = []
    available = []

    for item in needed:
        name = item["name"]
        if not name:
            continue
        inv_item = inventory.get(name.lower())
        if not inv_item:
            missing.append(CanBrewItem(name=name, required=item["amount"], unit=item["unit"]))
        elif inv_item.quantity < item["amount"]:
            low_stock.append(CanBrewLowStock(
                name=name, required=item["amount"], available=inv_item.quantity, unit=item["unit"]
            ))
        else:
            available.append(name)

    if missing:
        result_status = "missing"
    elif low_stock:
        result_status = "partial"
    else:
        result_status = "ready"

    return CanBrewResult(status=result_status, missing=missing, low_stock=low_stock, available=available)


@router.post("/{recipe_id}/brew", status_code=status.HTTP_201_CREATED)
async def start_brew_from_recipe(
    recipe_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new brew session from a recipe."""
    from app.models.brew_session import BrewSession, SessionPhase

    recipe = await db.scalar(
        select(Recipe).where(
            Recipe.id == recipe_id,
            Recipe.brewery_id == current_user.brewery.id,
        )
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    session_obj = BrewSession(
        brewery_id=current_user.brewery.id,
        recipe_id=recipe.id,
        name=recipe.name,
        phase=SessionPhase.planned,
        planned_batch_liters=recipe.batch_size_liters,
        planned_og=recipe.og,
        planned_fg=recipe.fg,
    )
    db.add(session_obj)
    await db.commit()
    await db.refresh(session_obj)
    return {"session_id": session_obj.id}
