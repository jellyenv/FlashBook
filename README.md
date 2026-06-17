<div align="center">

# ⚡ FlashBook

### Tattoo booking, beautifully done.

*The boutique booking platform for tattoo artists and their clients — a clean calendar, a stunning booking page, flash & merch storefronts, and built-in messaging, all in one place.*

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## ✨ What is FlashBook?

FlashBook is a full-stack web app that gives tattoo artists and studios everything they need to run bookings online. Clients discover an artist's work and book appointments through a beautiful public page, while artists manage their schedule, storefront, and brand from a dedicated studio dashboard.

It's built on a type-safe **Next.js + FastAPI** stack: the OpenAPI schema is the single source of truth, and a fully-typed client is generated automatically so the frontend and backend never drift out of sync.

### Highlights

| | Feature | Description |
|---|---|---|
| 📅 | **Smart calendar** | Day, week & month views with hour-by-hour control. |
| 🎨 | **Flash & merch storefronts** | Showcase available pieces and sell merch with checkout. |
| 🖌️ | **Make it yours** | Custom colors, fonts, and button shapes that persist. |
| 🔐 | **Safe & sound** | Auth, 2FA, email verification, and secure payments (Clerk). |
| 💬 | **Built-in messaging** | Talk to clients without leaving the studio. |
| 🔁 | **End-to-end type safety** | Typed client auto-generated from the OpenAPI schema. |

---

## 🧱 Tech stack

**Frontend** — `nextjs-frontend/`
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Clerk** for authentication (sign-in/up, 2FA, user management)
- **shadcn/ui** + **Radix UI** + **Tailwind CSS** for the design system
- **TanStack Query** for server state, **react-hook-form** + **Zod** for forms/validation
- **openapi-ts** generated, fully-typed API client
- **react-dropzone** for uploads, **sonner** for toasts

**Backend** — `fastapi_backend/`
- **FastAPI** (fully async) + **Pydantic** settings
- **SQLAlchemy** (async) + **Alembic** migrations
- **fastapi-users** (auth foundation), **fastapi-mail**, **fastapi-pagination**
- **PostgreSQL 17** (via `asyncpg`)
- **UV** for dependency management

**Tooling**
- **Docker Compose** for a one-command dev environment
- **MailHog** for catching emails locally
- **pre-commit** hooks for lint/format/validation

---

## 🗺️ App structure

```
src/
├── nextjs-frontend/        # Next.js 16 app (App Router)
│   ├── app/
│   │   ├── page.tsx        # Public marketing landing page
│   │   ├── studio/         # Artist studio dashboard + auth (Clerk)
│   │   ├── book/[slug]/    # Public client booking page
│   │   ├── dashboard/      # Item/data dashboard
│   │   └── api/upload/     # Image upload route
│   └── openapi.json        # Generated API contract (shared)
├── fastapi_backend/        # FastAPI app, models, migrations, tests
├── local-shared-data/      # OpenAPI schema + uploads shared between services
├── docs/                   # MkDocs documentation
├── docker-compose.yml      # backend, frontend, db, db_test, mailhog
└── Makefile                # Common dev commands
```

### Key routes

| Route | Description | Access |
|---|---|---|
| `/` | Marketing landing page | Public |
| `/book/[slug]` | Client-facing booking page for an artist | Public |
| `/studio` | Artist studio dashboard (calendar, shop, settings) | Authenticated |
| `/studio/login`, `/studio/register` | Clerk authentication | Public |
| `/dashboard` | Item/data management | Authenticated |

---

## 🚀 Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose (recommended path), **or**
- [Node.js 20+](https://nodejs.org/) + [pnpm](https://pnpm.io/) and [Python 3.12+](https://www.python.org/) + [UV](https://docs.astral.sh/uv/) for running natively
- A [Clerk](https://clerk.com/) account (free) for authentication keys

### 1. Configure environment variables

Copy the example files and fill in your values:

```bash
cp fastapi_backend/.env.example fastapi_backend/.env
cp nextjs-frontend/.env.example nextjs-frontend/.env.local
```

Then set the **required** values:

**`fastapi_backend/.env`**
- `DATABASE_URL`, `TEST_DATABASE_URL` — Postgres connection strings (defaults work with Docker)
- `ACCESS_SECRET_KEY`, `RESET_PASSWORD_SECRET_KEY`, `VERIFICATION_SECRET_KEY` — generate strong random secrets
- Mail + `FRONTEND_URL` + `CORS_ORIGINS` — defaults are fine for local dev

**`nextjs-frontend/.env.local`**
- `API_BASE_URL` — e.g. `http://localhost:8000`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` — from your [Clerk dashboard](https://dashboard.clerk.com/)

> ⚠️ **Never commit secrets.** `.env` and `.env.local` are git-ignored by design.

### 2a. Run with Docker (recommended)

```bash
make docker-build          # build all services
make docker-migrate-db     # apply database migrations
make docker-start-backend  # API at http://localhost:8000
make docker-start-frontend # App at http://localhost:3000
```

### 2b. Run natively

```bash
# Backend (FastAPI) — http://localhost:8000
make start-backend

# Frontend (Next.js) — http://localhost:3000
make start-frontend
```

### 3. Open the app

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| MailHog (email inbox) | http://localhost:8025 |

---

## 🛠️ Common commands

Run `make help` to list everything. Highlights:

| Command | What it does |
|---|---|
| `make start-backend` / `make start-frontend` | Start a service with hot reload |
| `make test-backend` / `make test-frontend` | Run the test suites |
| `make docker-build` | Build all Docker services |
| `make docker-migrate-db` | Apply Alembic migrations |
| `make docker-db-schema migration_name="..."` | Generate a new migration |
| `make docker-up-mailhog` | Start the local email inbox |

### Type-safe API client

The frontend client is generated from the backend's OpenAPI schema. After changing backend routes, regenerate it:

```bash
cd nextjs-frontend && pnpm run generate-client
```

---

## 🧪 Testing

```bash
make test-backend    # pytest (FastAPI)
make test-frontend   # pnpm test (Next.js)
```

A separate test database (`db_test`, port `5433`) is provided so tests never touch your dev data.

---

## 🚢 Deployment

Both apps are deployable to **Vercel**. See `prod-backend-deploy.yml` and `prod-frontend-deploy.yml` for reference configurations, and remember to:

- Set production environment variables (database, Clerk keys, secrets) in your hosting provider
- Restrict `CORS_ORIGINS` to your real domain(s) instead of `["*"]`
- Point `API_BASE_URL` / `FRONTEND_URL` at your production URLs

---

## 🤝 Contributing

1. Install the pre-commit hooks: `pre-commit install`
2. Create a feature branch, make your changes, and ensure tests pass
3. Open a pull request

---

## 📄 License

Released under the [MIT License](./LICENSE.txt).

---

<div align="center">

Built on the excellent [Next.js FastAPI Template](https://github.com/vintasoftware/nextjs-fastapi-template) by Vinta Software.

</div>
