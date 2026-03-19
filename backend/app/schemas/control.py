from pydantic import BaseModel


class ControlRead(BaseModel):
    id: str
    framework: str
    article_ref: str
    title: str
    requirement: str
    evidence_types: list[str]

    model_config = {"from_attributes": True}
