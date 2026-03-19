from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.control import Control
from app.models.user import User
from app.schemas.control import ControlRead
from app.services.auth import get_current_user

router = APIRouter(prefix="/controls", tags=["controls"])


@router.get("", response_model=list[ControlRead])
async def list_controls(
    framework: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Control)
    if framework:
        query = query.where(Control.framework == framework)
    result = await db.execute(query.order_by(Control.framework, Control.article_ref))
    return result.scalars().all()
