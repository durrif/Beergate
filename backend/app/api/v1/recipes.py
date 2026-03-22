# backend/app/api/v1/recipes.py
"""Recipe CRUD + BeerXML import + Brewer's Friend sync."""
from __future__ import annotations

import logging
import xml.etree.ElementTree as ET
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, BeforeValidator, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.recipe import Recipe, RecipeStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipes", tags=["Recipes"])

StrID = Annotated[str, BeforeValidator(str)]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RecipeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    style: str | None = Field(None, max_length=100)
    style_code: str | None = Field(None, max_length=20)
    description: str | None = None
    batch_size_liters: float | None = None
    efficiency_pct: float | None = None
    og: float | None = None
    fg: float | None = None
    abv: float | None = None
    ibu: float | None = None
    srm: float | None = None
    ebc: float | None = None
    fermentables: list[dict] | None = None
    hops: list[dict] | None = None
    yeasts: list[dict] | None = None
    adjuncts: list[dict] | None = None
    mash_steps: list[dict] | None = None
    water_profile: dict | None = None
    notes: str | None = None


class RecipeUpdate(RecipeCreate):
    name: str | None = None  # type: ignore[assignment]
    status: RecipeStatus | None = None


class RecipeOut(BaseModel):
    id: StrID
    brewery_id: StrID
    name: str
    style: str | None
    style_code: str | None
    description: str | None
    status: str
    batch_size_liters: float | None
    efficiency_pct: float | None
    og: float | None
    fg: float | None
    abv: float | None
    ibu: float | None
    srm: float | None
    ebc: float | None
    fermentables: list[dict] | None
    hops: list[dict] | None
    yeasts: list[dict] | None
    adjuncts: list[dict] | None
    mash_steps: list[dict] | None
    water_profile: dict | None
    notes: str | None
    brewers_friend_id: str | None
    created_at: Any | None = None
    updated_at: Any | None = None
    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _xml_text(el: ET.Element | None) -> str | None:
    return el.text.strip() if el is not None and el.text else None


def _xml_float(el: ET.Element | None) -> float | None:
    try:
        return float(_xml_text(el) or "")
    except (ValueError, TypeError):
        return None


def parse_beerxml(content: bytes) -> dict[str, Any]:
    """Parse BeerXML 1.0 bytes into a RecipeCreate-compatible dict."""
    root = ET.fromstring(content)
    rec_el = root.find(".//RECIPE")
    if rec_el is None:
        raise ValueError("No <RECIPE> element found in BeerXML")

    fermentables = []
    for f in rec_el.findall(".//FERMENTABLE"):
        fermentables.append({
            "name": _xml_text(f.find("NAME")),
            "amount_kg": _xml_float(f.find("AMOUNT")),
            "color_ebc": (_xml_float(f.find("COLOR")) or 0) * 1.97,  # SRM→EBC
            "type": _xml_text(f.find("TYPE")),
            "origin": _xml_text(f.find("ORIGIN")),
        })

    hops = []
    for h in rec_el.findall(".//HOP"):
        hops.append({
            "name": _xml_text(h.find("NAME")),
            "amount_g": (_xml_float(h.find("AMOUNT")) or 0) * 1000,
            "alpha_pct": _xml_float(h.find("ALPHA")),
            "time_min": _xml_float(h.find("TIME")),
            "use": _xml_text(h.find("USE")),
            "form": _xml_text(h.find("FORM")),
        })

    yeasts = []
    for y in rec_el.findall(".//YEAST"):
        yeasts.append({
            "name": _xml_text(y.find("NAME")),
            "lab": _xml_text(y.find("LABORATORY")),
            "product_id": _xml_text(y.find("PRODUCT_ID")),
            "attenuation_pct": _xml_float(y.find("ATTENUATION")),
            "min_temp": _xml_float(y.find("MIN_TEMPERATURE")),
            "max_temp": _xml_float(y.find("MAX_TEMPERATURE")),
        })

    mash_steps = []
    for ms in rec_el.findall(".//MASH_STEP"):
        mash_steps.append({
            "name": _xml_text(ms.find("NAME")),
            "temp_c": _xml_float(ms.find("STEP_TEMP")),
            "duration_min": _xml_float(ms.find("STEP_TIME")),
            "type": _xml_text(ms.find("TYPE")),
        })

    batch_l = _xml_float(rec_el.find("BATCH_SIZE"))
    eff = _xml_float(rec_el.find("EFFICIENCY"))
    og = _xml_float(rec_el.find("OG"))
    fg = _xml_float(rec_el.find("FG"))

    return {
        "name": _xml_text(rec_el.find("NAME")) or "Imported Recipe",
        "style": _xml_text(rec_el.find(".//STYLE/NAME")),
        "style_code": _xml_text(rec_el.find(".//STYLE/STYLE_LETTER")),
        "description": _xml_text(rec_el.find("NOTES")),
        "batch_size_liters": batch_l,
        "efficiency_pct": eff,
        "og": og,
        "fg": fg,
        "fermentables": fermentables,
        "hops": hops,
        "yeasts": yeasts,
        "mash_steps": mash_steps,
    }


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

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(status_code=413, detail="File too large (max 5 MB)")

    try:
        recipe_data = parse_beerxml(content)
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

class CanBrewItem(BaseModel):
    name: str
    required: float
    unit: str

class CanBrewLowStock(BaseModel):
    name: str
    required: float
    available: float
    unit: str

class CanBrewResult(BaseModel):
    status: str  # ready | partial | missing
    missing: list[CanBrewItem]
    low_stock: list[CanBrewLowStock]
    available: list[str]


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
