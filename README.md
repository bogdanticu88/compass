# Compass

Open-source AI Governance & Compliance Platform.

Assess your AI systems against EU AI Act, DORA, ISO 42001, and NIST AI RMF — with evidence automation and role-based dashboards for executives and assessors.

## Quick Start

```bash
git clone https://github.com/your-org/compass
cd compass
cp .env.example .env
docker compose up --build
```

Then: `make migrate && make seed`

Open http://localhost:3000 and sign in with `admin@compass.dev` / `compass123`.

## Architecture

- **Backend:** FastAPI 0.115 + Python 3.12 + SQLAlchemy 2.0 async + Pydantic v2
- **Frontend:** Next.js 16 App Router + TypeScript + Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL 16 + Alembic migrations
- **Queue:** ARQ + Redis (evidence connector jobs — Phase 2)

## Development

```bash
make dev         # Start all services
make test        # Run backend tests
make migrate     # Apply DB migrations
make seed        # Create admin user + seed framework controls
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI + Python 3.12 + SQLAlchemy 2.0 async |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui |
| Database | PostgreSQL 16 + Alembic |
| Queue | ARQ + Redis |
| Auth | JWT + RBAC (Executive, Risk Manager, Assessor, Admin) |
| Frameworks | EU AI Act, DORA, ISO 42001, NIST AI RMF |

## License

MIT
