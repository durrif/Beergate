# backend/app/workers/celery_app.py
"""Celery application factory for background scraping tasks."""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "beergate",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.scraper_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Madrid",
    enable_utc=True,
    task_track_started=True,
    # Beat schedule — run scraper every 6 hours
    beat_schedule={
        "scrape-all-shops-every-6h": {
            "task": "app.workers.scraper_tasks.scrape_all_shops",
            "schedule": 6 * 60 * 60,  # seconds
        },
    },
)
