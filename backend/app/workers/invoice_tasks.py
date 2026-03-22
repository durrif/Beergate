# app/workers/invoice_tasks.py
"""Celery tasks for async invoice PDF processing."""
from __future__ import annotations

import logging
from pathlib import Path

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, name="invoice_tasks.process_invoice")
def process_invoice(self, file_path: str, purchase_id: int) -> dict:  # type: ignore[type-arg]
    """Process an uploaded invoice PDF asynchronously.

    Args:
        file_path: Absolute path to the saved PDF file.
        purchase_id: The Purchase DB row ID to update with parsed results.
    """
    try:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Invoice file not found: {file_path}")

        from app.services.invoice_parser import parse_invoice_pdf
        content = path.read_bytes()
        result = parse_invoice_pdf(content, path.name)

        logger.info("Invoice %s parsed: %s items, supplier=%s", purchase_id, len(result.get("items", [])), result.get("supplier"))
        return {"purchase_id": purchase_id, "result": result}

    except Exception as exc:
        logger.error("Invoice processing failed for purchase %s: %s", purchase_id, exc)
        raise self.retry(exc=exc)
