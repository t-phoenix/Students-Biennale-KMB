-- Access model:
--   anon            → public site reads (published rows / web-safe assets)
--   authenticated   → same reads; writes only if JWT app_metadata.role is cms|admin
--   service_role    → import jobs (bypasses RLS)
-- Never put service_role in the browser. CMS uses Auth + app_metadata.

create schema if not exists private;

create or replace function private.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') in ('cms', 'admin'),
    false
  );
$$;

revoke all on function private.is_cms_admin() from public;
grant execute on function private.is_cms_admin() to anon, authenticated;

-- ─── Grants (cloud default: tables are not auto-exposed) ───

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema private to anon, authenticated, service_role;

-- Postgres has no GRANT … ON ALL TYPES; name each enum explicitly.
grant usage on type
  public.asset_variant,
  public.asset_status,
  public.zone_person_role,
  public.programme_subtype,
  public.programme_state,
  public.edition_section_key,
  public.asset_entity_type,
  public.asset_role
to anon, authenticated, service_role;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage on types to anon, authenticated, service_role;

revoke all on function public.set_updated_at() from public;

-- ─── Enable RLS ───

alter table public.editions enable row level security;
alter table public.zones enable row level security;
alter table public.people enable row level security;
alter table public.zone_people enable row level security;
alter table public.institutions enable row level security;
alter table public.venues enable row level security;
alter table public.edition_venues enable row level security;
alter table public.projects enable row level security;
alter table public.artworks enable row level security;
alter table public.artwork_contributors enable row level security;
alter table public.programmes enable row level security;
alter table public.programme_facilitators enable row level security;
alter table public.programme_project_links enable row level security;
alter table public.press_items enable row level security;
alter table public.about_sections enable row level security;
alter table public.sponsors enable row level security;
alter table public.edition_sections enable row level security;
alter table public.edition_section_items enable row level security;
alter table public.slugs enable row level security;
alter table public.import_sources enable row level security;
alter table public.assets enable row level security;
alter table public.asset_links enable row level security;
alter table public.search_entries enable row level security;

-- ─── Published-content reads ───

create policy editions_public_read on public.editions
  for select to anon, authenticated
  using (published = true or (select private.is_cms_admin()));

create policy projects_public_read on public.projects
  for select to anon, authenticated
  using (published = true or (select private.is_cms_admin()));

create policy artworks_public_read on public.artworks
  for select to anon, authenticated
  using (published = true or (select private.is_cms_admin()));

create policy programmes_public_read on public.programmes
  for select to anon, authenticated
  using (published = true or (select private.is_cms_admin()));

create policy press_items_public_read on public.press_items
  for select to anon, authenticated
  using (published = true or (select private.is_cms_admin()));

create policy about_sections_public_read on public.about_sections
  for select to anon, authenticated
  using (published = true or (select private.is_cms_admin()));

-- Supporting tables: no secrets; public read. CMS still gates writes.
create policy zones_public_read on public.zones
  for select to anon, authenticated using (true);
create policy people_public_read on public.people
  for select to anon, authenticated using (true);
create policy zone_people_public_read on public.zone_people
  for select to anon, authenticated using (true);
create policy institutions_public_read on public.institutions
  for select to anon, authenticated using (true);
create policy venues_public_read on public.venues
  for select to anon, authenticated using (true);
create policy edition_venues_public_read on public.edition_venues
  for select to anon, authenticated using (true);
create policy artwork_contributors_public_read on public.artwork_contributors
  for select to anon, authenticated using (true);
create policy programme_facilitators_public_read on public.programme_facilitators
  for select to anon, authenticated using (true);
create policy programme_project_links_public_read on public.programme_project_links
  for select to anon, authenticated using (true);
create policy sponsors_public_read on public.sponsors
  for select to anon, authenticated using (true);
create policy edition_sections_public_read on public.edition_sections
  for select to anon, authenticated using (true);
create policy edition_section_items_public_read on public.edition_section_items
  for select to anon, authenticated using (true);
create policy slugs_public_read on public.slugs
  for select to anon, authenticated using (true);
create policy search_entries_public_read on public.search_entries
  for select to anon, authenticated using (true);

-- Web-safe derivatives only. Originals stay private (Storage + this filter).
create policy assets_public_read on public.assets
  for select to anon, authenticated
  using (
    (variant <> 'original' and status = 'ready')
    or (select private.is_cms_admin())
  );

create policy asset_links_public_read on public.asset_links
  for select to anon, authenticated using (true);

revoke select on public.import_sources from anon;

-- Import audit is CMS-only.
create policy import_sources_cms_all on public.import_sources
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

-- ─── CMS writes (authenticated + app_metadata.role) ───

create policy editions_cms_write on public.editions
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy zones_cms_write on public.zones
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy people_cms_write on public.people
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy zone_people_cms_write on public.zone_people
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy institutions_cms_write on public.institutions
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy venues_cms_write on public.venues
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy edition_venues_cms_write on public.edition_venues
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy projects_cms_write on public.projects
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy artworks_cms_write on public.artworks
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy artwork_contributors_cms_write on public.artwork_contributors
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy programmes_cms_write on public.programmes
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy programme_facilitators_cms_write on public.programme_facilitators
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy programme_project_links_cms_write on public.programme_project_links
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy press_items_cms_write on public.press_items
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy about_sections_cms_write on public.about_sections
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy sponsors_cms_write on public.sponsors
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy edition_sections_cms_write on public.edition_sections
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy edition_section_items_cms_write on public.edition_section_items
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy slugs_cms_write on public.slugs
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy assets_cms_write on public.assets
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy asset_links_cms_write on public.asset_links
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy search_entries_cms_write on public.search_entries
  for all to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));
