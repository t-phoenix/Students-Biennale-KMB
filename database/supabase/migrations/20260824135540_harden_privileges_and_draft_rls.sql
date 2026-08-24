-- Harden privileges and public-read RLS. Additive only: no DROP TABLE/COLUMN,
-- no DELETE/UPDATE of rows. Public SELECT and CMS writes stay.

-- ─── Privileges ───
-- Production currently grants INSERT/UPDATE/DELETE/TRUNCATE to anon.
-- RLS blocks row writes; TRUNCATE is not RLS-gated.

revoke insert, update, delete, truncate on all tables in schema public
  from anon, public;

grant select on all tables in schema public to anon, authenticated;
revoke select on public.import_sources from anon;

revoke truncate on all tables in schema public from authenticated;

-- CMS tables: keep row writes (already granted in earlier migrations; re-assert).
grant insert, update, delete on
  public.home_covers,
  public.update_cards,
  public.award_winners,
  public.award_winner_artists,
  public.programmes,
  public.programme_facilitators,
  public.programme_project_links,
  public.press_items,
  public.about_sections,
  public.assets,
  public.asset_links
to authenticated;

grant all on all tables in schema public to service_role;

-- Future tables: anon gets SELECT only; authenticated gets row writes, not TRUNCATE.
alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon, public;
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  revoke truncate on tables from authenticated;
alter default privileges in schema public
  grant all on tables to service_role;

-- ─── Inactive drafts: public SELECT matches .eq("active", true) on the site ───

drop policy if exists home_covers_public_read on public.home_covers;
create policy home_covers_public_read on public.home_covers
  for select to anon, authenticated
  using (active = true or (select private.is_cms_admin()));

drop policy if exists update_cards_public_read on public.update_cards;
create policy update_cards_public_read on public.update_cards
  for select to anon, authenticated
  using (active = true or (select private.is_cms_admin()));

drop policy if exists award_winners_public_read on public.award_winners;
create policy award_winners_public_read on public.award_winners
  for select to anon, authenticated
  using (active = true or (select private.is_cms_admin()));

drop policy if exists award_winner_artists_public_read on public.award_winner_artists;
create policy award_winner_artists_public_read on public.award_winner_artists
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1
      from public.award_winners w
      where w.id = award_winner_artists.award_winner_id
        and w.active = true
    )
  );

-- ─── Functions ───

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from anon, authenticated, public';
  end if;
end $$;
