import json
import logging
from datetime import datetime
from typing import ClassVar

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.connectors.base import BaseConnector, EvidenceItem, register
from app.models.control import Control

GITHUB_API = "https://api.github.com"
logger = logging.getLogger(__name__)


async def get_controls_for_types(evidence_types: list[str]) -> list[Control]:
    """Load controls from DB whose evidence_types overlap with the given list."""
    engine = create_async_engine(settings.database_url)
    SessionMaker = async_sessionmaker(engine, expire_on_commit=False)
    async with SessionMaker() as db:
        result = await db.execute(select(Control))
        controls = result.scalars().all()
    await engine.dispose()
    return [c for c in controls if any(et in c.evidence_types for et in evidence_types)]


@register
class GitHubConnector(BaseConnector):
    name = "github"
    evidence_types: ClassVar[list[str]] = [
        "audit_logs",
        "monitoring_logs",
        "robustness_tests",
        "model_versioning_records",
    ]

    async def collect(self, system_id: str, config: dict) -> list[EvidenceItem]:
        repo = config.get("repo")
        token = config.get("token")
        if not repo or not token:
            return []

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

        runs_data: list[dict] = []
        releases_data: list[dict] = []

        try:
            async with httpx.AsyncClient(headers=headers, timeout=30) as client:
                runs_resp = await client.get(f"{GITHUB_API}/repos/{repo}/actions/runs?per_page=20")
                runs_resp.raise_for_status()
                runs_data = runs_resp.json().get("workflow_runs", [])

                releases_resp = await client.get(f"{GITHUB_API}/repos/{repo}/releases?per_page=10")
                releases_resp.raise_for_status()
                releases_data = releases_resp.json()
        except Exception:
            logger.exception("GitHub API request failed for repo %s", repo)
            return []

        collected_at = datetime.utcnow().isoformat()

        payloads: dict[str, str] = {
            "audit_logs": json.dumps({
                "runs": [
                    {
                        "id": r["id"],
                        "name": r["name"],
                        "conclusion": r.get("conclusion"),
                        "created_at": r["created_at"],
                    }
                    for r in runs_data
                ],
                "collected_at": collected_at,
            }),
            "monitoring_logs": json.dumps({
                "recent_runs": len(runs_data),
                "last_conclusion": runs_data[0].get("conclusion") if runs_data else None,
                "collected_at": collected_at,
            }),
            "robustness_tests": json.dumps({
                "test_runs": [r for r in runs_data if "test" in r.get("name", "").lower()],
                "collected_at": collected_at,
            }),
            "model_versioning_records": json.dumps({
                "releases": [
                    {
                        "tag": r["tag_name"],
                        "name": r.get("name"),
                        "published_at": r.get("published_at"),
                    }
                    for r in releases_data
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
                        source="github",
                        payload=payloads[et],
                        status="collected",
                    ))
                    break  # one evidence item per control

        return items
