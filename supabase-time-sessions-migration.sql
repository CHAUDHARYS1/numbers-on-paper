-- Time sessions migration
-- Run this in your Supabase SQL editor

alter table public.projects
  add column if not exists time_sessions jsonb not null default '[]';
