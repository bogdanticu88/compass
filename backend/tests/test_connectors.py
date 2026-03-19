import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.connectors.base import BaseConnector, EvidenceItem, CONNECTOR_REGISTRY
from app.connectors.manual import ManualConnector
from app.connectors.github import GitHubConnector


def test_evidence_item_fields():
    item = EvidenceItem(control_id="c1", source="github", payload='{"runs": []}')
    assert item.control_id == "c1"
    assert item.source == "github"
    assert item.status == "collected"


def test_manual_connector_registered():
    assert "manual" in CONNECTOR_REGISTRY


def test_manual_connector_evidence_types():
    c = ManualConnector()
    assert len(c.evidence_types) == 0  # manual handles everything — types checked at runtime


@pytest.mark.asyncio
async def test_manual_connector_collect_returns_empty():
    c = ManualConnector()
    result = await c.collect("system-1", {})
    assert result == []


def test_github_connector_registered():
    assert "github" in CONNECTOR_REGISTRY


def make_mock_response(data, status: int = 200):
    mock = MagicMock()
    mock.status_code = status
    mock.json.return_value = data
    mock.raise_for_status = MagicMock()
    return mock


@pytest.mark.asyncio
async def test_github_connector_returns_evidence_for_matching_controls():
    runs_response = {
        "workflow_runs": [
            {"id": 1, "name": "CI", "status": "completed", "conclusion": "success", "created_at": "2026-01-01T00:00:00Z"},
        ]
    }
    releases_response = [
        {"tag_name": "v1.0.0", "published_at": "2026-01-01T00:00:00Z", "name": "Initial release"},
    ]

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=[
        make_mock_response(runs_response),
        make_mock_response(releases_response),
    ])

    mock_controls = [
        MagicMock(id="c1", evidence_types=["audit_logs"]),
        MagicMock(id="c2", evidence_types=["model_versioning_records"]),
        MagicMock(id="c3", evidence_types=["risk_register"]),  # not covered by GitHub
    ]

    connector = GitHubConnector()
    with patch("app.connectors.github.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.github.get_controls_for_types", return_value=mock_controls):
            items = await connector.collect("system-1", {"repo": "org/repo", "token": "ghp_test"})

    covered_ids = {item.control_id for item in items}
    assert "c1" in covered_ids
    assert "c2" in covered_ids
    assert "c3" not in covered_ids
    assert all(item.source == "github" for item in items)


@pytest.mark.asyncio
async def test_github_connector_handles_api_error_gracefully():
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=Exception("Connection refused"))

    connector = GitHubConnector()
    with patch("app.connectors.github.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.github.get_controls_for_types", return_value=[]):
            items = await connector.collect("system-1", {"repo": "org/repo", "token": "ghp_test"})

    assert items == []


@pytest.mark.asyncio
async def test_github_connector_missing_config_returns_empty():
    connector = GitHubConnector()
    items = await connector.collect("system-1", {})  # no token, no repo
    assert items == []
