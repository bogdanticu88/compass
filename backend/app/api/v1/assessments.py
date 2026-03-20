import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.assessment import Assessment
from app.models.user import User
from app.schemas.assessment import AssessmentCreate, AssessmentRead
from app.models.assessment_control import AssessmentControl
from app.models.evidence import Evidence
from app.models.finding import Finding
from app.services.assessment import create_assessment, get_assessment_detail, submit_assessment
from app.services.auth import get_current_user

router = APIRouter(prefix="/assessments", tags=["assessments"])
logger = logging.getLogger(__name__)


@router.post("", response_model=AssessmentRead, status_code=status.HTTP_201_CREATED)
async def create(
    body: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_assessment(db, body.system_id, current_user.id, body.frameworks, body.due_date)


@router.get("", response_model=list[AssessmentRead])
async def list_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Assessment).order_by(Assessment.created_at.desc()))
    return result.scalars().all()


@router.get("/{assessment_id}")
async def get_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    detail = await get_assessment_detail(db, assessment_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return detail


@router.post("/{assessment_id}/submit", response_model=AssessmentRead)
async def submit(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = await submit_assessment(db, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # delete child rows first to avoid FK violations
    for model in (Finding, Evidence, AssessmentControl):
        rows = await db.execute(select(model).where(model.assessment_id == assessment_id))
        for row in rows.scalars().all():
            await db.delete(row)

    await db.delete(assessment)
    await db.commit()


@router.post("/{assessment_id}/recollect", status_code=status.HTTP_202_ACCEPTED)
async def recollect(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    try:
        from app.services.evidence import enqueue_collection
        await enqueue_collection(assessment.id, assessment.system_id)
    except Exception as exc:
        logger.warning("Evidence collection enqueue failed (non-fatal): %s", exc)
    return {"message": "Evidence collection queued"}
