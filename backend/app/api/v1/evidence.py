from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.assessment import Assessment
from app.models.control import Control
from app.models.evidence import Evidence
from app.models.user import Role, User
from app.schemas.evidence import EvidenceCreate, EvidenceRead
from app.services.auth import get_current_user, require_roles

router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post("", response_model=EvidenceRead, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    body: EvidenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.admin, Role.assessor)),
):
    """Upload manual evidence for a specific control in an assessment."""
    # Validate assessment exists
    assessment = (await db.execute(select(Assessment).where(Assessment.id == body.assessment_id))).scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Validate control exists
    control = (await db.execute(select(Control).where(Control.id == body.control_id))).scalar_one_or_none()
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")

    async with db.begin_nested():
        await db.execute(
            delete(Evidence).where(
                Evidence.assessment_id == body.assessment_id,
                Evidence.control_id == body.control_id,
                Evidence.source == "manual",
            )
        )
        evidence = Evidence(
            assessment_id=body.assessment_id,
            control_id=body.control_id,
            source="manual",
            payload=body.payload,
            status="collected",
        )
        db.add(evidence)
    await db.commit()
    await db.refresh(evidence)
    return evidence
