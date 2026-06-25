-- Project files migration
-- Run this in your Supabase SQL editor

-- 1. Add files column to projects table
alter table public.projects
  add column if not exists files jsonb not null default '[]';

-- 2. Create storage bucket for project files (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  52428800,   -- 50 MB per file
  null        -- allow all types
)
on conflict (id) do nothing;

-- 3. Storage RLS: users can only access their own folder ({user_id}/...)
create policy "Users upload own project files"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users view own project files"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own project files"
  on storage.objects for delete
  using (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
