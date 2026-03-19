async def test_login_success(client, admin_user):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "admin@compass.dev",
        "password": "password123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


async def test_login_wrong_password(client, admin_user):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "admin@compass.dev",
        "password": "wrong",
    })
    assert resp.status_code == 401


async def test_login_unknown_email(client):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "nobody@compass.dev",
        "password": "password123",
    })
    assert resp.status_code == 401


async def test_me_returns_current_user(client, admin_user):
    login = await client.post("/api/v1/auth/login", json={
        "email": "admin@compass.dev",
        "password": "password123",
    })
    token = login.json()["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@compass.dev"
    assert resp.json()["role"] == "admin"


async def test_me_requires_auth(client):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
