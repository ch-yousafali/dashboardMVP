# Business HQ --- Full-Stack Rebuild Instructions

## Goal

Convert the existing Business HQ HTML dashboard into a production-ready
full-stack web application.

**The existing HTML/CSS is the visual source of truth. DO NOT CHANGE THE
EXISTING STYLING OR DESIGN.**

Preserve colors, typography, spacing, sidebar, header, navigation,
cards, forms, modals, dropdowns, notifications, calendar UI, responsive
behavior, and overall visual hierarchy.

## Stack

-   Astro + React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui only when useful, customized to match Business HQ
-   PostgreSQL
-   Drizzle ORM + Drizzle Kit (**not Prisma**)
-   Secure authentication
-   `llmlite` for OpenAI, Anthropic and OpenRouter
-   Composio for Google Calendar, Google Drive and Google Business
    Profile

## Reference

Inspect the existing Business HQ HTML/CSS/JS and mobile/reference files
before changing anything. The existing implementation is the visual and
interaction source of truth.

Keep: - Dashboard - Calendar - Video Ideas - Pre-Orders - Customer
Updates - Sales - Notes - Important Emails - Bulk Orders - Cost &
Potential Profit - Samples - Tracking - Settings

Do not include social-media content scheduling/approval.

## Architecture

``` text
Browser
  ↓
Astro + React
  ↓
Server/API
  ├── Drizzle → PostgreSQL
  ├── Composio → Google services
  └── llmlite → OpenAI / Anthropic / OpenRouter
```

Secrets must remain server-side.

## Structure

``` text
src/
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── calendar/
│   ├── video-ideas/
│   ├── pre-orders/
│   ├── customer-updates/
│   ├── sales/
│   ├── notes/
│   ├── emails/
│   ├── bulk-orders/
│   ├── cost-profit/
│   ├── samples/
│   ├── tracking/
│   ├── notifications/
│   ├── search/
│   └── shared/
├── layouts/
├── pages/
│   ├── index.astro
│   ├── login.astro
│   ├── signup.astro
│   ├── forgot-password.astro
│   ├── reset-password.astro
│   ├── verify-email.astro
│   ├── invitation.astro
│   └── settings/
│       ├── index.astro
│       ├── profile.astro
│       ├── security.astro
│       ├── team.astro
│       └── integrations.astro
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── llm.ts
│   ├── composio.ts
│   ├── permissions.ts
│   └── validation.ts
└── db/
    ├── schema.ts
    └── relations.ts
drizzle/
├── migrations/
└── meta/
drizzle.config.ts
.env.example
README.md
```

## Reusable UI

Create reusable Business HQ components for buttons, inputs, textareas,
selects, modals, tables, badges, toasts, calendar forms, search,
notifications, loading/error/empty states.

If shadcn is used, customize it to match the existing UI. Do not
redesign.

## Authentication

Implement sign up, sign in, email verification, forgot/reset password,
change password, logout/session handling, profile, security settings and
protected routes.

Do not add Google/Facebook/Apple login buttons unless explicitly
requested.

## Team

Implement invitations, invitation acceptance, workspace membership and
roles: Owner, Admin, Member. Authorization must be server-side.

## PostgreSQL + Drizzle

Create: - `src/db/schema.ts` - `src/db/relations.ts` -
`drizzle.config.ts` - SQL migrations - migration metadata - database
scripts

Scripts:

``` text
npm run db:generate
npm run db:migrate
npm run db:studio
```

Use `DATABASE_URL`. Never hardcode the supplied production connection
string.

Schema must support users, profiles, workspaces, members, invitations,
calendar events, video ideas, pre-orders, customer updates, sales,
notes, important emails, bulk orders, cost/profit, samples,
shipments/tracking, notifications and integration connections.

All business data must be workspace/user scoped.

## Calendar

Make calendar CRUD database-backed. After creation, persist the event,
update the UI immediately, show it in calendar/list/dashboard and create
appropriate activity/notification records. Do not wait for unrelated
integrations.

## Notifications

Create a centralized notification system for every feature. Clicking a
notification must navigate to its source feature.

Example routes:

``` text
Calendar → /calendar
Video Ideas → /video-ideas
Pre-Orders → /pre-orders
Customer Updates → /customer-updates
Sales → /sales
Notes → /notes
Important Emails → /important-emails
Bulk Orders → /bulk-orders
Cost/Profit → /cost-profit
Samples → /samples
Tracking → /tracking
```

The notification bell must actually open, show unread state, mark
notifications read and navigate correctly.

## Search

Keep the existing Business HQ search appearance. Make it reusable,
responsive and initially database-backed.

## Dropdowns

Audit all native `<select>` and dropdown implementations. Use one
reusable Business HQ Select component where appropriate.

Match existing font, borders, radius, background, spacing, shadows,
focus, hover and selected states. Dropdowns must work with mouse,
keyboard, touch, inside modals, and on mobile, with correct
z-index/overflow.

## Integrations

Settings → Integrations: - Google Calendar - Google Drive - Google
Business Profile - OpenAI - Anthropic - OpenRouter

Use a server-side `src/lib/composio.ts` for Google integrations and
`src/lib/llm.ts` for LLMs.

Never fake connections. Use states: - Not Connected - Connecting -
Connected - Reconnect - Disconnect - Configuration Required

## Environment

``` env
DATABASE_URL=
AUTH_SECRET=
APP_URL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
COMPOSIO_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

Only keep variables actually required. Never commit `.env` or real
secrets.

## Responsive

Use the existing mobile/reference HTML as the responsive source of
truth. Verify desktop, tablet and mobile, including sidebar, header,
search, notifications, modals, forms, tables, dropdowns, calendar and
settings.

## Performance

Avoid artificial delays. For local actions such as event creation:
validate → save → return → update UI → sync external services separately
when appropriate.

## Security

Validate server-side. Scope database queries by workspace. Do not expose
stack traces or secrets. Encrypt tokens if the application stores them;
otherwise use Composio connected-account references.

## QA

Before completion: - Compare every page with the original HTML. - Verify
styling has not changed. - Test auth. - Test calendar
CRUD/persistence. - Test notifications/navigation. - Test search. - Test
every dropdown. - Test mobile navigation. - Test
settings/integrations. - Test migrations. - Check for secrets. - Check
that integrations are not falsely reported as connected.

## Priority

1.  Preserve UI exactly.
2.  Astro conversion.
3.  React/TypeScript reusable components.
4.  PostgreSQL + Drizzle.
5.  Schema + migrations.
6.  Auth/workspaces/invitations.
7.  Database-backed calendar.
8.  Notifications/search/dropdowns.
9.  Settings integrations.
10. Composio.
11. llmlite.
12. Responsive/security/production QA.

**Refactor and productionize the existing Business HQ application; do
not redesign it.**
