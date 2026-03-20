![Compass AI Governance Platform](https://github.com/user-attachments/assets/2134e485-bfd3-47fa-8a6a-5e06be508a22)

# Compass

**AI Governance and Compliance Platform**

Compass is a self-hosted platform that helps engineering and compliance teams run structured assessments of their AI systems against the major regulatory frameworks. It tracks compliance across EU AI Act, DORA, ISO 42001, NIST AI RMF, and GDPR in one place, automates evidence collection from your existing tools, surfaces gaps as findings, and generates audit-ready reports.

It is built for teams that need to show regulators, auditors, or internal governance boards that their AI systems are properly assessed and documented, without spending months in spreadsheets.

---

## What problem it solves

AI regulation is accelerating. The EU AI Act is now in effect. DORA applies to financial entities and their ICT providers. ISO 42001 is being adopted as a voluntary standard. GDPR continues to apply wherever personal data is processed. Each framework has dozens of controls, and most organisations end up managing compliance in disconnected spreadsheets, shared drives, and email threads.

Compass replaces that with a structured workflow: register your AI systems, run an assessment against the frameworks that apply to you, collect evidence (manually or automatically from GitHub, Jira, Azure DevOps, ServiceNow), track findings, and export a report. Everything is versioned, role-separated, and auditable.

---

## Features

### Five regulatory frameworks, one workflow

Compass covers five frameworks out of the box. You select which ones apply to each system at assessment creation time, and the platform scopes all controls, questions, and findings to only those frameworks.

| Framework | What it covers |
|-----------|----------------|
| EU AI Act | Risk classification, transparency obligations, human oversight, conformity assessment |
| DORA | ICT operational resilience, incident management, third-party risk, testing |
| ISO 42001 | AI management system requirements, objectives, continual improvement |
| NIST AI RMF | Govern, Map, Measure, Manage functions for AI risk |
| GDPR | Data protection by design, lawful basis, data subject rights, DPIAs |

### Control Room dashboard (executive view)

The Control Room is the high-level view for leads, managers, and anyone who needs to see the compliance posture across all systems without doing assessment work. It shows:

- Per-framework compliance scores across all completed assessments
- Total AI systems registered, active vs inactive
- Assessment pipeline status (draft, in review, complete)
- Open findings broken down by severity (critical, high, medium, low)
- Overdue assessments
- Systems not yet covered by any assessment

From the Control Room you can export the full picture as an HTML report, a Markdown document, or an Excel workbook with separate sheets for summary, framework compliance, systems, assessments, findings, and deadlines.

### Assessor workbench

The assessor view is where the actual compliance work happens. Assessors work through assessments control by control, entering evidence for each one, and submitting when done.

Each assessment shows:

- Which AI system is being assessed and which frameworks apply
- A control-by-control checklist with evidence fields
- Progress bar showing how many controls have evidence
- Status transitions from draft to in-review to complete
- Option to trigger an automated recollect from connected tools

### Guided questionnaire

The questionnaire is the fastest way to fill an assessment. Instead of going control by control, the assessor answers 38 plain-language questions across 9 sections covering risk governance, data practices, model documentation, testing, incident response, and more.

Compass scores each answer from 0 to 3, computes a compliance percentage per framework, assigns an advisory risk tier (Critical, Elevated, Moderate, Controlled), and shows a review screen with proposed findings for any weak areas. When the assessor clicks Apply, Compass generates evidence text for every relevant control and pre-fills the assessment in one shot.

The questionnaire supports all five frameworks and only asks questions relevant to the frameworks selected for that assessment.

### Evidence collection

Evidence is the core of a defensible compliance record. Compass collects it in two ways.

**Automated connectors** pull evidence from the tools your team already uses:

| Connector | What it collects |
|-----------|-----------------|
| GitHub | CI/CD workflow runs, test coverage, PR reviews, release history, branch protection status |
| Azure DevOps | Pipeline build results, release records, work item history |
| Jira | Risk and compliance tickets, incident records |
| ServiceNow | Change requests, incidents, risk register entries |
| AWS | CloudTrail audit logs, Config rule compliance, SageMaker model records |
| Azure | Activity Log events, Policy compliance state, role assignments |

Connectors are configured per system under the Connectors page, accessible from the assessment detail view. Each connector stores only the credentials you provide and never exposes them back through the API. Evidence is pulled when you click Re-collect on an assessment and mapped automatically to the relevant framework controls.

**Manual evidence** lets assessors enter free-text notes, paste in document references, or link to artefacts in other systems for controls that automated collection cannot cover.

When evidence is older than the configured threshold (default 30 days), Compass flags it as stale so you know what needs refreshing before an audit.

### Findings management

Whenever a control has insufficient evidence, Compass creates a finding. Findings have a severity (critical, high, medium, low), a status (open, in progress, resolved), a description of the gap, and a recommended remediation. Assessors can track findings through to resolution, and the Control Room shows open finding counts at a glance.

### Reports and exports

Completed assessments can be exported as JSON (machine-readable, suitable for passing to other tooling) or PDF (formatted for auditors and board packs). The Control Room can export the full organisational picture as HTML, Markdown, or Excel.

### Role-based access

Compass has two roles:

- **Control Room** users see the executive dashboard and can export reports but do not run assessments.
- **Assessor** users work on assessments, fill in evidence, run the questionnaire, and manage findings.

Authentication uses JWT tokens. Account creation is handled through the setup wizard on first run.

---

## Architecture

Compass is a standard three-tier web application. There is nothing exotic about the stack.

```
compass/
├── backend/              # FastAPI + SQLAlchemy + ARQ async workers
│   └── app/
│       ├── api/v1/       # REST endpoints (auth, systems, assessments, evidence, findings, reports, dashboard)
│       ├── connectors/   # Evidence connectors (GitHub, Azure DevOps, Jira, ServiceNow, AWS, Azure)
│       ├── frameworks/   # Control packs for EU AI Act, DORA, ISO 42001, NIST AI RMF, GDPR
│       ├── models/       # SQLAlchemy ORM models
│       ├── services/     # Business logic
│       └── workers/      # ARQ async jobs (evidence collection, report generation)
├── frontend/             # Next.js 16 + Tailwind CSS + shadcn/ui
│   └── app/
│       ├── (control-room)/   # Executive dashboard and exports
│       └── (assessor)/       # Assessment workflow, questionnaire, findings
├── charts/compass/       # Helm chart for Kubernetes
└── docker-compose.yml
```

**Data model:**

```
AISystem
  └── Assessment (one system can have multiple assessments across time)
        ├── AssessmentControl (one row per framework control)
        │     └── Evidence (zero or more evidence records per control)
        └── Finding (one per gap identified)
```

The backend API runs on FastAPI. The database is PostgreSQL. Redis is used as the job queue for the ARQ worker that handles async evidence collection and report generation. The frontend is a Next.js 16 application with server components and client interactivity where needed.

---

## Requirements

To run Compass you need:

- Docker and Docker Compose (version 2 or later)
- 1 GB RAM minimum (2 GB recommended for comfortable use)
- Ports 3000 and 8000 available on the host

For Kubernetes deployment you also need Helm 3 and a cluster with an ingress controller (nginx is the default).

---

## Quick start with Docker Compose

This is the recommended way to run Compass for a single organisation or a small team.

**1. Clone the repository**

```bash
git clone https://github.com/bogdanticu88/Compass
cd Compass
```

**2. Configure your environment**

```bash
cp .env.example .env
```

Open `.env` and set the required values:

```bash
# Generate secrets with: openssl rand -hex 32
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
POSTGRES_PASSWORD=choose-a-database-password
```

Everything else in `.env` has sensible defaults for local use.

**3. Start the stack**

```bash
docker compose up -d
```

This starts five services: `db` (PostgreSQL), `redis`, `api` (FastAPI), `worker` (ARQ), and `web` (Next.js). The first start takes a minute or two while Docker pulls images and runs database migrations.

**4. Open the app**

Go to `http://localhost:3000`. The setup wizard will walk you through creating the first admin account.

**Default ports:**

| Service | Port |
|---------|------|
| Web UI | 3000 |
| API | 8000 |
| API docs (Swagger) | 8000/docs |
| PostgreSQL | 5432 |
| Redis | 6379 |

**Stopping:**

```bash
docker compose down        # stop and keep data
docker compose down -v     # stop and delete all data
```

---

## Kubernetes with Helm

Use this for production deployments where you want horizontal scaling, rolling updates, and integration with your cluster ingress and secret management.

**1. Add the Bitnami dependency repo** (used for PostgreSQL and Redis sub-charts)

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

**2. Fetch chart dependencies**

```bash
helm dependency update charts/compass
```

**3. Install**

```bash
helm install compass charts/compass \
  --set secrets.secretKey=$(openssl rand -hex 32) \
  --set secrets.jwtSecret=$(openssl rand -hex 32) \
  --set secrets.postgresPassword=choose-a-password \
  --set ingress.host=compass.yourorg.com
```

**4. Enable TLS**

If your cluster has cert-manager installed:

```bash
helm upgrade compass charts/compass \
  --set ingress.tls=true \
  --set ingress.host=compass.yourorg.com
```

**Key chart values:**

| Value | Default | Description |
|-------|---------|-------------|
| `ingress.host` | `compass.example.com` | Hostname for the ingress rule |
| `ingress.className` | `nginx` | Ingress controller class |
| `ingress.tls` | `false` | Enable TLS via cert-manager |
| `api.replicaCount` | `2` | API pod replicas |
| `web.replicaCount` | `1` | Frontend pod replicas |
| `secrets.secretKey` | (required) | App secret key, min 32 chars |
| `secrets.jwtSecret` | (required) | JWT signing secret, min 32 chars |
| `secrets.postgresPassword` | `compass` | PostgreSQL password |

To use an external PostgreSQL or Redis instance instead of the bundled sub-charts, set `postgresql.enabled=false` or `redis.enabled=false` and provide the connection details via the `DATABASE_URL` and `REDIS_URL` environment variables.

**Uninstall:**

```bash
helm uninstall compass
```

---

## Development setup

If you want to work on the codebase locally without Docker:

**Requirements:** Python 3.12+, Node 20+, pnpm 9+, a running PostgreSQL instance, a running Redis instance.

**Backend:**

```bash
cd backend
pip install uv
uv sync
cp ../.env.example ../.env  # set DATABASE_URL and REDIS_URL to your local instances
uv run uvicorn app.main:app --reload
```

API docs are at `http://localhost:8000/docs`.

**Frontend:**

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:3000`.

**Running tests:**

```bash
# Backend (requires a running test database)
cd backend
uv run pytest tests/ -v --tb=short --cov=app

# E2E (requires the full stack running via Docker Compose)
cd e2e
npm ci
npx playwright install chromium
npm test
```

The `Makefile` at the project root has shortcuts for common tasks:

```bash
make dev      # start the full stack
make test     # run backend tests
make migrate  # run database migrations
make seed     # seed the database with sample data
make down     # stop and remove containers
```

---

## Configuration reference

All configuration is passed through environment variables. The `.env.example` file documents every available option.

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Application secret key, at least 32 characters |
| `JWT_SECRET` | Yes | JWT signing key, at least 32 characters |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `POSTGRES_DB` | No | Database name, default `compass` |
| `POSTGRES_USER` | No | Database user, default `compass` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | JWT lifetime, default `30` |
| `EVIDENCE_STALE_DAYS` | No | Days before evidence is flagged stale, default `30` |

---

## Roadmap

### v1.1

These are gaps in the current release that affect day-to-day usability.

**User management UI** — there is no interface for inviting users, changing roles, or deactivating accounts after the initial setup wizard. Currently this has to be done directly via the API. A user management page in the Control Room is the next thing to ship.

**Connector test and status** — the connector configuration page lets you save credentials but gives no feedback on whether they actually work. Adding a "Test connection" button that fires a dry run against the external tool, and showing a last-collected timestamp on each connector, will make the evidence pipeline much easier to operate.

**Audit trail** — there is no record of who updated evidence, who changed a finding status, or when assessments were submitted. For teams that need to show an auditor that a specific person signed off on specific evidence at a specific time, this is a missing piece. An immutable event log per assessment is planned.

**Overdue notifications** — assessments with a due date that has passed are flagged in the Control Room, but nobody gets notified. Email notifications for overdue assessments and approaching deadlines are on the list.

---

### v1.2

These are larger features that require more design work but are the logical next step for teams running Compass at scale.

**Finding assignment and remediation tracking** — right now findings are created and tracked by status, but there is no way to assign a finding to a specific person or set a target remediation date. Adding ownership, due dates, and a comment thread to findings would make Compass usable as a lightweight remediation tracker rather than just an audit record.

**Multi-tenant workspaces** — the current data model has a single shared namespace. Organisations with multiple business units or subsidiaries that need isolated views of their assessments, findings, and reports will need workspace-level separation with scoped roles.

**Assessment templates** — instead of starting every assessment from scratch, teams should be able to define a template for a given system type (for example, a standard template for all customer-facing recommendation models) and create new assessments from it with pre-filled control guidance and suggested evidence sources.

**Connector scheduling** — evidence collection currently runs on demand when an assessor clicks Re-collect. Scheduled automatic collection on a configurable interval would remove the manual step and keep evidence fresher without anyone having to remember to trigger it.

**SSO and LDAP integration** — for enterprise deployments where account management needs to go through an existing identity provider rather than Compass's own auth.

---

## License

MIT. See [LICENSE](LICENSE).
