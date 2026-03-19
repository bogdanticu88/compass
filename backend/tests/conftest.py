import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.database import get_db
from app.main import app
from app.models import Base, User, Role
from app.services.auth import hash_password

TEST_DB_URL = "postgresql+asyncpg://compass:compass@localhost:5432/compass_test"


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    engine = create_async_engine(TEST_DB_URL, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    engine = create_async_engine(TEST_DB_URL, poolclass=NullPool)
    TestSession = async_sessionmaker(engine, expire_on_commit=False)
    async with TestSession() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(db):
    user = User(
        email="admin@compass.dev",
        hashed_password=hash_password("password123"),
        full_name="Admin User",
        role=Role.admin,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def assessor_user(db):
    user = User(
        email="assessor@compass.dev",
        hashed_password=hash_password("password123"),
        full_name="Assessor User",
        role=Role.assessor,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
