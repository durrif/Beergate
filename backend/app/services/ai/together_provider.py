# backend/app/services/ai/together_provider.py
"""Together.ai provider — serverless Llama 3.3 70B for primary chat."""
from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator

import httpx

from app.services.ai.base import AIProvider

logger = logging.getLogger(__name__)

TOGETHER_API_BASE = "https://api.together.xyz/v1"


class TogetherProvider(AIProvider):
    name = "together"

    def __init__(self, api_key: str, model: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo"):
        self.api_key = api_key
        self.model = model
        self._timeout = httpx.Timeout(connect=10, read=120, write=10, pool=5)

    async def stream(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[tuple[str, int | None, int | None], None]:
        oai_messages = [{"role": "system", "content": system}, *messages]

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            async with client.stream(
                "POST",
                f"{TOGETHER_API_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": oai_messages,
                    "max_tokens": max_tokens,
                    "stream": True,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line[6:].strip()
                    if payload == "[DONE]":
                        break
                    try:
                        data = json.loads(payload)
                        delta = data["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield (delta, None, None)
                        # Check for usage in final chunk
                        usage = data.get("usage")
                        if usage:
                            yield ("", usage.get("prompt_tokens"), usage.get("completion_tokens"))
                            return
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

        yield ("", None, None)

    async def complete(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
    ) -> tuple[str, int | None, int | None]:
        oai_messages = [{"role": "system", "content": system}, *messages]

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(
                f"{TOGETHER_API_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": oai_messages,
                    "max_tokens": max_tokens,
                    "stream": False,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        text = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        return (
            text,
            usage.get("prompt_tokens"),
            usage.get("completion_tokens"),
        )

    async def is_available(self) -> bool:
        if not self.api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5)) as client:
                resp = await client.get(
                    f"{TOGETHER_API_BASE}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                return resp.status_code == 200
        except Exception:
            return False
