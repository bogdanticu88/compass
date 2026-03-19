import base64
import json
import logging
from datetime import datetime, UTC
from typing import ClassVar

import httpx

from app.connectors.base import BaseConnector, EvidenceItem, get_controls_for_types, register

logger = logging.getLogger(__name__)


@register
class ServiceNowConnector(BaseConnector):
    name = "servicenow"
    evidence_types: ClassVar[list[str]] = [
        "audit_logs",
        "incident_records",
        "model_versioning_records",
    ]

    async def collect(self, system_id: str, config: dict) -> list[EvidenceItem]:
        instance_url = config.get("instance_url", "").rstrip("/")
        username = config.get("username")
        password = config.get("password")
        if not instance_url or not username or not password:
            return []

        credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
        headers = {
            "Authorization": f"Basic {credentials}",
            "Accept": "application/json",
        }

        common_params = {
            "sysparm_limit": "10",
            "sysparm_fields": "number,short_description,state,opened_at",
        }

        change_data: list[dict] = []
        incident_data: list[dict] = []
        risk_data: list[dict] = []

        try:
            async with httpx.AsyncClient(headers=headers, timeout=30) as client:
                change_resp = await client.get(
                    f"{instance_url}/api/now/table/change_request",
                    params=common_params,
                )
                change_resp.raise_for_status()
                change_data = change_resp.json().get("result", [])

                incident_resp = await client.get(
                    f"{instance_url}/api/now/table/incident",
                    params=common_params,
                )
                incident_resp.raise_for_status()
                incident_data = incident_resp.json().get("result", [])

                try:
                    risk_resp = await client.get(
                        f"{instance_url}/api/now/table/sn_risk_risk",
                        params={
                            "sysparm_limit": "10",
                            "sysparm_fields": "name,short_description,risk_rating,opened_at",
                        },
                    )
                    risk_resp.raise_for_status()
                    risk_data = risk_resp.json().get("result", [])
                except httpx.HTTPStatusError:
                    # sn_risk_risk table not available on all ServiceNow instances
                    logger.debug("sn_risk_risk table not found on %s — skipping", instance_url)

        except httpx.HTTPStatusError as exc:
            logger.error(
                "ServiceNow API returned %s for %s — check credentials/permissions",
                exc.response.status_code,
                instance_url,
            )
            return []
        except Exception:
            logger.exception("ServiceNow API request failed for %s (network/timeout)", instance_url)
            return []

        collected_at = datetime.now(UTC).isoformat()

        payloads: dict[str, str] = {
            "audit_logs": json.dumps({
                "change_requests": [
                    {
                        "number": r.get("number"),
                        "description": r.get("short_description"),
                        "state": r.get("state"),
                        "opened_at": r.get("opened_at"),
                    }
                    for r in change_data
                ],
                "collected_at": collected_at,
            }),
            "incident_records": json.dumps({
                "incidents": [
                    {
                        "number": r.get("number"),
                        "description": r.get("short_description"),
                        "state": r.get("state"),
                        "opened_at": r.get("opened_at"),
                    }
                    for r in incident_data
                ],
                "collected_at": collected_at,
            }),
            "model_versioning_records": json.dumps({
                "risk_register": [
                    {
                        "name": r.get("name"),
                        "description": r.get("short_description"),
                        "risk_rating": r.get("risk_rating"),
                        "opened_at": r.get("opened_at"),
                    }
                    for r in risk_data
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
                        source="servicenow",
                        payload=payloads[et],
                        status="collected",
                    ))
                    break

        return items
