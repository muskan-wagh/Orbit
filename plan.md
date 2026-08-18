# AI Job Application OS — Implementation Plan

## 1. Project Overview

**Name:** AI Job Application OS

A web app that automatically turns job-related Gmail activity into a structured application pipeline, reducing manual tracking.

### Core Flow

```
Gmail → detect relevant email → AI extraction → identify/match application
      → update application status → create/update action → dashboard
```

### Principles

- AI extracts and reasons; deterministic backend logic validates and performs database state changes.
- Never blindly let an LLM update an application.
- Server-side operations for secrets and Gmail OAuth tokens. Never expose tokens to the browser.
- RLS for user data isolation.
- Small, testable, documented changes.

## 2. MVP Scope

### Must Have
1. Google authentication
2. Manual application creation
3. Application dashboard
4. Gmail connection using Google OAuth
5. Gmail read-only access
6. Detection of job-related emails
7. AI extraction of company, role, event/status, dates, and other useful info
8. Matching an email event to an existing application
9. Confidence score before automatic updates
10. Automatic application status updates
11. Tasks/action items for interviews, assessments, and follow-ups

### NOT in MVP (no scope creep)
- LinkedIn scraping, multi-platform scraping, auto-apply, browser extension, MCP, job discovery engine, AI interview coach, resume generator, complex autonomous agents.

## 3. Technology Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend     | Next.js API routes / server actions, TypeScript |
| Database    | Supabase PostgreSQL                      |
| Auth        | Google OAuth / Supabase Auth             |
| Email       | Gmail API (scope: `gmail.readonly`)      |
| AI          | OpenAI API — structured JSON outputs     |
| Deployment  | Vercel, Supabase                         |
| Automation  | Built in-house via Gmail API (+ Pub/Sub later). NO n8n. |

## 4. Architecture

```
User → Next.js app → Supabase Auth → Application database

Gmail connection → Gmail API → email candidate filtering → AI classifier
  → AI structured extraction → matching engine → confidence validation
  → application/event update → task/action engine → dashboard
```

### Confidence Policy
- `>= 0.90`: automatic update when deterministic checks also pass
- `0.70 – 0.89`: ask user for confirmation
- `< 0.70`: do not automatically update

## 5. Database Design

All application tables are prefixed with `OS_`.

### OS_Applications
Main application record. Columns: `id`, `user_id`, `company`, `role`, `platform`, `job_url`, `location`, `salary`, `status`, `applied_at`, `notes`, `created_at`, `updated_at`.

Statuses: `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`.

### OS_Email_Events
Stores processed Gmail events; doubles as a deduplication layer. Columns: `id`, `user_id`, `application_id`, `gmail_message_id` (unique), `gmail_thread_id`, `event_type`, `subject`, `sender`, `extracted_data` (JSONB), `confidence`, `received_at`, `created_at`.

### OS_Tasks
Action items from application events. Columns: `id`, `user_id`, `application_id`, `title`, `description`, `due_at`, `priority`, `status`, `created_at`, `updated_at`.

Task statuses: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`.
Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

### OS_Gmail_Connections
Gmail OAuth metadata. Columns: `id`, `user_id` (unique), `google_email`, `access_token`, `refresh_token`, `token_expiry`, `created_at`, `updated_at`.

Security: tokens never returned to the frontend; server-side access only; RLS enforced.

## 6. SQL Migration

File: `supabase/migrations/0001_initial_schema.sql`

Contains the exact schema from the project spec:
- 4 tables with quoted names (`OS_Applications`, `OS_Email_Events`, `OS_Tasks`, `OS_Gmail_Connections`)
- `pgcrypto` extension for `gen_random_uuid()`
- Indexes on user/status/application columns
- RLS enabled on all tables
- Per-user select/insert/update/delete policies keyed on `auth.uid() = user_id`

Run in the Supabase SQL Editor.

## 7. Build Order

### Phase 1 — Foundation ✅ (current task)
- [ ] Scaffold Next.js + TypeScript + Tailwind project
- [ ] Configure shadcn/ui
- [ ] Set up Supabase client structure (`client.ts`, `server.ts`, `middleware.ts`)
- [ ] Add `.env.example`
- [ ] Create `supabase/migrations/0001_initial_schema.sql`
- [ ] Update README with setup steps
- [ ] Verify: `npm run build`, `npm run lint`

### Phase 2 — Authentication
- Google login (Supabase Auth)
- Protected dashboard routes

### Phase 3 — Application CRUD
- Add / view / edit / delete applications
- Change status
- Application details page

### Phase 4 — Gmail OAuth
- Connect Gmail button, Google OAuth flow, request `gmail.readonly`
- Securely store OAuth connection (server-side)
- Server-side Gmail client

### Phase 5 — Email Intelligence
- Retrieve candidate emails
- Cheap deterministic candidate filtering
- AI classifier (job-related or not) + structured extraction
- Store `OS_Email_Events`

### Phase 6 — Matching Engine
- Match company/role/sender/thread/date/context against existing applications
- Confidence calculation
- Auto-update high-confidence matches; ask user for ambiguous matches

### Phase 7 — Action Engine
- Detect assessment deadlines, interview dates, follow-up requirements
- Create `OS_Tasks` with priority calculation

### Phase 8 — Dashboard
- Application pipeline, "action required" section, upcoming interviews/assessments, recent activity, analytics

### Phase 9 — Testing & Reliability
- Duplicate email, ambiguous matching, false-positive, OAuth failure, malformed AI output, RLS/security tests

## 8. First Task (Foundation)

Steps:
1. Inspect existing repository — done (empty; only `README.md` + initial commit).
2. Initialize Next.js + TypeScript + Tailwind project.
3. Set up Supabase client structure.
4. Add environment variable template.
5. Create the Supabase SQL migration using the schema above.
6. No Gmail or AI yet. No unrelated features.
7. Report exactly what was created and what remains.

## 9. Open Items / What Remains After Phase 1

### Requires user action
- Create a Supabase project (https://supabase.com)
- Run the migration in the Supabase SQL Editor
- Fill in `.env.local` from `.env.example`
- Create Google OAuth app credentials (Phase 4)
- Add OpenAI API key (Phase 5)

### Requires later phases
- Auth, CRUD, Gmail integration, AI pipeline, dashboard, testing

## 10. Repository Conventions

- Every project table name starts with `OS_`.
- No new tables without explicit justification + approval.
- Before adding a feature, confirm which MVP requirement it satisfies.
- Secrets and tokens: server-side only, never in the browser.
- Deterministic validation around any AI output.
