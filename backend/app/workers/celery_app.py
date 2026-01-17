from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "beergate",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.task_routes = {
    "app.workers.invoice_processor.*": "main-queue",
}

celery_app.conf.update(task_track_started=True)

# Import tasks
from app.workers import invoice_processor  # noqa
from app.workers import ml_tasks  # noqa
