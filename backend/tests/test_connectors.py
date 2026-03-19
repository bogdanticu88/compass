import pytest
from app.connectors.base import BaseConnector, EvidenceItem, CONNECTOR_REGISTRY
from app.connectors.manual import ManualConnector


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
