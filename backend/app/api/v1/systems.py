from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.system import AISystem
from app.models.user import User
from app.schemas.system import SystemCreate, SystemRead, SystemUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/systems", tags=["systems"])


@router.post("", response_model=SystemRead, status_code=status.HTTP_201_CREATED)
async def create_system(
    body: SystemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    system = AISystem(**body.model_dump(), owner_id=current_user.id)
    db.add(system)
    await db.commit()
    await db.refresh(system)
    return system


@router.get("", response_model=list[SystemRead])
async def list_systems(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(AISystem).order_by(AISystem.created_at.desc()))
    return result.scalars().all()


@router.get("/{system_id}", response_model=SystemRead)
async def get_system(
    system_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(AISystem).where(AISystem.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    return system


@router.patch("/{system_id}", response_model=SystemRead)
async def update_system(
    system_id: str,
    body: SystemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(AISystem).where(AISystem.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(system, field, value)
    await db.commit()
    await db.refresh(system)
    return system


@router.delete("/{system_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_system(
    system_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(AISystem).where(AISystem.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=404, detail="System not found")
    await db.delete(system)
    await db.commit()
