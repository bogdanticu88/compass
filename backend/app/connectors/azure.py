import json
import logging
from datetime import datetime, UTC
from typing import ClassVar

import httpx

from app.connectors.base import BaseConnector, EvidenceItem, get_controls_for_types, register

ARM_URL = "https://management.azure.com"
LOGIN_URL = "https://login.microsoftonline.com"
logger = logging.getLogger(__name__)


@register
class AzureConnector(BaseConnector):
    name = "azure"
    evidence_types: ClassVar[list[str]] = [
        "audit_logs",
        "monitoring_logs",
        "model_versioning_records",
    ]

    async def collect(self, system_id: str, config: dict) -> list[EvidenceItem]:
        tenant_id = config.get("tenant_id")
        client_id = config.get("client_id")
        client_secret = config.get("client_secret")
        subscription_id = config.get("subscription_id")
        if not all([tenant_id, client_id, client_secret, subscription_id]):
            return []

        resources_data: list[dict] = []
        role_assignments_data: list[dict] = []
        policy_data: list[dict] = []

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                # Get OAuth2 token via client credentials
                token_resp = await client.post(
                    f"{LOGIN_URL}/{tenant_id}/oauth2/v2.0/token",
                    data={
                        "grant_type": "client_credentials",
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "scope": "https://management.azure.com/.default",
                    },
                )
                token_resp.raise_for_status()
                token = token_resp.json()["access_token"]

                headers = {"Authorization": f"Bearer {token}"}

                resources_resp = await client.get(
                    f"{ARM_URL}/subscriptions/{subscription_id}/resources",
                    params={"api-version": "2021-04-01"},
                    headers=headers,
                )
                resources_resp.raise_for_status()
                resources_data = resources_resp.json().get("value", [])

                roles_resp = await client.get(
                    f"{ARM_URL}/subscriptions/{subscription_id}/providers/Microsoft.Authorization/roleAssignments",
                    params={"api-version": "2022-04-01"},
                    headers=headers,
                )
                roles_resp.raise_for_status()
                role_assignments_data = roles_resp.json().get("value", [])

                policy_resp = await client.get(
                    f"{ARM_URL}/subscriptions/{subscription_id}/providers/Microsoft.PolicyInsights/policyStates/latest/summarize",
                    params={"api-version": "2019-10-01"},
                    headers=headers,
                )
                policy_resp.raise_for_status()
                policy_data = policy_resp.json().get("value", [])

            collected_at = datetime.now(UTC).isoformat()

            payloads: dict[str, str] = {
                "audit_logs": json.dumps({
                    "resources": [
                        {
                            "id": r.get("id"),
                            "name": r.get("name"),
                            "type": r.get("type"),
                            "location": r.get("location"),
                        }
                        for r in resources_data[:50]
                    ],
                    "collected_at": collected_at,
                }),
                "monitoring_logs": json.dumps({
                    "role_assignments": [
                        {
                            "id": ra.get("id"),
                            "role_definition_id": (ra.get("properties") or {}).get("roleDefinitionId"),
                            "principal_id": (ra.get("properties") or {}).get("principalId"),
                        }
                        for ra in role_assignments_data[:50]
                    ],
                    "collected_at": collected_at,
                }),
                "model_versioning_records": json.dumps({
                    "policy_compliance": policy_data,
                    "collected_at": collected_at,
                }),
            }

        except httpx.HTTPStatusError as exc:
            logger.error(
                "Azure ARM API returned %s for subscription %s — check credentials",
                exc.response.status_code,
                subscription_id,
            )
            return []
        except Exception:
            logger.exception("Azure API request failed for subscription %s", subscription_id)
            return []

        controls = await get_controls_for_types(self.evidence_types)
        items: list[EvidenceItem] = []

        for control in controls:
            for et in control.evidence_types:
                if et in payloads:
                    items.append(EvidenceItem(
                        control_id=control.id,
                        source="azure",
                        payload=payloads[et],
                        status="collected",
                    ))
                    break  # one evidence item per control

        return items
