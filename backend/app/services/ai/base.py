# backend/app/services/ai/base.py
"""Abstract base for all AI providers."""
from __future__ import annotations

import abc
from collections.abc import AsyncGenerator


class AIProvider(abc.ABC):
    """Common interface for LLM providers."""

    name: str  # e.g. "ollama", "together", "claude"

    @abc.abstractmethod
    async def stream(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[tuple[str, int | None, int | None], None]:
        """
        Yield (text_chunk, input_tokens | None, output_tokens | None).
        Token counts only populated on the final yield.
        """
        ...  # pragma: no cover
        # Make it an async generator
        yield  # type: ignore[misc]

    @abc.abstractmethod
    async def complete(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
    ) -> tuple[str, int | None, int | None]:
        """
        Non-streaming completion. Returns (full_text, input_tokens, output_tokens).
        Useful for voice pipeline and quick tasks.
        """
        ...

    @abc.abstractmethod
    async def is_available(self) -> bool:
        """Check if this provider is reachable and configured."""
        ...
