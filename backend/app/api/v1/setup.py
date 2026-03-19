from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, Role
from app.services.auth import hash_password

router = APIRouter()


class SetupInitRequest(BaseModel):
    full_name: str
    email: str
    password: str


@router.get("/setup/status")
async def setup_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count()).select_from(User))
    count = result.scalar_one()
    return {"needs_setup": count == 0}


@router.post("/setup/init", status_code=201)
async def setup_init(payload: SetupInitRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count()).select_from(User))
    if result.scalar_one() > 0:
        raise HTTPException(status_code=409, detail="Setup already complete")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=Role.admin,
    )
    db.add(user)
    await db.commit()
    return {"message": "Admin created successfully"}
