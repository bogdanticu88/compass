import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest_asyncio.fixture
async def report_setup(client, assessor_user, seeded_controls):
    """Login, create a system and an assessment, return (client, token, assessment_id)."""
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "assessor@compass.dev", "password": "password123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    sys_resp = await client.post(
        "/api/v1/systems",
        json={"name": "Report Test System", "risk_tier": "high"},
        headers=headers,
    )
    system_id = sys_resp.json()["id"]

    assess_resp = await client.post(
        "/api/v1/assessments",
        json={"system_id": system_id, "frameworks": ["eu_ai_act"]},
        headers=headers,
    )
    assessment_id = assess_resp.json()["id"]

    return client, token, assessment_id


@pytest.mark.asyncio
async def test_report_requires_auth(client: AsyncClient, assessor_user, seeded_controls):
    # Create an assessment first so we have a real assessment_id
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "assessor@compass.dev", "password": "password123"},
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    sys_resp = await client.post(
        "/api/v1/systems",
        json={"name": "Auth Test System", "risk_tier": "high"},
        headers=headers,
    )
    assess_resp = await client.post(
        "/api/v1/assessments",
        json={"system_id": sys_resp.json()["id"], "frameworks": ["eu_ai_act"]},
        headers=headers,
    )
    assessment_id = assess_resp.json()["id"]

    resp = await client.get(f"/api/v1/assessments/{assessment_id}/report")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_json_report_shape(report_setup):
    client, token, assessment_id = report_setup
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get(
        f"/api/v1/assessments/{assessment_id}/report?format=json",
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "assessment_id" in data
    assert "system_name" in data
    assert "frameworks" in data
    assert "controls" in data
    assert "findings" in data
    assert "status" in data
    assert "due_date" in data


@pytest.mark.asyncio
async def test_pdf_report_returns_pdf_content_type(report_setup):
    client, token, assessment_id = report_setup
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get(
        f"/api/v1/assessments/{assessment_id}/report?format=pdf",
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "attachment" in resp.headers.get("content-disposition", "")


@pytest.mark.asyncio
async def test_report_404_for_unknown_assessment(report_setup):
    client, token, _ = report_setup
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get(
        "/api/v1/assessments/00000000-0000-0000-0000-000000000000/report?format=json",
        headers=headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_json_report_default_format(report_setup):
    client, token, assessment_id = report_setup
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.get(
        f"/api/v1/assessments/{assessment_id}/report",
        headers=headers,
    )
    assert resp.status_code == 200
    assert "application/json" in resp.headers["content-type"]
