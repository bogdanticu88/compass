from app.connectors.base import BaseConnector, EvidenceItem, register


@register
class GitHubConnector(BaseConnector):
    name = "github"
    evidence_types = ["audit_logs", "monitoring_logs", "robustness_tests", "model_versioning_records"]

    async def collect(self, system_id: str, config: dict) -> list[EvidenceItem]:
        return []  # implemented in Task 4
