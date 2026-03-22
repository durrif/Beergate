# backend/app/utils/beerxml.py
"""Shared BeerXML 1.0 parser used by recipes API and recipe_service."""
from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Any


def _text(el: ET.Element | None, tag: str, default: str = "") -> str:
    if el is None:
        return default
    child = el.find(tag)
    if child is None or not child.text:
        return default
    return child.text.strip()


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
                "origin": _text(f, "ORIGIN"),
            })

        hops = []
        for h in rec.findall(".//HOP"):
            hops.append({
                "name": _text(h, "NAME"),
                "amount_g": _float(h, "AMOUNT") * 1000,
                "time_min": _float(h, "TIME"),
                "alpha_pct": _float(h, "ALPHA"),
                "use": _text(h, "USE", "boil").lower(),
                "form": _text(h, "FORM"),
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
                "min_temp": _float(y, "MIN_TEMPERATURE"),
                "max_temp": _float(y, "MAX_TEMPERATURE"),
            })

        mash_steps = []
        for ms in rec.findall(".//MASH_STEP"):
            mash_steps.append({
                "name": _text(ms, "NAME"),
                "type": _text(ms, "TYPE"),
                "temp_c": _float(ms, "STEP_TEMP"),
                "duration_min": _float(ms, "STEP_TIME"),
            })

        style_el = rec.find("STYLE")
        og = _float(rec, "OG")
        fg = _float(rec, "FG")

        recipes.append({
            "name": _text(rec, "NAME") or "Imported Recipe",
            "style": _text(style_el, "NAME") if style_el is not None else "",
            "style_code": _text(style_el, "STYLE_LETTER") if style_el is not None else "",
            "description": _text(rec, "NOTES"),
            "batch_size_liters": _float(rec, "BATCH_SIZE"),
            "efficiency_pct": _float(rec, "EFFICIENCY"),
            "og": og,
            "fg": fg,
            "abv": (og - fg) * 131.25 if og and fg else None,
            "ibu": _float(rec, "IBU") or None,
            "srm": _float(rec, "COLOR") or None,
            "ebc": (_float(rec, "COLOR") * 1.97) or None,
            "fermentables": fermentables,
            "hops": hops,
            "yeasts": yeasts,
            "mash_steps": mash_steps,
        })

    return recipes
