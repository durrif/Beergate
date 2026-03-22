# app/services/recipe_service.py
"""Recipe service — BeerXML parsing, Brewer's Friend sync, ingredient matching."""
from __future__ import annotations

import io
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Any

import httpx


# ---------------------------------------------------------------------------
# BeerXML 1.0 parser
# ---------------------------------------------------------------------------

def _float(el: ET.Element | None, tag: str, default: float = 0.0) -> float:
    if el is None:
        return default
    child = el.find(tag)
    if child is None or not child.text:
        return default
    try:
        return float(child.text.strip())
    except ValueError:
        return default


def _text(el: ET.Element | None, tag: str, default: str = "") -> str:
    if el is None:
        return default
    child = el.find(tag)
    if child is None or not child.text:
        return default
    return child.text.strip()


def parse_beerxml(content: bytes) -> list[dict[str, Any]]:
    """Parse BeerXML 1.0 file → list of recipe dicts."""
    try:
        root = ET.fromstring(content)
    except ET.ParseError as e:
        raise ValueError(f"BeerXML inválido: {e}") from e

    recipes = []
    for rec in root.findall(".//RECIPE"):
        fermentables = []
        for f in rec.findall(".//FERMENTABLE"):
            fermentables.append({
                "name": _text(f, "NAME"),
                "type": _text(f, "TYPE"),
                "amount_kg": _float(f, "AMOUNT"),
                "color_ebc": _float(f, "COLOR") * 1.97,  # SRM → EBC
                "extract_pct": _float(f, "YIELD"),
            })

        hops = []
        for h in rec.findall(".//HOP"):
            hops.append({
                "name": _text(h, "NAME"),
                "amount_g": _float(h, "AMOUNT") * 1000,
                "time_min": _float(h, "TIME"),
                "alpha_pct": _float(h, "ALPHA"),
                "use": _text(h, "USE", "boil").lower(),
            })

        yeasts = []
        for y in rec.findall(".//YEAST"):
            yeasts.append({
                "name": _text(y, "NAME"),
                "type": _text(y, "TYPE"),
                "form": _text(y, "FORM"),
                "lab": _text(y, "LABORATORY"),
                "product_id": _text(y, "PRODUCT_ID"),
                "attenuation_pct": _float(y, "ATTENUATION"),
                "temp_min_c": _float(y, "MIN_TEMPERATURE"),
                "temp_max_c": _float(y, "MAX_TEMPERATURE"),
            })

        mash_steps = []
        for ms in rec.findall(".//MASH_STEP"):
            mash_steps.append({
                "name": _text(ms, "NAME"),
                "type": _text(ms, "TYPE"),
                "temp_c": _float(ms, "STEP_TEMP"),
                "time_min": _float(ms, "STEP_TIME"),
            })

        style_el = rec.find("STYLE")
        recipes.append({
            "name": _text(rec, "NAME"),
            "style": _text(style_el, "NAME") if style_el is not None else "",
            "style_code": _text(style_el, "STYLE_LETTER") if style_el is not None else "",
            "batch_size_liters": _float(rec, "BATCH_SIZE"),
            "efficiency_pct": _float(rec, "EFFICIENCY"),
            "og": _float(rec, "OG"),
            "fg": _float(rec, "FG"),
            "abv": (_float(rec, "OG") - _float(rec, "FG")) * 131.25,
            "ibu": _float(rec, "IBU"),
            "color_srm": _float(rec, "COLOR"),
            "ebc": _float(rec, "COLOR") * 1.97,
            "boil_time_min": _float(rec, "BOIL_TIME"),
            "notes": _text(rec, "NOTES"),
            "fermentables": fermentables,
            "hops": hops,
            "yeasts": yeasts,
            "mash_steps": mash_steps,
        })

    return recipes


# ---------------------------------------------------------------------------
# Brewer's Friend API sync
# ---------------------------------------------------------------------------

BREWERS_FRIEND_BASE = "https://api.brewersfriend.com/v1"


async def fetch_brewers_friend_recipe(api_key: str, recipe_id: str) -> dict[str, Any]:
    """Fetch a single recipe from Brewer's Friend API."""
    headers = {"X-API-Key": api_key, "Accept": "application/json"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{BREWERS_FRIEND_BASE}/recipes/{recipe_id}", headers=headers)
        resp.raise_for_status()
        data = resp.json()

    if not data.get("recipes"):
        raise ValueError(f"Receta {recipe_id} no encontrada en Brewer's Friend")

    return _normalize_bf_recipe(data["recipes"][0])


async def list_brewers_friend_recipes(api_key: str, page: int = 1) -> list[dict[str, Any]]:
    """List user's recipes from Brewer's Friend."""
    headers = {"X-API-Key": api_key, "Accept": "application/json"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{BREWERS_FRIEND_BASE}/recipes", headers=headers, params={"page": page})
        resp.raise_for_status()
        data = resp.json()

    return [_normalize_bf_recipe(r) for r in data.get("recipes", [])]


def _normalize_bf_recipe(r: dict[str, Any]) -> dict[str, Any]:
    """Normalize a Brewer's Friend recipe to our internal format."""
    fermentables = [
        {
            "name": f.get("name", ""),
            "type": f.get("type", "grain"),
            "amount_kg": float(f.get("amount", 0)),
            "color_ebc": float(f.get("color", 0)) * 1.97,
            "extract_pct": float(f.get("potential", 80)),
        }
        for f in r.get("fermentables", [])
    ]
    hops = [
        {
            "name": h.get("name", ""),
            "amount_g": float(h.get("amount", 0)),
            "time_min": float(h.get("time", 60)),
            "alpha_pct": float(h.get("alpha", 0)),
            "use": (h.get("use", "boil") or "boil").lower(),
        }
        for h in r.get("hops", [])
    ]
    yeasts = [
        {
            "name": y.get("name", ""),
            "lab": y.get("laboratory", ""),
            "product_id": y.get("productid", ""),
            "attenuation_pct": float(y.get("attenuation", 75)),
        }
        for y in r.get("yeasts", [])
    ]

    og = float(r.get("og", 1.050))
    fg = float(r.get("fg", 1.010))
    return {
        "name": r.get("name", ""),
        "style": r.get("style_name", ""),
        "style_code": r.get("style_letter", ""),
        "batch_size_liters": float(r.get("batchsize", 20)),
        "efficiency_pct": float(r.get("efficiency", 75)),
        "og": og,
        "fg": fg,
        "abv": (og - fg) * 131.25,
        "ibu": float(r.get("ibu", 0)),
        "ebc": float(r.get("color", 0)) * 1.97,
        "notes": r.get("notes", ""),
        "fermentables": fermentables,
        "hops": hops,
        "yeasts": yeasts,
        "mash_steps": [],
        "external_id": str(r.get("id", "")),
        "external_source": "brewers_friend",
    }


# ---------------------------------------------------------------------------
# Ingredient matching (can I brew this recipe?)
# ---------------------------------------------------------------------------

def check_can_brew(recipe: dict[str, Any], inventory: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Check if inventory has enough ingredients to brew a recipe.
    Returns status: 'ready' | 'partial' | 'missing'
    """
    inv_by_name = {i["name"].lower(): i for i in inventory}

    missing = []
    substitutable = []
    available = []

    for ferm in recipe.get("fermentables", []):
        name = ferm["name"].lower()
        needed_kg = ferm["amount_kg"]
        inv_item = inv_by_name.get(name)
        if inv_item is None:
            # Try partial name match
            matches = [k for k in inv_by_name if name in k or k in name]
            if matches:
                inv_item = inv_by_name[matches[0]]

        if inv_item is None:
            missing.append({"name": ferm["name"], "needed": f"{needed_kg:.2f} kg", "available": "0"})
        elif float(inv_item.get("quantity", 0)) < needed_kg:
            substitutable.append({
                "name": ferm["name"],
                "needed": f"{needed_kg:.2f} kg",
                "available": f"{inv_item.get('quantity', 0):.2f} kg",
            })
        else:
            available.append(ferm["name"])

    if not missing and not substitutable:
        status = "ready"
    elif not missing:
        status = "partial"
    else:
        status = "missing"

    return {
        "status": status,
        "available": available,
        "low_stock": substitutable,
        "missing": missing,
        "can_brew": status in ("ready", "partial"),
    }
