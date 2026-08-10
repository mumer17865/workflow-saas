# WorkFlow

Multi-tenant project management SaaS built with **Next.js**, **NestJS**, **PostgreSQL**, and **TypeScript**.

A lightweight alternative to Jira/ClickUp/Asana for small teams: an organization signs up, creates projects, invites members, and tracks tasks through a Kanban board and dashboard.

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

> Delivered in phases — see [Development phases](#development-phases). Currently: **Phase 6 — Dashboard & Reports** complete.

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

## Development phases

1. **Foundation** — monorepo, Next.js + NestJS, Docker Postgres, env, health check
2. **Authentication** — register/login/refresh/logout, protected routes
3. **Organizations & RBAC** — members, roles, invitations, guard-enforced permissions
4. **Projects** — CRUD, list, details, org-scoped with role-gated writes
5. **Tasks** — CRUD, assignment, Kanban board (drag & drop), priority + assignee filters
6. **Dashboard & Reports** — stat tiles, Recharts charts, activity feed (audit log) ← _current_
7. Polish — responsive, loading/empty/error states, toasts
8. Deployment — Vercel + Railway + hosted Postgres

## License

Portfolio project — all rights reserved.
