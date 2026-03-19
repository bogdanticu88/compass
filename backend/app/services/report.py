import io
from datetime import datetime, timedelta, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib import colors
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.assessment import Assessment
from app.models.evidence import Evidence
from app.models.finding import Finding
from app.models.system import AISystem


def _evidence_status(evidence) -> str:
    if evidence is None:
        return "missing"
    stale_threshold = datetime.now(timezone.utc) - timedelta(days=settings.evidence_stale_days)
    created_at = evidence.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return "stale" if created_at < stale_threshold else str(evidence.status)


async def build_report(db: AsyncSession, assessment_id: str) -> dict | None:
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        return None

    system_result = await db.execute(select(AISystem).where(AISystem.id == assessment.system_id))
    system = system_result.scalar_one_or_none()
    system_name = system.name if system else assessment.system_id

    from app.models.control import Control
    controls_result = await db.execute(
        select(Control).where(Control.framework.in_(assessment.frameworks))
    )
    controls = controls_result.scalars().all()

    evidence_result = await db.execute(
        select(Evidence).where(Evidence.assessment_id == assessment_id)
    )
    evidence_by_control = {e.control_id: e for e in evidence_result.scalars().all()}

    findings_result = await db.execute(
        select(Finding).where(Finding.assessment_id == assessment_id)
    )
    findings = findings_result.scalars().all()

    return {
        "assessment_id": assessment.id,
        "system_name": system_name,
        "frameworks": assessment.frameworks,
        "status": assessment.status,
        "due_date": assessment.due_date,
        "controls": [
            {
                "id": c.id,
                "framework": c.framework,
                "article_ref": c.article_ref,
                "title": c.title,
                "evidence_status": _evidence_status(evidence_by_control.get(c.id)),
                "evidence_source": evidence_by_control[c.id].source if c.id in evidence_by_control else None,
            }
            for c in controls
        ],
        "findings": [
            {
                "control_id": f.control_id,
                "severity": f.severity,
                "description": f.description,
                "status": f.status,
            }
            for f in findings
        ],
    }


def render_pdf(report: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Compass Assessment Report", styles["Title"]))
    story.append(Spacer(1, 0.4*cm))
    story.append(Paragraph(f"System: {report['system_name']}", styles["Heading2"]))
    story.append(Paragraph(f"Frameworks: {', '.join(report['frameworks'])}", styles["Normal"]))
    story.append(Paragraph(f"Status: {report['status']}", styles["Normal"]))
    if report["due_date"]:
        story.append(Paragraph(f"Due date: {report['due_date']}", styles["Normal"]))
    story.append(Spacer(1, 0.6*cm))

    story.append(Paragraph("Controls", styles["Heading2"]))
    story.append(Spacer(1, 0.2*cm))
    header = ["Framework", "Article", "Title", "Evidence"]
    rows = [header] + [
        [c["framework"], c["article_ref"], c["title"][:50], c["evidence_status"]]
        for c in report["controls"]
    ]
    tbl = Table(rows, colWidths=[3*cm, 2.5*cm, 9*cm, 2.5*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(tbl)

    if report["findings"]:
        story.append(Spacer(1, 0.6*cm))
        story.append(Paragraph("Findings", styles["Heading2"]))
        story.append(Spacer(1, 0.2*cm))
        fheader = ["Severity", "Description", "Status"]
        frows = [fheader] + [
            [f["severity"], f["description"][:70], f["status"]]
            for f in report["findings"]
        ]
        ftbl = Table(frows, colWidths=[2.5*cm, 12*cm, 2.5*cm])
        ftbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(ftbl)

    doc.build(story)
    return buf.getvalue()
