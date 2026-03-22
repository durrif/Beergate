# backend/app/services/ai_service.py
"""
AI service — COMPATIBILITY BRIDGE.

The real implementation lives in app.services.ai (hybrid provider system).
This module re-exports the functions that existing code imports, so nothing breaks.
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from app.services.ai.prompts import build_system_prompt  # noqa: F401  — re-export
from app.services.ai.router import get_router

logger = logging.getLogger(__name__)


async def stream_claude(
    messages: list[dict[str, str]],
    system: str,
    max_tokens: int = 1024,
) -> AsyncGenerator[tuple[str, int | None, int | None], None]:
    """
    Legacy function — now routes through the provider chain.
    Name kept as 'stream_claude' for backward compatibility with ai.py import.
    """
    router = get_router()
    async for chunk in router.stream(messages, system, max_tokens):
        yield chunk
