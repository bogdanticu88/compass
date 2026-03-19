import pytest


@pytest.mark.asyncio
async def test_create_system(client, assessor_user):
    login = await client.post("/api/v1/auth/login", json={"email": "assessor@compass.dev", "password": "password123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/api/v1/systems", json={
        "name": "Credit Scoring Model",
        "description": "ML model for loan decisions",
        "risk_tier": "high",
        "business_unit": "Retail Banking",
    }, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Credit Scoring Model"
    assert data["owner_id"] == assessor_user.id


@pytest.mark.asyncio
async def test_list_systems(client, assessor_user):
    login = await client.post("/api/v1/auth/login", json={"email": "assessor@compass.dev", "password": "password123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/v1/systems", json={"name": "System A", "risk_tier": "high"}, headers=headers)
    await client.post("/api/v1/systems", json={"name": "System B", "risk_tier": "minimal"}, headers=headers)

    resp = await client.get("/api/v1/systems", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_get_system(client, assessor_user):
    login = await client.post("/api/v1/auth/login", json={"email": "assessor@compass.dev", "password": "password123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create = await client.post("/api/v1/systems", json={"name": "System A", "risk_tier": "high"}, headers=headers)
    system_id = create.json()["id"]

    resp = await client.get(f"/api/v1/systems/{system_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == system_id


@pytest.mark.asyncio
async def test_systems_requires_auth(client):
    resp = await client.get("/api/v1/systems")
    assert resp.status_code == 401
