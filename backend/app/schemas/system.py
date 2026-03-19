from pydantic import BaseModel


class SystemCreate(BaseModel):
    name: str
    description: str | None = None
    risk_tier: str
    business_unit: str | None = None
    status: str = "draft"


class SystemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    risk_tier: str | None = None
    business_unit: str | None = None
    status: str | None = None


class SystemRead(BaseModel):
    id: str
    name: str
    description: str | None
    owner_id: str
    risk_tier: str
    business_unit: str | None
    status: str

    model_config = {"from_attributes": True}
