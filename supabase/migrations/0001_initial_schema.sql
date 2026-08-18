create extension if not exists "pgcrypto";

create table public."OS_Applications" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  platform text,
  job_url text,
  location text,
  salary text,
  status text not null default 'APPLIED'
    check (status in ('APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN')),
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public."OS_Email_Events" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public."OS_Applications"(id) on delete set null,
  gmail_message_id text unique not null,
  gmail_thread_id text,
  event_type text,
  subject text,
  sender text,
  extracted_data jsonb,
  confidence numeric check (confidence >= 0 and confidence <= 1),
  received_at timestamptz,
  created_at timestamptz not null default now()
);

create table public."OS_Tasks" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public."OS_Applications"(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  priority text not null default 'MEDIUM'
    check (priority in ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status text not null default 'TODO'
    check (status in ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public."OS_Gmail_Connections" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  google_email text not null,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index os_applications_user_id_idx
  on public."OS_Applications"(user_id);

create index os_applications_status_idx
  on public."OS_Applications"(user_id, status);

create index os_email_events_user_id_idx
  on public."OS_Email_Events"(user_id);

create index os_email_events_application_id_idx
  on public."OS_Email_Events"(application_id);

create index os_tasks_user_id_status_idx
  on public."OS_Tasks"(user_id, status);

alter table public."OS_Applications" enable row level security;
alter table public."OS_Email_Events" enable row level security;
alter table public."OS_Tasks" enable row level security;
alter table public."OS_Gmail_Connections" enable row level security;

create policy "Users can manage their applications"
on public."OS_Applications"
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their email events"
on public."OS_Email_Events"
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their tasks"
on public."OS_Tasks"
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage their Gmail connection"
on public."OS_Gmail_Connections"
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
