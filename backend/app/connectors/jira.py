import base64
import json
import logging
from datetime import datetime, UTC
from typing import ClassVar

import httpx

from app.connectors.base import BaseConnector, EvidenceItem, get_controls_for_types, register

logger = logging.getLogger(__name__)


@register
class JiraConnector(BaseConnector):
    name = "jira"
    evidence_types: ClassVar[list[str]] = [
        "audit_logs",
        "incident_records",
    ]

    async def collect(self, system_id: str, config: dict) -> list[EvidenceItem]:
        base_url = config.get("base_url", "").rstrip("/")
        email = config.get("email")
        api_token = config.get("api_token")
        project_key = config.get("project_key")
        if not base_url or not email or not api_token or not project_key:
            return []

        credentials = base64.b64encode(f"{email}:{api_token}".encode()).decode()
        headers = {
            "Authorization": f"Basic {credentials}",
            "Accept": "application/json",
        }

        issues_data: list[dict] = []

        try:
            async with httpx.AsyncClient(headers=headers, timeout=30) as client:
                jql = (
                    f"project = {project_key} AND "
                    "(labels in (risk, compliance, incident) OR issuetype = Bug) "
                    "ORDER BY created DESC"
                )
                resp = await client.get(
                    f"{base_url}/rest/api/3/search",
                    params={"jql": jql, "maxResults": "50", "fields": "summary,status,issuetype,created"},
                )
                resp.raise_for_status()
                issues_data = resp.json().get("issues", [])
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Jira API returned %s for project %s — check credentials/permissions",
                exc.response.status_code,
                project_key,
            )
            return []
        except Exception:
            logger.exception("Jira API request failed for project %s (network/timeout)", project_key)
            return []

        collected_at = datetime.now(UTC).isoformat()

        incidents = [
            i for i in issues_data
            if (i.get("fields") or {}).get("issuetype", {}).get("name") == "Bug"
        ]
        all_issues = issues_data

        payloads: dict[str, str] = {
            "audit_logs": json.dumps({
                "issues": [
                    {
                        "key": i["key"],
                        "summary": (i.get("fields") or {}).get("summary"),
                        "status": ((i.get("fields") or {}).get("status") or {}).get("name"),
                        "created": (i.get("fields") or {}).get("created"),
                    }
                    for i in all_issues
                ],
                "collected_at": collected_at,
            }),
            "incident_records": json.dumps({
                "incidents": [
                    {
                        "key": i["key"],
                        "summary": (i.get("fields") or {}).get("summary"),
                        "status": ((i.get("fields") or {}).get("status") or {}).get("name"),
                        "created": (i.get("fields") or {}).get("created"),
                    }
                    for i in incidents
                ],
                "collected_at": collected_at,
            }),
        }

        controls = await get_controls_for_types(self.evidence_types)
        items: list[EvidenceItem] = []

        for control in controls:
            for et in control.evidence_types:
                if et in payloads:
                    items.append(EvidenceItem(
                        control_id=control.id,
                        source="jira",
                        payload=payloads[et],
                        status="collected",
                    ))
                    break

        return items
