# Beergate v2 — Copilot Instructions

## Project Overview
Beergate v2 is a brewery management SaaS platform built with FastAPI (Python 3.12) + React 19 (TypeScript) + PostgreSQL 16 + Redis 7 + Celery, deployed via Docker Compose behind Cloudflare Tunnel.

## Backend Conventions
- **Python 3.12**, **FastAPI 0.115.x**, **Pydantic v2**, **SQLAlchemy 2.0 async**
- All route handlers are `async def` using `AsyncSession`
- Dependency injection: `Depends(get_db)`, `Depends(get_current_brewery)`, `Depends(get_current_user)`
- All queries MUST be brewery-scoped: `where(Model.brewery_id == brewery.id)`
- Schemas use Pydantic v2 style: `model_validate()`, `model_dump()`, `ConfigDict`
- Config values from `app.core.config.settings` (Pydantic BaseSettings) — no magic numbers
- Auth: bcrypt password hashing, JWT HS256 (access + refresh tokens)
- Structured JSON logging in production (`python-json-logger`, `X-Request-ID` correlation)
- Celery for background tasks (price scraping, invoice parsing)
- Rate limiting via slowapi

## Frontend Conventions
- **React 19** + **TypeScript** + **Vite 6.1**
- **TanStack Router** for routing (lazy loaded pages)
- **Zustand** stores for client state, **React Query** for server state
- **Radix UI** headless components + **Tailwind CSS** utility classes
- Custom hooks in `src/hooks/` wrap all API calls — never fetch directly in components
- **react-i18next** for translations (Spanish default)
- PWA with Service Worker for offline support and push notifications

## Key Patterns
- New API feature = route file + Pydantic schemas + SQLAlchemy model (if needed) + Alembic migration + frontend hook + page component
- WebSocket endpoints use JWT auth via query parameter (`?token=`)
- iSpindel webhook authenticated via HMAC-SHA256
- AI chat uses SSE streaming with hybrid provider chain (Together → Claude → Ollama fallback)
- Invitation-based user registration with token gating

## Git & Deployment
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Branch: `master`
- Production: Docker Compose with 6 services (backend, worker, beat, frontend, postgres, redis)
- Frontend nginx uses dynamic DNS resolution (`resolver 127.0.0.11`) for Docker service discovery
- Cloudflare Tunnel routes `www.beergate.es` → frontend container
