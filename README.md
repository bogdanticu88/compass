
# Compass

**AI Governance & Compliance Platform**

Compass helps organizations run structured assessments of their AI systems against major regulatory frameworks — EU AI Act, DORA, ISO 42001, and NIST AI RMF — with automated evidence collection from your existing tools.

---

## What it does

- **Multi-framework assessments** — evaluate AI systems against EU AI Act, DORA, ISO 42001, and NIST AI RMF in a single workflow
- **Evidence automation** — connectors pull evidence from GitHub, Azure DevOps, Jira, and ServiceNow automatically
- **Role-based UX** — Control Room dashboard for executives; guided workflow for assessors
- **Findings & reports** — gaps auto-generate findings; export reports as JSON or PDF
- **Self-hosted** — `docker compose up` and you're running; Helm chart for Kubernetes

---

## Quick start

```bash
git clone https://github.com/bogdanticu88/Compass
cd Compass
cp .env.example .env   # edit secrets
docker compose up
```

Open `http://localhost:3000` — the setup wizard will guide you through creating the first admin account.

**Default ports:**
| Service | Port |
|---------|------|
| Web UI | 3000 |
| API | 8000 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## Architecture

```
compass/
├── backend/          # FastAPI + SQLAlchemy + ARQ workers
│   └── app/
│       ├── api/v1/      # REST endpoints
│       ├── connectors/  # Evidence connectors (GitHub, Azure DevOps, Jira, ServiceNow)
│       ├── frameworks/  # EU AI Act, DORA, ISO 42001, NIST AI RMF control packs
│       ├── models/      # SQLAlchemy ORM models
│       ├── services/    # Business logic
│       └── workers/     # ARQ async jobs
├── frontend/         # Next.js 16 + Tailwind CSS + shadcn/ui
│   └── app/
│       ├── (control-room)/  # Executive dashboard
│       └── (assessor)/      # Guided assessment workflow
├── charts/compass/   # Helm chart for Kubernetes
└── docker-compose.yml
```

**Data model:**
```
System → Assessments → Controls → Evidence (auto or manual)
                              └── Findings (gaps)
```

---

## Evidence Connectors

| Connector | Evidence collected |
|-----------|-------------------|
| GitHub | CI results, test coverage, PR reviews, release history |
| Azure DevOps | Pipeline results, release records |
| Jira | Risk and compliance tickets, incident records |
| ServiceNow | Change requests, incidents, risk register |
| Manual | Free-text notes, links, document references |

Configure connectors per system in **Settings → Connectors**.

---

## Frameworks

| Framework | Focus |
|-----------|-------|
| EU AI Act | Risk classification, transparency, human oversight |
| DORA | ICT resilience, incident management, third-party risk |
| ISO 42001 | AI management system requirements |
| NIST AI RMF | Govern, Map, Measure, Manage |

---

## Deployment

### Docker Compose (recommended for self-hosting)

```bash
cp .env.example .env  # set your secrets
docker compose up -d
```

All 5 services start automatically: `api`, `worker`, `web`, `db`, `redis`.

### Kubernetes (Helm)

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm dependency update charts/compass
helm install compass charts/compass \
  --set secrets.secretKey=<your-secret> \
  --set secrets.jwtSecret=<your-jwt-secret> \
  --set ingress.host=compass.yourorg.com
```

---

## Development

**Requirements:** Python 3.12+, Node 20+, Docker

```bash
# Backend
cd backend
uv venv && uv pip install -e ".[dev]"
pytest --cov

# Frontend
cd frontend
pnpm install
pnpm dev
```

Backend API docs available at `http://localhost:8000/docs` when running.

---

## License

MIT — see [LICENSE](LICENSE).
