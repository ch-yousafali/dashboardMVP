# Business HQ — Full-Stack Dashboard

A production-ready business management dashboard built with Astro + React + TypeScript + Tailwind CSS, PostgreSQL, and Drizzle ORM.

## Stack

- **Frontend**: Astro + React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL + Drizzle ORM + Drizzle Kit
- **Auth**: Session-based with bcrypt password hashing
- **AI**: LLM integration (OpenAI, Anthropic, OpenRouter)
- **Integrations**: Composio for Google Calendar, Drive, Business Profile

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — random string for session signing (min 32 chars)

Optional (for AI/integrations):
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`
- `COMPOSIO_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### 3. Run database migrations

```bash
npm run db:generate   # generate migration from schema
npm run db:migrate    # apply migrations to database
```

### 4. Create demo data (optional)

```bash
npx tsx src/db/setup-demo.ts
```

Creates a demo user:
- Email: `maya@aldenandco.com`
- Password: `password123`

### 5. Start the dev server

```bash
npm run dev
```

Visit `http://localhost:4321`

## Database Scripts

```bash
npm run db:generate   # generate SQL migration from schema changes
npm run db:migrate    # apply migrations
npm run db:push       # push schema directly (dev only, interactive)
npm run db:studio     # open Drizzle Studio
```

## Features

- Dashboard with summary cards, upcoming events, recent activity, quick actions
- Chat with AI (local action handling + LLM fallback)
- Calendar (database-backed CRUD, month grid view)
- Video Ideas, Pre-Orders, Customer Updates
- Sales (bar chart, recent orders)
- Notes (pin, search, CRUD)
- Important Emails (filter, search)
- Bulk Orders, Cost & Profit (breakdown, profit chart)
- Samples, Shipment Tracking (timeline)
- Settings (profile, notifications, integrations, team, security)
- Centralized notifications system
- Team invitations with roles (Owner, Admin, Member)
- Responsive (desktop, tablet, mobile)

## Architecture

```
Browser
  ↓
Astro + React
  ↓
Server/API
  ├── Drizzle → PostgreSQL
  ├── Composio → Google services
  └── LLM → OpenAI / Anthropic / OpenRouter
```

All business data is workspace-scoped. Secrets remain server-side.

## Project Structure

```
src/
├── components/       # UI components (layout, shared, notifications)
├── layouts/          # BaseLayout, DashboardLayout, AuthLayout
├── pages/            # Astro pages + API routes
│   └── api/          # REST API endpoints
├── lib/              # db, auth, llm, composio, permissions, validation
├── db/               # schema, relations, seed
└── styles/           # global.css (design tokens from preview.html)
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- Session tokens signed with HMAC
- All database queries scoped by workspace
- Server-side validation on all API endpoints
- No secrets exposed to client
- Role-based authorization (Owner, Admin, Member)
