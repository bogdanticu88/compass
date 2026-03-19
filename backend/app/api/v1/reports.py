from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.services.auth import get_current_user
from app.database import get_db
from app.schemas.report import AssessmentReport
from app.services.report import build_report, render_pdf

router = APIRouter()


@router.get("/assessments/{assessment_id}/report")
async def get_report(
    assessment_id: str,
    format: str = "json",
    db=Depends(get_db),
    _=Depends(get_current_user),
):
    report = await build_report(db, assessment_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if format == "pdf":
        pdf_bytes = render_pdf(report)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report-{assessment_id}.pdf"},
        )

    return AssessmentReport(**report)
