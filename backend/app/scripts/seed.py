"""
Run: docker compose run --rm api python -m app.scripts.seed
Creates admin@compass.dev / compass123 and seeds framework controls.
Idempotent — safe to run multiple times.
"""
import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.frameworks import FRAMEWORKS
from app.models.control import Control
from app.models.user import Role, User
from app.services.auth import hash_password


async def seed():
    async with AsyncSessionLocal() as db:
        # Admin user
        existing = await db.execute(select(User).where(User.email == "admin@compass.dev"))
        if not existing.scalar_one_or_none():
            admin = User(
                email="admin@compass.dev",
                hashed_password=hash_password("compass123"),
                full_name="Compass Admin",
                role=Role.admin,
            )
            db.add(admin)
            print("Created admin@compass.dev / compass123")

        # Framework controls
        for slug, pack in FRAMEWORKS.items():
            for ctrl_def in pack.controls:
                existing = await db.execute(
                    select(Control).where(
                        Control.framework == slug,
                        Control.article_ref == ctrl_def.article_ref,
                    )
                )
                if existing.scalar_one_or_none():
                    continue
                db.add(Control(
                    framework=slug,
                    article_ref=ctrl_def.article_ref,
                    title=ctrl_def.title,
                    requirement=ctrl_def.requirement,
                    evidence_types=ctrl_def.evidence_types,
                ))
        await db.commit()
        print(f"Seeded controls for: {', '.join(FRAMEWORKS.keys())}")


if __name__ == "__main__":
    asyncio.run(seed())
