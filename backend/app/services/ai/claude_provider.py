# backend/app/services/ai/claude_provider.py
"""Claude provider — premium fallback via Anthropic SDK."""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

import anthropic
from anthropic import AsyncAnthropic

from app.services.ai.base import AIProvider

logger = logging.getLogger(__name__)


class ClaudeProvider(AIProvider):
    name = "claude"

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.api_key = api_key
        self.model = model

    async def stream(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[tuple[str, int | None, int | None], None]:
        client = AsyncAnthropic(api_key=self.api_key)

        try:
            async with client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=messages,  # type: ignore[arg-type]
            ) as stream:
                async for text in stream.text_stream:
                    yield (text, None, None)

                usage = (await stream.get_final_message()).usage
                yield ("", usage.input_tokens, usage.output_tokens)

        except anthropic.AuthenticationError:
            logger.error("Claude auth error — check ANTHROPIC_API_KEY")
            raise
        except anthropic.RateLimitError:
            logger.warning("Claude rate limited")
            raise

    async def complete(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
    ) -> tuple[str, int | None, int | None]:
        client = AsyncAnthropic(api_key=self.api_key)

        response = await client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,  # type: ignore[arg-type]
        )
        text = response.content[0].text
        return (text, response.usage.input_tokens, response.usage.output_tokens)

    async def is_available(self) -> bool:
        if not self.api_key:
            return False
        try:
            client = AsyncAnthropic(api_key=self.api_key)
            # Minimal call to validate key
            await client.messages.create(
                model=self.model,
                max_tokens=1,
                messages=[{"role": "user", "content": "hi"}],
            )
            return True
        except anthropic.AuthenticationError:
            return False
        except Exception:
            # Rate limit or other transient error — key is valid
            return True
