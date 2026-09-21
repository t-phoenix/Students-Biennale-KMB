-- Gate public asset_links reads to published parent entities.
-- Website already only needs programme + press_item links at runtime;
-- catalogue pages use snapshot URLs. CMS admins keep full access.
-- No schema/data/design changes — policy-only.

BEGIN;

drop policy if exists asset_links_public_read on public.asset_links;
create policy asset_links_public_read on public.asset_links
  for select to anon, authenticated
  using (
    (select private.is_cms_admin())
    or (
      entity_type = 'programme'
      and exists (
        select 1 from public.programmes p
        where p.id = asset_links.entity_id and p.published = true
      )
    )
    or (
      entity_type = 'press_item'
      and exists (
        select 1 from public.press_items i
        where i.id = asset_links.entity_id and i.published = true
      )
    )
    or (
      entity_type = 'artwork'
      and exists (
        select 1
        from public.artworks a
        join public.editions e on e.id = a.edition_id
        where a.id = asset_links.entity_id
          and a.published = true
          and e.published = true
      )
    )
    or (
      entity_type = 'project'
      and exists (
        select 1
        from public.projects p
        join public.editions e on e.id = p.edition_id
        where p.id = asset_links.entity_id
          and p.published = true
          and e.published = true
      )
    )
    or (
      entity_type = 'edition'
      and exists (
        select 1 from public.editions e
        where e.id = asset_links.entity_id and e.published = true
      )
    )
    or (
      entity_type = 'venue'
      and exists (
        select 1
        from public.edition_venues ev
        join public.editions e on e.id = ev.edition_id
        where ev.venue_id = asset_links.entity_id and e.published = true
      )
    )
    or (
      entity_type = 'zone'
      and exists (
        select 1
        from public.zones z
        join public.editions e on e.id = z.edition_id
        where z.id = asset_links.entity_id and e.published = true
      )
    )
    or (
      entity_type = 'person'
      and (
        exists (
          select 1
          from public.zone_people zp
          join public.zones z on z.id = zp.zone_id
          join public.editions e on e.id = z.edition_id
          where zp.person_id = asset_links.entity_id and e.published = true
        )
        or exists (
          select 1
          from public.artwork_contributors ac
          join public.artworks a on a.id = ac.artwork_id
          join public.editions e on e.id = a.edition_id
          where ac.person_id = asset_links.entity_id
            and a.published = true
            and e.published = true
        )
        or exists (
          select 1
          from public.programme_facilitators pf
          join public.programmes p on p.id = pf.programme_id
          where pf.person_id = asset_links.entity_id and p.published = true
        )
      )
    )
    or (
      entity_type = 'about_section'
      and exists (
        select 1 from public.about_sections a
        where a.id = asset_links.entity_id and a.published = true
      )
    )
  );

COMMIT;
