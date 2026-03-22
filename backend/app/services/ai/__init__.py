# backend/app/services/ai/__init__.py
"""
Hybrid AI provider system.

Architecture:
  1. Ollama   — local, fast, private (llama3.2 3B)
  2. Together — serverless primary (llama3.3 70B)
  3. Claude   — premium fallback (sonnet 4)

Usage:
    from app.services.ai import get_router
    router = get_router()
    async for chunk, in_tok, out_tok in router.stream(messages, system):
        ...
"""

from app.services.ai.router import ProviderRouter, get_router
from app.services.ai.base import AIProvider

__all__ = ["AIProvider", "ProviderRouter", "get_router"]
