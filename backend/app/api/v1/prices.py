# backend/app/api/v1/prices.py
"""
Price search + comparison API.
Calls scraper service on-demand (with Redis cache) and returns results.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.redis import get_redis_pool
from app.models.price import PriceRecord, PriceAlert, AlertType
from app.services.scraper_service import search_all_shops, PriceResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/prices", tags=["Prices"])

CACHE_TTL = 3600 * 3  # 3 hours


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PriceResultOut(BaseModel):
    ingredient_name: str
    shop_name: str
    shop_url: str
    product_url: str
    product_name: str
    price: float
    unit: str
    price_per_kg: float | None
    in_stock: bool
    cached: bool = False
    scraped_at: datetime | None = None


class RecipePriceComparison(BaseModel):
    ingredient_name: str
    cheapest_price: float | None
    cheapest_shop: str | None
    all_offers: list[PriceResultOut]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/search", response_model=list[PriceResultOut])
async def search_prices(
    q: str = Query(..., min_length=2, max_length=100),
    force_refresh: bool = False,
    current_user=Depends(get_current_user),
) -> list[PriceResultOut]:
    """
    Search for an ingredient across all configured shops.
    Results are cached in Redis for 3 hours.
    """
    cache_key = f"prices:search:{q.lower().strip()}"
    redis = await get_redis_pool()

    # Try cache first
    if not force_refresh and redis:
        try:
            cached = await redis.get(cache_key)
            if cached:
                data = json.loads(cached)
                return [PriceResultOut(**r, cached=True) for r in data]
        except Exception as exc:
            logger.warning("Redis cache read error: %s", exc)

    # Live scrape
    results: list[PriceResult] = await search_all_shops(q)
    now = datetime.now(timezone.utc)

    out = [
        PriceResultOut(
            ingredient_name=r.ingredient_name,
            shop_name=r.shop_name,
            shop_url=r.shop_url,
            product_url=r.product_url,
            product_name=r.product_name,
            price=r.price,
            unit=r.unit,
            price_per_kg=r.price_per_kg,
            in_stock=r.in_stock,
            cached=False,
            scraped_at=now,
        )
        for r in results
    ]

    # Cache the result
    if redis:
        try:
            await redis.setex(cache_key, CACHE_TTL, json.dumps([o.model_dump(mode="json") for o in out]))
        except Exception as exc:
            logger.warning("Redis cache write error: %s", exc)

    return out


@router.get("/compare-recipe/{recipe_id}", response_model=list[RecipePriceComparison])
async def compare_recipe_prices(
    recipe_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[RecipePriceComparison]:
    """
    Return price comparison for all ingredients in a recipe.
    Uses cached scrape results; triggers background scrape if stale.
    """
    from app.models.recipe import Recipe

    recipe = await db.scalar(
        select(Recipe).where(
            Recipe.id == recipe_id,
            Recipe.brewery_id == current_user.brewery.id,
        )
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    comparisons: list[RecipePriceComparison] = []
    redis = await get_redis_pool()

    queries: list[str] = []
    if recipe.fermentables:
        queries += [f["name"] for f in recipe.fermentables if f.get("name")]
    if recipe.hops:
        queries += [f["name"] for f in recipe.hops if f.get("name")]
    if recipe.yeasts:
        queries += [f["name"] for f in recipe.yeasts if f.get("name")]

    for ing_name in queries[:20]:  # cap to 20 ingredients per recipe
        cache_key = f"prices:search:{ing_name.lower().strip()}"
        results: list[PriceResultOut] = []

        if redis:
            try:
                cached = await redis.get(cache_key)
                if cached:
                    data = json.loads(cached)
                    results = [PriceResultOut(**r, cached=True) for r in data]
            except Exception:
                pass

        if not results:
            raw = await search_all_shops(ing_name)
            now = datetime.now(timezone.utc)
            results = [
                PriceResultOut(
                    ingredient_name=r.ingredient_name,
                    shop_name=r.shop_name,
                    shop_url=r.shop_url,
                    product_url=r.product_url,
                    product_name=r.product_name,
                    price=r.price,
                    unit=r.unit,
                    price_per_kg=r.price_per_kg,
                    in_stock=r.in_stock,
                    scraped_at=now,
                )
                for r in raw
            ]

        if results:
            cheapest = min(results, key=lambda r: r.price)
            comparisons.append(
                RecipePriceComparison(
                    ingredient_name=ing_name,
                    cheapest_price=cheapest.price,
                    cheapest_shop=cheapest.shop_name,
                    all_offers=results,
                )
            )
        else:
            comparisons.append(
                RecipePriceComparison(
                    ingredient_name=ing_name,
                    cheapest_price=None,
                    cheapest_shop=None,
                    all_offers=[],
                )
            )

    return comparisons


@router.post("/scrape-recipe/{recipe_id}")
async def trigger_recipe_scrape(
    recipe_id: int,
    current_user=Depends(get_current_user),
) -> dict:
    """Dispatch a background Celery task to scrape prices for a recipe's ingredients."""
    try:
        from app.workers.scraper_tasks import scrape_recipe_ingredients
        task = scrape_recipe_ingredients.delay(recipe_id)
        return {"task_id": task.id, "status": "queued"}
    except Exception as exc:
        logger.error("Failed to dispatch scrape task: %s", exc)
        raise HTTPException(status_code=503, detail="Could not queue scrape task")


# ---------------------------------------------------------------------------
# Alert Schemas
# ---------------------------------------------------------------------------

class PriceAlertOut(BaseModel):
    id: int
    brewery_id: int
    ingredient_name: str
    alert_type: str
    threshold_price: float | None
    is_active: bool
    last_triggered_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceAlertCreate(BaseModel):
    ingredient_name: str
    alert_type: str = "price_drop"
    threshold_price: float | None = None


# ---------------------------------------------------------------------------
# Alert Routes
# ---------------------------------------------------------------------------

@router.get("/alerts", response_model=list[PriceAlertOut])
async def list_alerts(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PriceAlertOut]:
    """List all price alerts for the current user's brewery."""
    result = await db.execute(
        select(PriceAlert)
        .where(
            PriceAlert.brewery_id == current_user.brewery.id,
            PriceAlert.is_active == True,
        )
        .order_by(desc(PriceAlert.created_at))
    )
    return [PriceAlertOut.model_validate(a) for a in result.scalars().all()]


@router.post("/alerts", response_model=PriceAlertOut, status_code=201)
async def create_alert(
    data: PriceAlertCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PriceAlertOut:
    """Create a new price alert."""
    try:
        atype = AlertType(data.alert_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid alert_type: {data.alert_type}")

    alert = PriceAlert(
        brewery_id=current_user.brewery.id,
        ingredient_name=data.ingredient_name,
        alert_type=atype,
        threshold_price=data.threshold_price,
    )
    db.add(alert)
    await db.flush()
    await db.refresh(alert)
    return PriceAlertOut.model_validate(alert)


@router.delete("/alerts/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a price alert."""
    alert = await db.scalar(
        select(PriceAlert).where(
            PriceAlert.id == alert_id,
            PriceAlert.brewery_id == current_user.brewery.id,
        )
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)


# ---------------------------------------------------------------------------
# Price History
# ---------------------------------------------------------------------------

@router.get("/history")
async def price_history(
    name: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=500),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Return historical price records for a given ingredient name."""
    result = await db.execute(
        select(PriceRecord)
        .where(PriceRecord.ingredient_name.ilike(f"%{name}%"))
        .order_by(desc(PriceRecord.scraped_at))
        .limit(limit)
    )
    records = result.scalars().all()
    return [
        {
            "scraped_at": r.scraped_at.isoformat() if r.scraped_at else None,
            "price": r.price,
            "shop": r.shop_name,
        }
        for r in records
    ]
