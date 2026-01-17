from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()


@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)."""
    from sqlalchemy import select
    from app.models.user import User
    
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    
    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ]
    }


@router.get("/logs")
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get audit logs (admin only)."""
    # TODO: Implement audit logging
    return {
        "message": "Audit logs not implemented yet",
        "logs": []
    }


@router.post("/backup")
async def create_backup(
    db: AsyncSession = Depends(get_db)
):
    """Create database backup (admin only)."""
    # TODO: Implement backup functionality
    return {
        "message": "Backup functionality not implemented yet"
    }
