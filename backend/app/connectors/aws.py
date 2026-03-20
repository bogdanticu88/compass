import asyncio
import json
import logging
from datetime import datetime, UTC
from typing import ClassVar

import boto3

from app.connectors.base import BaseConnector, EvidenceItem, get_controls_for_types, register

logger = logging.getLogger(__name__)


@register
class AWSConnector(BaseConnector):
    name = "aws"
    evidence_types: ClassVar[list[str]] = [
        "audit_logs",
        "model_versioning_records",
        "monitoring_logs",
    ]

    async def collect(self, system_id: str, config: dict) -> list[EvidenceItem]:
        access_key = config.get("access_key_id")
        secret_key = config.get("secret_access_key")
        region = config.get("region")
        if not access_key or not secret_key or not region:
            return []

        boto_kwargs = {
            "aws_access_key_id": access_key,
            "aws_secret_access_key": secret_key,
            "region_name": region,
        }

        loop = asyncio.get_running_loop()
        try:
            cloudtrail = boto3.client("cloudtrail", **boto_kwargs)
            sagemaker = boto3.client("sagemaker", **boto_kwargs)
            config_client = boto3.client("config", **boto_kwargs)

            events_raw = await loop.run_in_executor(
                None,
                lambda: cloudtrail.lookup_events(MaxResults=20),
            )
            models_raw = await loop.run_in_executor(
                None,
                lambda: sagemaker.list_model_packages(MaxResults=20),
            )
            compliance_raw = await loop.run_in_executor(
                None,
                lambda: config_client.get_compliance_summary_by_config_rule(),
            )

            collected_at = datetime.now(UTC).isoformat()

            payloads: dict[str, str] = {
                "audit_logs": json.dumps({
                    "events": [
                        {
                            "id": e.get("EventId"),
                            "name": e.get("EventName"),
                            "time": str(e.get("EventTime", "")),
                            "user": e.get("Username"),
                        }
                        for e in events_raw.get("Events", [])
                    ],
                    "collected_at": collected_at,
                }),
                "model_versioning_records": json.dumps({
                    "models": [
                        {
                            "name": m.get("ModelPackageName"),
                            "created_at": str(m.get("CreationTime", "")),
                            "status": m.get("ModelPackageStatus"),
                        }
                        for m in models_raw.get("ModelPackageSummaryList", [])
                    ],
                    "collected_at": collected_at,
                }),
                "monitoring_logs": json.dumps({
                    "compliance_summary": compliance_raw.get("ComplianceSummariesByConfigRule", []),
                    "collected_at": collected_at,
                }),
            }
        except Exception:
            logger.exception("AWS API request failed for region %s", region)
            return []

        controls = await get_controls_for_types(self.evidence_types)
        items: list[EvidenceItem] = []

        for control in controls:
            for et in control.evidence_types:
                if et in payloads:
                    items.append(EvidenceItem(
                        control_id=control.id,
                        source="aws",
                        payload=payloads[et],
                        status="collected",
                    ))
                    break  # one evidence item per control

        return items
