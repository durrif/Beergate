# backend/app/api/v1/brewing.py
"""
Brewing sessions CRUD + phase management + timer WebSocket.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, BeforeValidator, Field
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.security import decode_access_token
from app.models.brew_session import BrewSession, SessionPhase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/brewing", tags=["Brewing"])

StrID = Annotated[str, BeforeValidator(str)]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    recipe_id: int | None = None
    batch_number: int | None = None
    planned_batch_liters: float | None = None
    planned_og: float | None = None
    planned_fg: float | None = None
    brew_date: datetime | None = None
    notes: str | None = None


class SessionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    phase: SessionPhase | None = None
    actual_batch_liters: float | None = None
    actual_og: float | None = None
    actual_fg: float | None = None
    actual_abv: float | None = None
    efficiency_pct: float | None = None
    fermentation_start: datetime | None = None
    packaging_date: datetime | None = None
    step_log: list[dict] | None = None
    notes: str | None = None


class SessionOut(BaseModel):
    id: StrID
    brewery_id: StrID
    recipe_id: StrID | None
    name: str
    batch_number: int | None
    phase: str
    planned_batch_liters: float | None
    actual_batch_liters: float | None
    planned_og: float | None
    actual_og: float | None
    planned_fg: float | None
    actual_fg: float | None
    actual_abv: float | None
    efficiency_pct: float | None
    brew_date: datetime | None
    fermentation_start: datetime | None
    packaging_date: datetime | None
    step_log: list[dict] | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class PhaseAdvance(BaseModel):
    phase: SessionPhase
    notes: str | None = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=list[SessionOut])
async def list_sessions(
    phase_filter: SessionPhase | None = None,
    skip: int = 0,
    limit: int = 20,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    q = select(BrewSession).where(BrewSession.brewery_id == brewery.id)
    if phase_filter:
        q = q.where(BrewSession.phase == phase_filter)
    q = q.order_by(BrewSession.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    data: SessionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    session_obj = BrewSession(
        brewery_id=brewery.id,
        **data.model_dump(),
    )
    db.add(session_obj)
    await db.commit()
    await db.refresh(session_obj)
    return session_obj


@router.get("/active", response_model=SessionOut | None)
async def get_active_session(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns the most recent non-completed, non-planned session."""
    brewery = current_user.brewery
    if not brewery:
        raise HTTPException(status_code=400, detail="No brewery found")

    active_phases = [
        SessionPhase.mashing,
        SessionPhase.lautering,
        SessionPhase.boiling,
        SessionPhase.cooling,
        SessionPhase.fermenting,
        SessionPhase.conditioning,
        SessionPhase.packaging,
    ]
    result = await db.scalar(
        select(BrewSession)
        .where(
            BrewSession.brewery_id == brewery.id,
            BrewSession.phase.in_(active_phases),
        )
        .order_by(BrewSession.updated_at.desc())
    )
    return result


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: int,
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
    return session_obj


@router.patch("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: int,
    data: SessionUpdate,
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

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(session_obj, field, value)
    await db.commit()
    await db.refresh(session_obj)
    return session_obj


@router.post("/{session_id}/advance", response_model=SessionOut)
async def advance_phase(
    session_id: int,
    body: PhaseAdvance,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Advance (or set) the brewing phase and append a log entry."""
    session_obj = await db.scalar(
        select(BrewSession).where(
            BrewSession.id == session_id,
            BrewSession.brewery_id == current_user.brewery.id,
        )
    )
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    old_phase = session_obj.phase
    session_obj.phase = body.phase

    # Append to step_log
    log = list(session_obj.step_log or [])
    log.append({
        "from": old_phase.value,
        "to": body.phase.value,
        "at": datetime.now(timezone.utc).isoformat(),
        "notes": body.notes,
    })
    session_obj.step_log = log

    await db.commit()
    await db.refresh(session_obj)
    return session_obj


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
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
    await db.delete(session_obj)
    await db.commit()


# ---------------------------------------------------------------------------
# WebSocket — real-time phase + timer broadcast
# ---------------------------------------------------------------------------

# In-memory session registry (replace with Redis pub/sub for multi-worker)
_ws_connections: dict[int, list[WebSocket]] = {}


@router.websocket("/{session_id}/ws")
async def session_websocket(
    session_id: int,
    websocket: WebSocket,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket for real-time brew session feed.
    Clients send timer tick / phase updates; server broadcasts to all watchers.
    Auth via query param token: ws://host/api/v1/brewing/1/ws?token=<JWT>
    """
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return
    try:
        decode_access_token(token)
    except Exception:
        await websocket.close(code=4001, reason="Invalid authentication token")
        return
    await websocket.accept()
    _ws_connections.setdefault(session_id, []).append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast to all other connections for this session
            for ws in list(_ws_connections.get(session_id, [])):
                if ws is not websocket:
                    try:
                        await ws.send_json(data)
                    except (WebSocketDisconnect, RuntimeError) as _exc:
                        _ws_connections[session_id].remove(ws)
    except WebSocketDisconnect:
        conns = _ws_connections.get(session_id, [])
        if websocket in conns:
            conns.remove(websocket)
