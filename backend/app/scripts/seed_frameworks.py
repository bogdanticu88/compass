"""
Run with: python -m app.scripts.seed_frameworks
Idempotent — skips existing controls matched by (framework, article_ref).
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.frameworks import FRAMEWORKS
from app.models.control import Control


async def seed():
    async with AsyncSessionLocal() as db:
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
                control = Control(
                    framework=slug,
                    article_ref=ctrl_def.article_ref,
                    title=ctrl_def.title,
                    requirement=ctrl_def.requirement,
                    evidence_types=ctrl_def.evidence_types,
                )
                db.add(control)
        await db.commit()
        print("Framework controls seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
