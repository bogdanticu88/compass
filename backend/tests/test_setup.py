import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_setup_status_returns_needs_setup_bool(client: AsyncClient):
    resp = await client.get("/api/v1/setup/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "needs_setup" in data
    assert isinstance(data["needs_setup"], bool)


@pytest.mark.asyncio
async def test_setup_init_blocked_when_users_exist(client: AsyncClient, admin_user):
    # admin_user fixture seeds a user into the DB
    resp = await client.post("/api/v1/setup/init", json={
        "full_name": "Admin",
        "email": "newadmin@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_setup_init_requires_all_fields(client: AsyncClient):
    resp = await client.post("/api/v1/setup/init", json={"email": "x@x.com"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_setup_init_creates_admin(client: AsyncClient):
    # Fresh DB (no users yet due to autouse setup_db fixture)
    resp = await client.post("/api/v1/setup/init", json={
        "full_name": "First Admin",
        "email": "firstadmin@example.com",
        "password": "securepass123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["message"] == "Admin created successfully"


@pytest.mark.asyncio
async def test_setup_status_false_after_init(client: AsyncClient):
    # Create admin first
    await client.post("/api/v1/setup/init", json={
        "full_name": "First Admin",
        "email": "firstadmin@example.com",
        "password": "securepass123",
    })
    # Now status should say needs_setup=False
    resp = await client.get("/api/v1/setup/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["needs_setup"] is False
