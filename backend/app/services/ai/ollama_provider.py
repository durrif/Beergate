# backend/app/services/ai/ollama_provider.py
"""Ollama provider — local LLM for fast/private tasks."""
from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator

import httpx

from app.services.ai.base import AIProvider

logger = logging.getLogger(__name__)


class OllamaProvider(AIProvider):
    name = "ollama"

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2"):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._timeout = httpx.Timeout(connect=5, read=120, write=10, pool=5)

    async def stream(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[tuple[str, int | None, int | None], None]:
        ollama_messages = [{"role": "system", "content": system}, *messages]

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": ollama_messages,
                    "stream": True,
                    "options": {"num_predict": max_tokens},
                },
            ) as resp:
                resp.raise_for_status()
                prompt_tokens = None
                completion_tokens = None

                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield (content, None, None)

                    if data.get("done"):
                        prompt_tokens = data.get("prompt_eval_count")
                        completion_tokens = data.get("eval_count")

        yield ("", prompt_tokens, completion_tokens)

    async def complete(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
    ) -> tuple[str, int | None, int | None]:
        ollama_messages = [{"role": "system", "content": system}, *messages]

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": ollama_messages,
                    "stream": False,
                    "options": {"num_predict": max_tokens},
                },
            )
            resp.raise_for_status()
            data = resp.json()

        text = data.get("message", {}).get("content", "")
        return (
            text,
            data.get("prompt_eval_count"),
            data.get("eval_count"),
        )

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(3)) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False
