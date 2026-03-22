# backend/app/workers/scraper_tasks.py
"""Celery tasks for price scraping."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)

# Common ingredients to scrape prices for
DEFAULT_QUERIES = [
    "malta pilsen",
    "malta pale ale",
    "malta munich",
    "malta caramelo",
    "lúpulo cascade",
    "lúpulo centennial",
    "lúpulo citra",
    "lúpulo hallertau",
    "levadura safale us-05",
    "levadura nottingham",
    "levadura w34/70",
]


@celery_app.task(name="app.workers.scraper_tasks.scrape_ingredient", bind=True, max_retries=3)
def scrape_ingredient(self, query: str) -> dict:
    """Scrape a single ingredient across all shops and save to DB."""
    try:
        from app.services.scraper_service import search_all_shops
        from app.core.database import AsyncSessionLocal
        from app.models.price import PriceRecord

        async def _run():
            results = await search_all_shops(query)
            now = datetime.now(timezone.utc)
            async with AsyncSessionLocal() as session:
                for r in results:
                    record = PriceRecord(
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
                    session.add(record)
                await session.commit()
            return results

        results = asyncio.run(_run())
        logger.info("Scraped %d results for '%s' and saved to DB", len(results), query)
        return {
            "query": query,
            "count": len(results),
            "shops": list({r.shop_name for r in results}),
        }

    except Exception as exc:
        logger.error("Scrape task failed for '%s': %s", query, exc)
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@celery_app.task(name="app.workers.scraper_tasks.scrape_all_shops")
def scrape_all_shops() -> dict:
    """Fan-out scraping for all default queries."""
    logger.info("Starting full price scrape (%d queries)", len(DEFAULT_QUERIES))
    results = []
    for query in DEFAULT_QUERIES:
        task = scrape_ingredient.delay(query)
        results.append({"query": query, "task_id": task.id})
    return {"dispatched": len(results), "tasks": results}


@celery_app.task(name="app.workers.scraper_tasks.scrape_recipe_ingredients")
def scrape_recipe_ingredients(recipe_id: int) -> dict:
    """Scrape prices for all ingredients in a specific recipe."""
    try:
        from app.core.database import AsyncSessionLocal
        from app.models.recipe import Recipe

        async def _load_recipe():
            async with AsyncSessionLocal() as session:
                return await session.get(Recipe, recipe_id)

        recipe = asyncio.run(_load_recipe())
        if not recipe:
            return {"recipe_id": recipe_id, "status": "not_found"}

        queries: list[str] = []
        if recipe.fermentables:
            queries += [f["name"] for f in recipe.fermentables if f.get("name")]
        if recipe.hops:
            queries += [f["name"] for f in recipe.hops if f.get("name")]
        if recipe.yeasts:
            queries += [f["name"] for f in recipe.yeasts if f.get("name")]

        tasks = []
        for q in queries[:20]:
            task = scrape_ingredient.delay(q)
            tasks.append({"query": q, "task_id": task.id})

        logger.info("Dispatched %d scrape tasks for recipe %d", len(tasks), recipe_id)
        return {"recipe_id": recipe_id, "status": "dispatched", "tasks": tasks}
    except Exception as exc:
        logger.error("Recipe scrape error for recipe %d: %s", recipe_id, exc)
        return {"recipe_id": recipe_id, "status": "error", "detail": str(exc)}
