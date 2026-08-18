# Orbit — AI Job Application OS

Automatically turns job-related Gmail activity into a structured application pipeline. See [`plan.md`](./plan.md) for the full project plan, schema, and build order.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL, Auth, RLS)
- Gmail API (Phase 4) + OpenAI (Phase 5)

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A Supabase account (https://supabase.com)

### 2. Database setup

1. Create a Supabase project.
2. Open **SQL Editor** and run the contents of
   [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql).
   This creates the `OS_*` tables, indexes, RLS, and per-user policies.

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
**Project Settings → API** in Supabase.

### 4. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # production server
npm run lint    # eslint
```

## Conventions

- All application tables are prefixed with `OS_`.
- Secrets and OAuth tokens are server-side only — never sent to the browser.
- RLS isolates every table by `user_id`.
- AI reasons; deterministic server code validates and mutates state.

## Status

Foundation (Phase 1): Next.js scaffold, Supabase clients, session proxy, SQL migration.
Auth (Phase 2) and Application CRUD (Phase 3) are next.
