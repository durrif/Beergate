# backend/app/api/v1/fermentation.py
"""
Fermentation data — iSpindel webhook + manual entry + WebSocket streaming.
"""
from __future__ import annotations

import logging
import hmac
import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, BeforeValidator, Field
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.brew_session import BrewSession
from app.models.fermentation import FermentationDataPoint

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/fermentation", tags=["Fermentation"])

StrID = Annotated[str, BeforeValidator(str)]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DataPointIn(BaseModel):
    temperature: float | None = None
    gravity: float | None = None
    angle: float | None = None
    battery: float | None = None
    rssi: int | None = None
    source: str = Field("manual", max_length=20)
    recorded_at: datetime | None = None


class DataPointOut(BaseModel):
    id: StrID
    session_id: StrID
    temperature: float | None
    gravity: float | None
    angle: float | None
    battery: float | None
    rssi: int | None
    source: str
    recorded_at: datetime
    model_config = {"from_attributes": True}


class ISpindelPayload(BaseModel):
    """iSpindel sends this JSON to the webhook URL."""
    name: str
    ID: int
    angle: float
    temperature: float
    temp_units: str = "C"
    battery: float
    gravity: float
    interval: int
    RSSI: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _verify_ispindel_signature(request_body: bytes, signature: str | None) -> bool:
    """Verify iSpindel HMAC signature if ISPINDEL_WEBHOOK_SECRET is set."""
    secret = settings.ISPINDEL_WEBHOOK_SECRET
    if not secret:
        return True  # no secret configured → accept all
    if not signature:
        return False
    expected = hmac.new(secret.encode(), request_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/{session_id}/data", response_model=list[DataPointOut])
async def get_fermentation_data(
    session_id: int,
    limit: int = 500,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_obj = await db.scalar(
        select(BrewSession).where(
            BrewSession.id == session_id,
            BrewSession.brewery_id == current_user.brewery.id,
        )
    )
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(FermentationDataPoint)
        .where(FermentationDataPoint.session_id == session_id)
        .order_by(FermentationDataPoint.recorded_at.desc())
        .limit(limit)
    )
    points = list(reversed(result.scalars().all()))
    return points


@router.post("/{session_id}/data", response_model=DataPointOut, status_code=status.HTTP_201_CREATED)
async def add_data_point(
    session_id: int,
    data: DataPointIn,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_obj = await db.scalar(
        select(BrewSession).where(
            BrewSession.id == session_id,
            BrewSession.brewery_id == current_user.brewery.id,
        )
    )
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    recorded_at = data.recorded_at or datetime.now(timezone.utc)
    point = FermentationDataPoint(
        session_id=session_id,
        temperature=data.temperature,
        gravity=data.gravity,
        angle=data.angle,
        battery=data.battery,
        rssi=data.rssi,
        source=data.source,
        recorded_at=recorded_at,
    )
    db.add(point)
    await db.commit()
    await db.refresh(point)
    return point


@router.post("/ispindel/webhook", status_code=status.HTTP_201_CREATED)
async def ispindel_webhook(
    payload: ISpindelPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    iSpindel POST webhook — no user auth, protected by HMAC secret.
    Maps iSpindel 'name' to an active brew session name.
    """
    body = await request.body()
    sig = request.headers.get("X-iSpindel-Signature")
    if not _verify_ispindel_signature(body, sig):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    # Find active session matching device name
    session_obj = await db.scalar(
        select(BrewSession).where(BrewSession.name.ilike(f"%{payload.name}%"))
    )
    if not session_obj:
        # Accept but ignore unknown device readings
        return {"status": "ignored", "device": payload.name}

    point = FermentationDataPoint(
        session_id=session_obj.id,
        temperature=payload.temperature,
        gravity=payload.gravity,
        angle=payload.angle,
        battery=payload.battery,
        rssi=payload.RSSI,
        source="ispindel",
    )
    db.add(point)
    await db.commit()
    return {"status": "ok", "session_id": session_obj.id}


# ---------------------------------------------------------------------------
# WebSocket — live chart streaming
# ---------------------------------------------------------------------------

_ferm_connections: dict[int, list[WebSocket]] = {}


@router.websocket("/{session_id}/ws")
async def fermentation_websocket(session_id: int, websocket: WebSocket):
    await websocket.accept()
    _ferm_connections.setdefault(session_id, []).append(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive ping
    except WebSocketDisconnect:
        conns = _ferm_connections.get(session_id, [])
        if websocket in conns:
            conns.remove(websocket)


async def broadcast_fermentation_point(session_id: int, point: FermentationDataPoint) -> None:
    """Called when a new data point is stored — pushes to connected WS clients."""
    data = {
        "id": point.id,
        "temperature": point.temperature,
        "gravity": point.gravity,
        "source": point.source,
        "recorded_at": point.recorded_at.isoformat(),
    }
    for ws in list(_ferm_connections.get(session_id, [])):
        try:
            await ws.send_json(data)
        except Exception:
            _ferm_connections[session_id].remove(ws)
