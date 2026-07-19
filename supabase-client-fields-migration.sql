-- Add extended client profile fields
alter table public.clients
  add column if not exists industry      text,
  add column if not exists website       text,
  add column if not exists payment_terms text,
  add column if not exists tax_id        text,
  add column if not exists notes         text;

-- phone already exists in the original schema
