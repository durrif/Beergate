# app/api/v1/water.py
"""Water profile API — análisis de agua, ajuste de sales, upload PDF."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.water import AdjustmentRequest, WaterProfileIn
from app.services.water_service import (
    WaterProfile,
    calculate_adjustments,
    parse_water_pdf,
)

router = APIRouter(prefix="/water", tags=["water"])

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/styles")
async def list_styles(_: User = Depends(get_current_active_user)) -> dict[str, list[str]]:
    """Return supported beer styles for water calculation."""
    from app.services.water_service import STYLE_PROFILES
    return {"styles": sorted(STYLE_PROFILES.keys())}


@router.post("/adjust")
async def calculate_water_adjustments(
    body: AdjustmentRequest,
    _: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Calculate salt additions to match a target style water profile."""
    current = WaterProfile(
        name=body.profile.name,
        calcium=body.profile.calcium,
        magnesium=body.profile.magnesium,
        sodium=body.profile.sodium,
        sulfate=body.profile.sulfate,
        chloride=body.profile.chloride,
        bicarbonate=body.profile.bicarbonate,
        ph=body.profile.ph,
    )
    result = calculate_adjustments(current, body.style, body.batch_liters)
    return {
        "target_profile": result.target_profile,
        "current": result.current,
        "target": result.target,
        "additions": [
            {"name": a.name, "amount_g": a.amount_g, "effect": a.effect}
            for a in result.additions
        ],
        "target_ph": result.target_ph,
        "acid_ml": result.acid_ml,
        "notes": result.notes,
    }


@router.post("/parse-pdf")
async def parse_water_pdf_endpoint(
    file: UploadFile = File(...),
    _: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Upload a Spanish water lab PDF and extract mineral values."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se aceptan archivos PDF")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Archivo demasiado grande (max 10MB)")

    result = parse_water_pdf(content)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=result["error"])

    return result
