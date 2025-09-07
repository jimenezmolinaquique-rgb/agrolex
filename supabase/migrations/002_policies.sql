
alter table public.orgs       enable row level security;
alter table public.members    enable row level security;
alter table public.plans      enable row level security;
alter table public.products   enable row level security;
alter table public.treatments enable row level security;
alter table public.docs       enable row level security;
alter table public.audit      enable row level security;
create or replace function public.is_member(org uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.members m where m.org_id = org and m.user_id = auth.uid());
$$;
drop policy if exists orgs_select on public.orgs;
create policy orgs_select on public.orgs for select using (public.is_member(id) or owner_id = auth.uid());
drop policy if exists orgs_insert on public.orgs;
create policy orgs_insert on public.orgs for insert with check (owner_id = auth.uid());
drop policy if exists orgs_update on public.orgs;
create policy orgs_update on public.orgs for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists members_select on public.members;
create policy members_select on public.members for select using (public.is_member(org_id));
drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert with check (auth.uid() in (select owner_id from public.orgs where id = org_id));
drop policy if exists members_update on public.members;
create policy members_update on public.members for update using (auth.uid() in (select owner_id from public.orgs where id = org_id)) with check (auth.uid() in (select owner_id from public.orgs where id = org_id));
drop policy if exists members_delete on public.members;
create policy members_delete on public.members for delete using (auth.uid() in (select owner_id from public.orgs where id = org_id));
drop policy if exists plans_all on public.plans;
create policy plans_all on public.plans for all using (public.is_member(org_id)) with check (public.is_member(org_id));
drop policy if exists products_all on public.products;
create policy products_all on public.products for all using (public.is_member(org_id)) with check (public.is_member(org_id));
drop policy if exists treatments_all on public.treatments;
create policy treatments_all on public.treatments for all using (public.is_member(org_id)) with check (public.is_member(org_id));
drop policy if exists docs_all on public.docs;
create policy docs_all on public.docs for all using (public.is_member(org_id)) with check (public.is_member(org_id));
drop policy if exists audit_select on public.audit;
create policy audit_select on public.audit for select using (public.is_member(org_id));
drop policy if exists audit_insert on public.audit;
create policy audit_insert on public.audit for insert with check (public.is_member(org_id));
