-- ─── Numbers on Paper Database Schema ────────────────────────────────────
-- Run this in your Supabase SQL editor to set up the database.
-- Enable Row Level Security on all tables.

-- ─── Profiles ─────────────────────────────────────────────────────
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  full_name       text,
  business_name   text,
  tagline         text,
  address_line1   text,
  address_line2   text,
  city            text,
  state           text,
  zip             text,
  phone           text,
  email           text,
  logo_url        text,
  default_rate    numeric(10,2) default 50.00,
  -- Template settings (toggleable per user)
  show_tax        boolean default false,
  show_discount   boolean default false,
  show_notes      boolean default true,
  tax_rate        numeric(5,2) default 0.00,
  payment_terms   text default 'Net 30',
  notes_default   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    trim(concat(
      coalesce(new.raw_user_meta_data->>'first_name', ''),
      ' ',
      coalesce(new.raw_user_meta_data->>'last_name', '')
    ))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Clients ──────────────────────────────────────────────────────
create table public.clients (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  organization  text,
  email         text,
  phone         text,
  address_line1 text,
  address_line2 text,
  city          text,
  state         text,
  zip           text,
  contact_name  text,
  contact_title text,
  contact_email text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Users manage own clients"
  on public.clients for all using (auth.uid() = user_id);

-- ─── Invoices ─────────────────────────────────────────────────────
create table public.invoices (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  client_id       uuid references public.clients(id) on delete set null,
  invoice_number  text not null,
  status          text default 'draft' check (status in ('draft','unpaid','paid','overdue')),
  issue_date      date default current_date,
  due_date        date,
  -- Snapshot of billing info at time of invoice
  bill_from       jsonb,   -- { name, business, address, phone, email }
  bill_to         jsonb,   -- { name, organization, address }
  -- Line items
  line_items      jsonb default '[]'::jsonb,
  -- { id, item, description, date, hours, rate, amount, type: 'hourly'|'fixed' }
  -- Totals
  subtotal        numeric(10,2) default 0,
  discount_type   text default 'fixed' check (discount_type in ('fixed','percent')),
  discount_value  numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  tax_rate        numeric(5,2) default 0,
  tax_amount      numeric(10,2) default 0,
  total           numeric(10,2) default 0,
  -- Optional fields
  notes           text,
  terms           text,
  -- Settings snapshot
  show_tax        boolean default false,
  show_discount   boolean default false,
  show_notes      boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.invoices enable row level security;

create policy "Users manage own invoices"
  on public.invoices for all using (auth.uid() = user_id);

-- Auto-increment invoice number per user
create or replace function public.next_invoice_number(p_user_id uuid)
returns text as $$
declare
  next_num integer;
begin
  select coalesce(max(
    cast(regexp_replace(invoice_number, '[^0-9]', '', 'g') as integer)
  ), 0) + 1
  into next_num
  from public.invoices
  where user_id = p_user_id;

  return 'INV-' || lpad(next_num::text, 6, '0');
end;
$$ language plpgsql security definer;

-- ─── Updated_at trigger ────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create trigger set_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();
