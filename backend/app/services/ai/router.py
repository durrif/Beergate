# backend/app/services/ai/router.py
"""
Intelligent AI provider router with fallback chain.

Default chain: Together → Claude → Ollama
Configurable via AI_PROVIDER_CHAIN env var.
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from app.core.config import settings
from app.services.ai.base import AIProvider
from app.services.ai.claude_provider import ClaudeProvider
from app.services.ai.ollama_provider import OllamaProvider
from app.services.ai.together_provider import TogetherProvider

logger = logging.getLogger(__name__)

# Singleton
_router: ProviderRouter | None = None


class ProviderRouter:
    """
    Routes AI requests through a priority chain of providers.
    If the primary provider fails, falls back to the next one.
    """

    def __init__(self, providers: list[AIProvider]):
        if not providers:
            raise ValueError("At least one AI provider is required")
        self.providers = providers
        names = [p.name for p in providers]
        logger.info("AI provider chain: %s", " → ".join(names))

    @property
    def primary(self) -> AIProvider:
        return self.providers[0]

    def get_provider(self, name: str) -> AIProvider | None:
        """Get a specific provider by name."""
        for p in self.providers:
            if p.name == name:
                return p
        return None

    async def stream(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
        prefer: str | None = None,
    ) -> AsyncGenerator[tuple[str, int | None, int | None], None]:
        """
        Stream from the preferred provider, falling back on error.

        Args:
            prefer: Provider name to try first (e.g. "claude" for premium tasks).
                    Falls back to chain order if preferred fails.
        """
        chain = list(self.providers)
        if prefer:
            # Move preferred provider to front
            pref = self.get_provider(prefer)
            if pref:
                chain = [pref] + [p for p in chain if p.name != prefer]

        last_error: Exception | None = None
        for provider in chain:
            try:
                logger.info("Trying provider: %s", provider.name)
                async for chunk in provider.stream(messages, system, max_tokens):
                    yield chunk
                return  # Success — stop fallback
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Provider %s failed: %s — trying next", provider.name, exc
                )
                continue

        # All providers failed
        logger.error("All AI providers failed. Last error: %s", last_error)
        yield ("Lo siento, todos los servicios de IA están temporalmente no disponibles.", None, None)

    async def complete(
        self,
        messages: list[dict[str, str]],
        system: str,
        max_tokens: int = 1024,
        prefer: str | None = None,
    ) -> tuple[str, int | None, int | None]:
        """
        Non-streaming completion with fallback chain.
        """
        chain = list(self.providers)
        if prefer:
            pref = self.get_provider(prefer)
            if pref:
                chain = [pref] + [p for p in chain if p.name != prefer]

        last_error: Exception | None = None
        for provider in chain:
            try:
                logger.info("Trying provider (complete): %s", provider.name)
                result = await provider.complete(messages, system, max_tokens)
                return result
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Provider %s complete() failed: %s — trying next",
                    provider.name, exc,
                )
                continue

        logger.error("All AI providers failed for complete(). Last error: %s", last_error)
        return ("Lo siento, todos los servicios de IA están temporalmente no disponibles.", None, None)

    async def check_providers(self) -> dict[str, bool]:
        """Check availability of all providers."""
        result = {}
        for p in self.providers:
            try:
                result[p.name] = await p.is_available()
            except Exception:
                result[p.name] = False
        return result


def _build_chain() -> list[AIProvider]:
    """Build provider chain from env config."""
    chain_str = getattr(settings, "AI_PROVIDER_CHAIN", "together,claude,ollama")
    chain_names = [n.strip().lower() for n in chain_str.split(",") if n.strip()]

    providers: list[AIProvider] = []
    for name in chain_names:
        if name == "together" and getattr(settings, "TOGETHER_API_KEY", ""):
            providers.append(
                TogetherProvider(
                    api_key=settings.TOGETHER_API_KEY,
                    model=getattr(settings, "TOGETHER_MODEL", "meta-llama/Llama-3.3-70B-Instruct-Turbo"),
                )
            )
        elif name == "claude" and getattr(settings, "ANTHROPIC_API_KEY", ""):
            providers.append(
                ClaudeProvider(
                    api_key=settings.ANTHROPIC_API_KEY,
                    model=getattr(settings, "CLAUDE_MODEL", "claude-sonnet-4-20250514"),
                )
            )
        elif name == "ollama":
            providers.append(
                OllamaProvider(
                    base_url=getattr(settings, "OLLAMA_URL", "http://localhost:11434"),
                    model=getattr(settings, "OLLAMA_MODEL", "llama3.2"),
                )
            )
        else:
            logger.debug("Skipping provider '%s' — not configured", name)

    if not providers:
        # Absolute fallback: Claude if key exists
        if getattr(settings, "ANTHROPIC_API_KEY", ""):
            logger.warning("No providers in chain — falling back to Claude")
            providers.append(ClaudeProvider(api_key=settings.ANTHROPIC_API_KEY))
        else:
            raise RuntimeError("No AI providers configured. Set TOGETHER_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_URL.")

    return providers


def get_router() -> ProviderRouter:
    """Get or create the singleton provider router."""
    global _router
    if _router is None:
        _router = ProviderRouter(_build_chain())
    return _router
