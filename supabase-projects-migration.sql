-- Projects table migration
-- Run this in your Supabase SQL editor

create table if not exists projects (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  name                  text not null,
  client_id             uuid references clients(id) on delete set null,
  client_name           text,
  status                text not null default 'active'
                          check (status in ('active', 'waiting', 'on-hold', 'completed')),
  description           text,
  start_date            date,
  budget                numeric(12,2),
  linked_invoice_id     uuid references invoices(id) on delete set null,
  linked_invoice_number text,
  linked_proposal_id    uuid references proposals(id) on delete set null,
  linked_proposal_number text,
  reminders             jsonb not null default '[]',
  notes                 jsonb not null default '[]',
  last_activity_at      timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table projects enable row level security;

create policy "Users own their projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
