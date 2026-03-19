from app.connectors.base import BaseConnector, EvidenceItem, register


@register
class ManualConnector(BaseConnector):
    name = "manual"
    evidence_types: list[str] = []  # manual can satisfy any evidence type — no pre-collection

    async def collect(self, system_id: str, config: dict) -> list[EvidenceItem]:
        return []  # evidence is created directly via the evidence upload API
