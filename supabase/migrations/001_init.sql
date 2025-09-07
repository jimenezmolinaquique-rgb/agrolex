
create extension if not exists pgcrypto;
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cif text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Owner','Manager','Tecnico')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create table if not exists public.plans (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  plan text not null check (plan in ('trial','pro_monthly','pro_yearly','canceled')) default 'trial',
  trial_end date,
  status text not null default 'active',
  updated_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  reg_no text, lot text, expiry date, stock text,
  created_at timestamptz not null default now()
);
create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  field text not null, crop text not null,
  product text not null, dose text not null,
  plan_date date not null,
  status text not null check (status in ('Pendiente','Realizado')) default 'Pendiente',
  done_date date, applicator text, notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.docs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null, type text not null, url text not null,
  signature_status text, created_at timestamptz not null default now()
);
create table if not exists public.audit (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null, details jsonb, ts timestamptz not null default now()
);
create index if not exists idx_members_org    on public.members(org_id);
create index if not exists idx_products_org   on public.products(org_id);
create index if not exists idx_treatments_org on public.treatments(org_id);
create index if not exists idx_docs_org       on public.docs(org_id);
create index if not exists idx_audit_org      on public.audit(org_id);
create or replace function public._org_owner_member()
returns trigger language plpgsql as $$
begin
  insert into public.members (org_id, user_id, role)
  values (new.id, new.owner_id, 'Owner')
  on conflict do nothing;
  insert into public.plans (org_id, plan, trial_end)
  values (new.id, 'trial', (now() + interval '30 day')::date)
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists trg_org_owner_member on public.orgs;
create trigger trg_org_owner_member
after insert on public.orgs
for each row execute function public._org_owner_member();
