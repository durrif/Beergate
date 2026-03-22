# app/services/recipe_service.py
"""Recipe service — BeerXML parsing, Brewer's Friend sync, ingredient matching."""
from __future__ import annotations

import io
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Any

import httpx

# BeerXML parsing delegated to shared module
from app.utils.beerxml import parse_beerxml  # noqa: F401


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
