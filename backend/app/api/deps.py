# backend/app/api/deps.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.brewery import Brewery


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return current_user


async def get_current_brewery(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Brewery:
    """
    Resolves the brewery for the current user.
    Used in all brewery-scoped endpoints (inventory, recipes, etc.)
    """
    result = await db.execute(
        select(Brewery).where(Brewery.owner_id == current_user.id)
    )
    brewery = result.scalar_one_or_none()
    if brewery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No brewery found for this user. Please create one first.",
        )
    return brewery
