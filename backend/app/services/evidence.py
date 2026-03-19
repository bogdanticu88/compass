from arq.connections import RedisSettings, create_pool
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.connectors.base import EvidenceItem
from app.models.evidence import Evidence


async def enqueue_collection(assessment_id: str, system_id: str) -> None:
    """Enqueue one evidence collection job for the system (job handles all connectors)."""
    redis = await create_pool(RedisSettings.from_dsn(settings.redis_url))
    try:
        await redis.enqueue_job(
            "collect_evidence_job",
            assessment_id=assessment_id,
            system_id=system_id,
        )
    finally:
        await redis.aclose()


async def save_evidence_items(
    db: AsyncSession, assessment_id: str, connector_name: str, items: list[EvidenceItem]
) -> None:
    """Delete existing evidence from this connector for this assessment, then insert fresh rows.
    Wrapped in an explicit transaction — delete and inserts are atomic."""
    async with db.begin():
        await db.execute(
            delete(Evidence).where(
                Evidence.assessment_id == assessment_id,
                Evidence.source == connector_name,
            )
        )
        for item in items:
            evidence = Evidence(
                assessment_id=assessment_id,
                control_id=item.control_id,
                source=item.source,
                payload=item.payload,
                status=item.status,
            )
            db.add(evidence)
