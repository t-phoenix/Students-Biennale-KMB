-- 1) Remove only the live 2025-26 org-team content from the database.
--    Frontend TEAM_COLS is now authoritative for that grid.
--    Past-edition section_key='team' rows are archival curator/credit text — keep them.
-- 2) Tighten public SELECT on supporting tables so draft/unpublished edition
--    children are not anonymously readable. CMS admins keep full access.

BEGIN;

-- ─── Safety: only touch the current-edition org team ───

delete from public.edition_section_items
where section_id = 'edition-2025-26-team';

delete from public.edition_sections
where id = 'edition-2025-26-team'
  and edition_id = 'edition-2025-26'
  and section_key = 'team';

-- Strip the team section from the published snapshot pack only.
-- Leave every other payload key (edition, zones, artworks, venues, curatorial_note, …) intact.
update public.catalogue_snapshots
set
  payload = jsonb_set(
    payload,
    '{sections}',
    coalesce(
      (
        select jsonb_agg(elem)
        from jsonb_array_elements(coalesce(payload->'sections', '[]'::jsonb)) elem
        where coalesce(elem->>'section_key', '') <> 'team'
      ),
      '[]'::jsonb
    ),
    true
  ),
  generated_at = now()
where edition_id = 'edition-2025-26';

-- ─── Draft-content RLS: require published parent (or CMS admin) ───

drop policy if exists zones_public_read on public.zones;
create policy zones_public_read on public.zones
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1 from public.editions e
      where e.id = zones.edition_id and e.published = true
    )
  );

drop policy if exists zone_people_public_read on public.zone_people;
create policy zone_people_public_read on public.zone_people
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1
      from public.zones z
      join public.editions e on e.id = z.edition_id
      where z.id = zone_people.zone_id and e.published = true
    )
  );

drop policy if exists edition_venues_public_read on public.edition_venues;
create policy edition_venues_public_read on public.edition_venues
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1 from public.editions e
      where e.id = edition_venues.edition_id and e.published = true
    )
  );

drop policy if exists edition_sections_public_read on public.edition_sections;
create policy edition_sections_public_read on public.edition_sections
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1 from public.editions e
      where e.id = edition_sections.edition_id and e.published = true
    )
  );

drop policy if exists edition_section_items_public_read on public.edition_section_items;
create policy edition_section_items_public_read on public.edition_section_items
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1
      from public.edition_sections s
      join public.editions e on e.id = s.edition_id
      where s.id = edition_section_items.section_id and e.published = true
    )
  );

drop policy if exists sponsors_public_read on public.sponsors;
create policy sponsors_public_read on public.sponsors
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or sponsors.edition_id is null
    or exists (
      select 1 from public.editions e
      where e.id = sponsors.edition_id and e.published = true
    )
  );

drop policy if exists search_entries_public_read on public.search_entries;
create policy search_entries_public_read on public.search_entries
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or search_entries.edition_id is null
    or exists (
      select 1 from public.editions e
      where e.id = search_entries.edition_id and e.published = true
    )
  );

drop policy if exists slugs_public_read on public.slugs;
create policy slugs_public_read on public.slugs
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or slugs.edition_id is null
    or exists (
      select 1 from public.editions e
      where e.id = slugs.edition_id and e.published = true
    )
  );

drop policy if exists artwork_contributors_public_read on public.artwork_contributors;
create policy artwork_contributors_public_read on public.artwork_contributors
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1
      from public.artworks a
      join public.editions e on e.id = a.edition_id
      where a.id = artwork_contributors.artwork_id
        and a.published = true
        and e.published = true
    )
  );

drop policy if exists programme_facilitators_public_read on public.programme_facilitators;
create policy programme_facilitators_public_read on public.programme_facilitators
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1 from public.programmes p
      where p.id = programme_facilitators.programme_id and p.published = true
    )
  );

drop policy if exists programme_project_links_public_read on public.programme_project_links;
create policy programme_project_links_public_read on public.programme_project_links
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1 from public.programmes p
      where p.id = programme_project_links.programme_id and p.published = true
    )
  );

-- Shared lookup tables: only rows reachable from published content (or CMS).
drop policy if exists people_public_read on public.people;
create policy people_public_read on public.people
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1
      from public.zone_people zp
      join public.zones z on z.id = zp.zone_id
      join public.editions e on e.id = z.edition_id
      where zp.person_id = people.id and e.published = true
    )
    or exists (
      select 1
      from public.artwork_contributors ac
      join public.artworks a on a.id = ac.artwork_id
      join public.editions e on e.id = a.edition_id
      where ac.person_id = people.id
        and a.published = true
        and e.published = true
    )
    or exists (
      select 1
      from public.programme_facilitators pf
      join public.programmes p on p.id = pf.programme_id
      where pf.person_id = people.id and p.published = true
    )
  );

drop policy if exists venues_public_read on public.venues;
create policy venues_public_read on public.venues
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or exists (
      select 1
      from public.edition_venues ev
      join public.editions e on e.id = ev.edition_id
      where ev.venue_id = venues.id and e.published = true
    )
    or exists (
      select 1
      from public.artworks a
      join public.editions e on e.id = a.edition_id
      where a.venue_id = venues.id
        and a.published = true
        and e.published = true
    )
  );

-- institutions are referenced from catalogue packs; keep published-edition reachability
-- via artworks that name them is not a direct FK. Leave institutions publicly readable
-- (no draft-edition secret content on the row itself) — names/slugs only.
-- asset_links stay open for published-entity assets; originals remain private via assets RLS.

COMMIT;
