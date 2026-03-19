from pydantic import BaseModel


class ControlInReport(BaseModel):
    id: str
    framework: str
    article_ref: str
    title: str
    evidence_status: str  # collected | stale | missing
    evidence_source: str | None = None


class FindingInReport(BaseModel):
    control_id: str
    severity: str
    description: str
    status: str


class AssessmentReport(BaseModel):
    assessment_id: str
    system_name: str
    frameworks: list[str]
    status: str
    due_date: str | None
    controls: list[ControlInReport]
    findings: list[FindingInReport]
