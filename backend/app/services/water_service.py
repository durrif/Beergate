# app/services/water_service.py
"""Water profile analysis + salt calculation service."""
from __future__ import annotations

import io
import re
from dataclasses import dataclass, field
from typing import Any

try:
    import pdfplumber  # type: ignore
    HAS_PDF = True
except ImportError:
    HAS_PDF = False


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class WaterProfile:
    name: str = "Custom"
    calcium: float = 0.0       # Ca  mg/L
    magnesium: float = 0.0     # Mg  mg/L
    sodium: float = 0.0        # Na  mg/L
    sulfate: float = 0.0       # SO4 mg/L
    chloride: float = 0.0      # Cl  mg/L
    bicarbonate: float = 0.0   # HCO3 mg/L
    ph: float = 7.0


@dataclass
class SaltAddition:
    name: str
    amount_g: float
    effect: str


@dataclass
class WaterAdjustmentResult:
    target_profile: str
    current: dict[str, float]
    target: dict[str, float]
    additions: list[SaltAddition]
    target_ph: float
    acid_ml: float              # mL of 85% lactic acid per 20L batch
    notes: str


# ---------------------------------------------------------------------------
# Target water profiles per beer style
# ---------------------------------------------------------------------------

STYLE_PROFILES: dict[str, WaterProfile] = {
    "pilsner": WaterProfile("Plzen", calcium=7, magnesium=3, sodium=2, sulfate=5, chloride=5, bicarbonate=15, ph=6.5),
    "lager": WaterProfile("Pilsner", calcium=50, magnesium=5, sodium=5, sulfate=50, chloride=50, bicarbonate=50, ph=5.3),
    "ipa": WaterProfile("Burton", calcium=150, magnesium=10, sodium=10, sulfate=300, chloride=50, bicarbonate=150, ph=5.2),
    "pale_ale": WaterProfile("Pale Ale", calcium=100, magnesium=5, sodium=10, sulfate=150, chloride=75, bicarbonate=50, ph=5.3),
    "stout": WaterProfile("Dublin", calcium=100, magnesium=4, sodium=12, sulfate=50, chloride=65, bicarbonate=200, ph=5.4),
    "porter": WaterProfile("London", calcium=80, magnesium=5, sodium=35, sulfate=50, chloride=60, bicarbonate=140, ph=5.4),
    "wheat": WaterProfile("Munich", calcium=75, magnesium=20, sodium=5, sulfate=35, chloride=75, bicarbonate=150, ph=5.4),
    "saison": WaterProfile("Saison", calcium=100, magnesium=5, sodium=5, sulfate=100, chloride=50, bicarbonate=50, ph=5.3),
    "sour": WaterProfile("Sour", calcium=50, magnesium=5, sodium=5, sulfate=100, chloride=50, bicarbonate=0, ph=3.5),
    "balanced": WaterProfile("Balanced", calcium=100, magnesium=10, sodium=10, sulfate=100, chloride=100, bicarbonate=100, ph=5.4),
}


# ---------------------------------------------------------------------------
# Salt mineral contributions (mg per gram of salt per liter)
# ---------------------------------------------------------------------------

SALTS: dict[str, dict[str, float]] = {
    "Sulfato Cálcico (Yeso)": {"Ca": 232.8, "SO4": 557.9},
    "Cloruro Cálcico": {"Ca": 272.6, "Cl": 482.6},
    "Cloruro Sódico (Sal)": {"Na": 393.4, "Cl": 606.6},
    "Bicarbonato Sódico": {"Na": 274.0, "HCO3": 726.0},
    "Sulfato Magnésico (Epsom)": {"Mg": 98.6, "SO4": 389.6},
    "Cloruro Magnésico": {"Mg": 119.5, "Cl": 348.7},
}


def calculate_adjustments(
    current: WaterProfile,
    style: str,
    batch_liters: float = 20.0,
) -> WaterAdjustmentResult:
    """Calculate salt additions to match a target style profile."""
    style_key = style.lower().replace(" ", "_").replace("-", "_")
    target = STYLE_PROFILES.get(style_key) or STYLE_PROFILES["balanced"]

    additions: list[SaltAddition] = []

    # Ca deficit — use CaSO4 (gypsum) if sulfate-forward, else CaCl2
    ca_def = max(0, target.calcium - current.calcium)
    if ca_def > 0:
        if target.sulfate > target.chloride:
            g = (ca_def * batch_liters) / (SALTS["Sulfato Cálcico (Yeso)"]["Ca"] * batch_liters / 1000)
            g_rounded = round(g, 1)
            additions.append(SaltAddition("Sulfato Cálcico (Yeso)", g_rounded, f"+{ca_def:.0f} mg/L Ca, +SO₄"))
        else:
            g = (ca_def / SALTS["Cloruro Cálcico"]["Ca"]) * 1000 / 1000 * batch_liters
            g_rounded = round(g, 1)
            additions.append(SaltAddition("Cloruro Cálcico", g_rounded, f"+{ca_def:.0f} mg/L Ca, +Cl"))

    # Mg deficit
    mg_def = max(0, target.magnesium - current.magnesium)
    if mg_def > 5:
        g = round((mg_def / SALTS["Sulfato Magnésico (Epsom)"]["Mg"]) * batch_liters / 1000, 1)
        additions.append(SaltAddition("Sulfato Magnésico (Epsom)", g, f"+{mg_def:.0f} mg/L Mg"))

    # Na deficit
    na_def = max(0, target.sodium - current.sodium)
    if na_def > 10:
        g = round((na_def / SALTS["Cloruro Sódico (Sal)"]["Na"]) * batch_liters / 1000, 1)
        additions.append(SaltAddition("Cloruro Sódico (Sal)", g, f"+{na_def:.0f} mg/L Na"))

    # HCO3 deficit/excess → bicarbonate
    hco3_def = max(0, target.bicarbonate - current.bicarbonate)
    if hco3_def > 20:
        g = round((hco3_def / SALTS["Bicarbonato Sódico"]["HCO3"]) * batch_liters / 1000, 1)
        additions.append(SaltAddition("Bicarbonato Sódico", g, f"+{hco3_def:.0f} mg/L HCO₃"))

    # Lactic acid for pH reduction (simplified: 1mL 85% lactic acid drops pH ~0.1 in 20L)
    ph_drop = max(0, current.ph - target.ph)
    acid_ml = round(ph_drop * 10 * (batch_liters / 20), 1)

    # Build notes
    ratio = target.sulfate / target.chloride if target.chloride > 0 else 999
    if ratio > 3:
        notes = f"Perfil {target.name}: énfasis en amargor (SO₄/Cl={ratio:.1f}). Ideal para {style}."
    elif ratio < 0.5:
        notes = f"Perfil {target.name}: énfasis en redondez/suavidad (SO₄/Cl={ratio:.1f}). Ideal para {style}."
    else:
        notes = f"Perfil {target.name}: perfil equilibrado (SO₄/Cl={ratio:.1f}). Versátil para {style}."

    return WaterAdjustmentResult(
        target_profile=target.name,
        current=_profile_to_dict(current),
        target=_profile_to_dict(target),
        additions=additions,
        target_ph=target.ph,
        acid_ml=acid_ml,
        notes=notes,
    )


def _profile_to_dict(p: WaterProfile) -> dict[str, float]:
    return {
        "calcium": p.calcium,
        "magnesium": p.magnesium,
        "sodium": p.sodium,
        "sulfate": p.sulfate,
        "chloride": p.chloride,
        "bicarbonate": p.bicarbonate,
        "ph": p.ph,
    }


# ---------------------------------------------------------------------------
# PDF parsing for Spanish lab water reports
# ---------------------------------------------------------------------------

def parse_water_pdf(content: bytes) -> dict[str, Any]:
    """Extract water mineral values from a Spanish lab PDF report."""
    if not HAS_PDF:
        return {"error": "pdfplumber not installed"}

    text = ""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"

    text_lower = text.lower()
    result: dict[str, Any] = {"raw_text_length": len(text), "values": {}}

    patterns: dict[str, list[str]] = {
        "calcium": [r"calcio[^\d]*(\d[\d.,]+)", r"ca\s*\(mg/l\)[^\d]*(\d[\d.,]+)"],
        "magnesium": [r"magnesio[^\d]*(\d[\d.,]+)", r"mg\s*\(mg/l\)[^\d]*(\d[\d.,]+)"],
        "sodium": [r"sodio[^\d]*(\d[\d.,]+)", r"na\s*\(mg/l\)[^\d]*(\d[\d.,]+)"],
        "sulfate": [r"sulfatos?[^\d]*(\d[\d.,]+)", r"so4[^\d]*(\d[\d.,]+)"],
        "chloride": [r"cloruros?[^\d]*(\d[\d.,]+)", r"cl[^\d]*(\d[\d.,]+)"],
        "bicarbonate": [r"bicarbonatos?[^\d]*(\d[\d.,]+)", r"hco3[^\d]*(\d[\d.,]+)", r"alcalinidad[^\d]*(\d[\d.,]+)"],
        "ph": [r"ph[^\d]*(\d[\d.,]+)"],
        "conductivity": [r"conductividad[^\d]*(\d[\d.,]+)", r"conductivity[^\d]*(\d[\d.,]+)"],
        "hardness": [r"dureza[^\d]*(\d[\d.,]+)", r"hardness[^\d]*(\d[\d.,]+)"],
    }

    for mineral, pats in patterns.items():
        for pat in pats:
            m = re.search(pat, text_lower)
            if m:
                try:
                    val = float(m.group(1).replace(",", "."))
                    result["values"][mineral] = val
                    break
                except ValueError:
                    continue

    return result
