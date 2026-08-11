# WorkFlow

Multi-tenant project management SaaS built with **Next.js**, **NestJS**, **PostgreSQL**, and **TypeScript**.

A lightweight alternative to Jira/ClickUp/Asana for small teams: an organization signs up, creates projects, invites members, and tracks tasks through a Kanban board and dashboard.

**Live demo:** [workflow-saas.vercel.app](https://workflow-saas.vercel.app) · API: [api-production-2826.up.railway.app/api/health](https://api-production-2826.up.railway.app/api/health)

## Features

- ✓ Authentication (access + refresh tokens)
- ✓ Role-based authorization (Admin / Manager / Member)
- ✓ Multi-tenancy (organization-scoped data)
- ✓ Project management
- ✓ Task management (Kanban, filters, priorities)
- ✓ Team management & invitations
- ✓ Dashboard analytics
- ✓ Activity tracking
- ✓ Responsive UI

> Delivered in phases — see [Development phases](#development-phases). **All 8 phases complete — live in production.**

## Tech Stack

**Frontend:** Next.js 15 · TypeScript · Tailwind CSS · React Query
**Backend:** NestJS · Prisma · PostgreSQL · JWT · Argon2
**Infrastructure:** pnpm workspaces · Docker · GitHub

## Repository structure

```
workflow/
├── apps/
│   ├── web/        # Next.js frontend (port 3000)
│   └── api/        # NestJS backend  (port 4000, prefix /api)
├── packages/
│   └── shared/     # Zod schemas + shared types (contract between web & api)
├── docker-compose.yml   # PostgreSQL 16
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js ≥ 20 (22 recommended)
- pnpm 9 (`npm install -g pnpm`)
- Docker Desktop (for local PostgreSQL) — or any reachable PostgreSQL instance

## Getting started

```bash
# 1. Install dependencies (workspace root)
pnpm install

# 2. Configure environment
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Start PostgreSQL
pnpm db:up            # docker compose up -d

# 4. Generate the Prisma client
pnpm --filter @workflow/api prisma:generate

# 5. Run both apps
pnpm dev              # web on :3000, api on :4000
```

Health check: <http://localhost:4000/api/health>

## Deployment

Live: web at [workflow-saas.vercel.app](https://workflow-saas.vercel.app) (Vercel),
API + PostgreSQL on Railway. The repo ships a
`railway.json` that builds the API, runs `prisma migrate deploy`, and
health-checks `/api/health`. To reproduce the setup from scratch:

### 1. API + database (Railway)

1. Create a Railway project → **Deploy from GitHub repo** (this repo).
   `railway.json` at the repo root supplies build/start commands.
2. Add a **PostgreSQL** service to the project.
3. On the API service, set the environment variables:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` (required — enables secure cookies, trust proxy, JWT boot check) |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference) |
   | `JWT_ACCESS_SECRET` | long random string — API refuses to boot without it |
   | `JWT_ACCESS_TTL` | `15m` |
   | `JWT_REFRESH_TTL` | `7d` |
   | `CORS_ORIGIN` | your Vercel URL, e.g. `https://workflow-saas.vercel.app` |

4. Generate a public domain for the API service (Settings → Networking).

### 2. Web (Vercel)

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `apps/web` (Vercel auto-detects the pnpm workspace).
3. Set the environment variable:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-railway-domain>/api` |

4. Deploy, then make sure `CORS_ORIGIN` on Railway matches the final Vercel URL.

> **Cross-site cookies:** the refresh cookie is issued `SameSite=None; Secure`
> in production because Vercel and Railway are different sites. Browsers that
> block third-party cookies entirely may require a custom domain with the web
> and API on sibling subdomains (`app.example.com` / `api.example.com`).

### CI/CD — one-click / one-command deploys

**One click (GitHub Actions):** `.github/workflows/deploy.yml` builds both apps,
then deploys the API to Railway and the web to Vercel — in parallel — on every
push to `main`, or manually via **Actions → Deploy → Run workflow**.

Required GitHub repo secrets (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|---|---|
| `RAILWAY_TOKEN` | Railway → your project → Settings → Tokens (a **project** token) |
| `RAILWAY_SERVICE` | API service name in Railway (optional — defaults to `api`) |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after running `vercel link` in `apps/web` |
| `VERCEL_PROJECT_ID` | same file |

**One command (local):** after a one-time `railway link` (repo root) and
`vercel link` (in `apps/web`):

```bash
pnpm deploy         # deploys API (Railway) then web (Vercel)
pnpm deploy:api     # API only
pnpm deploy:web     # web only
```

## Development phases

1. **Foundation** — monorepo, Next.js + NestJS, Docker Postgres, env, health check
2. **Authentication** — register/login/refresh/logout, protected routes
3. **Organizations & RBAC** — members, roles, invitations, guard-enforced permissions
4. **Projects** — CRUD, list, details, org-scoped with role-gated writes
5. **Tasks** — CRUD, assignment, Kanban board (drag & drop), priority + assignee filters
6. **Dashboard & Reports** — stat tiles, Recharts charts, activity feed (audit log)
7. **Polish** — toasts (sonner), loading skeletons, empty/error states, responsive Kanban
8. **Deployment** — Vercel (web) + Railway (API + Postgres), migrate-on-deploy, health checks, CI/CD pipeline

## License

Portfolio project — all rights reserved.
