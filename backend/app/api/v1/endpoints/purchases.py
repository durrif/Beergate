from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.purchase import Purchase, PurchaseStatus
from datetime import date

router = APIRouter()


@router.get("/")
async def list_purchases(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """List purchases."""
    from sqlalchemy import select
    
    result = await db.execute(
        select(Purchase)
        .order_by(Purchase.purchase_date.desc())
        .offset(skip)
        .limit(limit)
    )
    purchases = result.scalars().all()
    
    return {
        "purchases": [
            {
                "id": str(p.id),
                "supplier": p.supplier,
                "purchase_date": p.purchase_date.isoformat(),
                "total_cost": float(p.total_cost) if p.total_cost else None,
                "status": p.status,
                "invoice_number": p.invoice_number
            }
            for p in purchases
        ]
    }


@router.post("/")
async def create_purchase(
    supplier: str,
    purchase_date: str,  # ISO format
    total_cost: float = None,
    invoice_number: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Create a manual purchase."""
    # TODO: Get user_id from auth
    user_id = "00000000-0000-0000-0000-000000000000"
    
    purchase = Purchase(
        user_id=user_id,
        supplier=supplier,
        purchase_date=date.fromisoformat(purchase_date),
        total_cost=total_cost,
        invoice_number=invoice_number,
        status=PurchaseStatus.PENDING
    )
    
    db.add(purchase)
    await db.commit()
    await db.refresh(purchase)
    
    return {
        "id": str(purchase.id),
        "supplier": purchase.supplier,
        "status": purchase.status
    }


@router.post("/upload-invoice")
async def upload_invoice(
    file: UploadFile = File(...),
    supplier: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Upload invoice PDF for processing."""
    import os
    from app.core.config import settings
    
    # TODO: Get user_id from auth
    user_id = "00000000-0000-0000-0000-000000000000"
    
    # Save file
    upload_dir = os.path.join(settings.UPLOAD_DIR, "invoices")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{date.today().isoformat()}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create purchase
    purchase = Purchase(
        user_id=user_id,
        supplier=supplier,
        purchase_date=date.today(),
        invoice_file_path=file_path,
        status=PurchaseStatus.PENDING
    )
    
    db.add(purchase)
    await db.commit()
    await db.refresh(purchase)
    
    # TODO: Queue Celery task to process invoice
    # process_invoice_task.delay(str(purchase.id))
    
    return {
        "purchase_id": str(purchase.id),
        "status": purchase.status,
        "message": "Invoice uploaded successfully. Processing will start shortly."
    }


@router.get("/{purchase_id}")
async def get_purchase(
    purchase_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get purchase details."""
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(Purchase)
        .where(Purchase.id == purchase_id)
        .options(selectinload(Purchase.items))
    )
    purchase = result.scalar_one_or_none()
    
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    return {
        "id": str(purchase.id),
        "supplier": purchase.supplier,
        "purchase_date": purchase.purchase_date.isoformat(),
        "total_cost": float(purchase.total_cost) if purchase.total_cost else None,
        "status": purchase.status,
        "invoice_number": purchase.invoice_number,
        "items": [
            {
                "id": str(item.id),
                "product_name_raw": item.product_name_raw,
                "ingredient_id": str(item.ingredient_id) if item.ingredient_id else None,
                "quantity": float(item.quantity),
                "unit": item.unit,
                "total_price": float(item.total_price) if item.total_price else None,
                "matched_confidence": float(item.matched_confidence) if item.matched_confidence else None
            }
            for item in purchase.items
        ]
    }
