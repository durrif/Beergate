# backend/app/services/scraper_service.py
"""
Price scrapers for Spanish homebrew shops.
Uses httpx (async HTTP) + BeautifulSoup4.
Each scraper returns a list of PriceResult dicts.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Callable

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ScraperError(Exception):
    """Base exception for scraper failures."""
    pass

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "es-ES,es;q=0.9",
}


@dataclass
class PriceResult:
    ingredient_name: str
    shop_name: str
    shop_url: str
    product_url: str
    product_name: str
    price: float
    unit: str
    price_per_kg: float | None
    in_stock: bool


def _parse_price(text: str) -> float | None:
    text = text.strip().replace("\xa0", "").replace(" ", "")
    m = re.search(r"(\d+[\.,]\d+|\d+)", text.replace(",", "."))
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return None
    return None


def _normalise_price_per_kg(price: float, unit: str, qty_str: str) -> float | None:
    """Normalise price to €/kg from various product format strings."""
    unit = unit.lower()
    qty_m = re.search(r"(\d+[\.,]?\d*)\s*(kg|g|l|ml)", qty_str.lower())
    if not qty_m:
        return None
    qty = float(qty_m.group(1).replace(",", "."))
    qty_unit = qty_m.group(2)
    if qty_unit in ("g", "ml"):
        qty /= 1000
    if qty <= 0:
        return None
    return round(price / qty, 4)


# ─── La Tienda del Cervecero ────────────────────────────────────────────────

async def scrape_latiendadelcervecero(query: str) -> list[PriceResult]:
    url = f"https://www.latiendadelcervecero.com/busqueda?q={query.replace(' ', '+')}"
    results: list[PriceResult] = []
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for card in soup.select(".product-miniature")[:10]:
            name_el = card.select_one(".product-title a")
            price_el = card.select_one(".price")
            link_el = card.select_one("a.thumbnail")
            if not (name_el and price_el):
                continue
            name = name_el.get_text(strip=True)
            price = _parse_price(price_el.get_text(strip=True))
            if price is None:
                continue
            product_url = link_el["href"] if link_el else url
            results.append(
                PriceResult(
                    ingredient_name=query,
                    shop_name="La Tienda del Cervecero",
                    shop_url="https://www.latiendadelcervecero.com",
                    product_url=str(product_url),
                    product_name=name,
                    price=price,
                    unit="unit",
                    price_per_kg=None,
                    in_stock=True,
                )
            )
    except httpx.HTTPError as exc:
        logger.warning("latiendadelcervecero HTTP error for %s: %s", query, exc)
    except (ValueError, KeyError, AttributeError) as exc:
        logger.warning("latiendadelcervecero parse error for %s: %s", query, exc)
    return results


# ─── Cervezania ──────────────────────────────────────────────────────────────

async def scrape_cervezania(query: str) -> list[PriceResult]:
    url = f"https://www.cervezania.com/search?q={query.replace(' ', '+')}"
    results: list[PriceResult] = []
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for card in soup.select(".product-item")[:10]:
            name_el = card.select_one(".product-item-name a, .product-item-link")
            price_el = card.select_one(".price")
            link_el = card.select_one("a.product-item-link")
            if not (name_el and price_el):
                continue
            name = name_el.get_text(strip=True)
            price = _parse_price(price_el.get_text(strip=True))
            if price is None:
                continue
            results.append(
                PriceResult(
                    ingredient_name=query,
                    shop_name="Cervezania",
                    shop_url="https://www.cervezania.com",
                    product_url=link_el["href"] if link_el else url,
                    product_name=name,
                    price=price,
                    unit="unit",
                    price_per_kg=None,
                    in_stock=True,
                )
            )
    except httpx.HTTPError as exc:
        logger.warning("cervezania HTTP error for %s: %s", query, exc)
    except (ValueError, KeyError, AttributeError) as exc:
        logger.warning("cervezania parse error for %s: %s", query, exc)
    return results


# ─── The Beer Times ───────────────────────────────────────────────────────────

async def scrape_thebeertimes(query: str) -> list[PriceResult]:
    url = f"https://www.thebeertimes.com/?s={query.replace(' ', '+')}"
    results: list[PriceResult] = []
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for card in soup.select(".product")[:10]:
            name_el = card.select_one(".woocommerce-loop-product__title")
            price_el = card.select_one(".price .amount, .price ins .amount")
            link_el = card.select_one("a.woocommerce-LoopProduct-link")
            if not (name_el and price_el):
                continue
            name = name_el.get_text(strip=True)
            price = _parse_price(price_el.get_text(strip=True))
            if price is None:
                continue
            results.append(
                PriceResult(
                    ingredient_name=query,
                    shop_name="The Beer Times",
                    shop_url="https://www.thebeertimes.com",
                    product_url=link_el["href"] if link_el else url,
                    product_name=name,
                    price=price,
                    unit="unit",
                    price_per_kg=None,
                    in_stock=True,
                )
            )
    except httpx.HTTPError as exc:
        logger.warning("thebeertimes HTTP error for %s: %s", query, exc)
    except (ValueError, KeyError, AttributeError) as exc:
        logger.warning("thebeertimes parse error for %s: %s", query, exc)
    return results


# ─── Cocinista ────────────────────────────────────────────────────────────────

async def scrape_cocinista(query: str) -> list[PriceResult]:
    url = f"https://www.cocinista.es/tienda/search?q={query.replace(' ', '+')}"
    results: list[PriceResult] = []
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=20, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for card in soup.select(".product-card")[:10]:
            name_el = card.select_one(".product-card__title")
            price_el = card.select_one(".product-card__price")
            link_el = card.select_one("a.product-card__link, a")
            if not (name_el and price_el):
                continue
            name = name_el.get_text(strip=True)
            price = _parse_price(price_el.get_text(strip=True))
            if price is None:
                continue
            results.append(
                PriceResult(
                    ingredient_name=query,
                    shop_name="Cocinista",
                    shop_url="https://www.cocinista.es",
                    product_url=str(link_el.get("href", url)) if link_el else url,
                    product_name=name,
                    price=price,
                    unit="unit",
                    price_per_kg=None,
                    in_stock=True,
                )
            )
    except httpx.HTTPError as exc:
        logger.warning("cocinista HTTP error for %s: %s", query, exc)
    except (ValueError, KeyError, AttributeError) as exc:
        logger.warning("cocinista parse error for %s: %s", query, exc)
    return results


# ─── Unified search ───────────────────────────────────────────────────────────

SCRAPERS: list[Callable[[str], object]] = [
    scrape_latiendadelcervecero,
    scrape_cervezania,
    scrape_thebeertimes,
    scrape_cocinista,
]


async def search_all_shops(query: str) -> list[PriceResult]:
    """Run all scrapers in parallel and return merged, sorted results."""
    import asyncio

    tasks = [s(query) for s in SCRAPERS]
    all_results = await asyncio.gather(*tasks, return_exceptions=True)
    merged: list[PriceResult] = []
    for r in all_results:
        if isinstance(r, list):
            merged.extend(r)
    merged.sort(key=lambda p: p.price)
    return merged
