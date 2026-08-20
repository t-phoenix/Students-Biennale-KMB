-- Catalogue tables are filled by the import job (service_role) and are not
-- CMS-editable. Programmes, press, about, and asset attachments stay writable
-- for authenticated users whose JWT app_metadata.role is cms|admin.

revoke insert, update, delete on
  public.editions,
  public.zones,
  public.people,
  public.zone_people,
  public.institutions,
  public.venues,
  public.edition_venues,
  public.projects,
  public.artworks,
  public.artwork_contributors,
  public.sponsors,
  public.edition_sections,
  public.edition_section_items,
  public.slugs,
  public.search_entries,
  public.import_sources
from authenticated;

drop policy if exists editions_cms_write on public.editions;
drop policy if exists zones_cms_write on public.zones;
drop policy if exists people_cms_write on public.people;
drop policy if exists zone_people_cms_write on public.zone_people;
drop policy if exists institutions_cms_write on public.institutions;
drop policy if exists venues_cms_write on public.venues;
drop policy if exists edition_venues_cms_write on public.edition_venues;
drop policy if exists projects_cms_write on public.projects;
drop policy if exists artworks_cms_write on public.artworks;
drop policy if exists artwork_contributors_cms_write on public.artwork_contributors;
drop policy if exists sponsors_cms_write on public.sponsors;
drop policy if exists edition_sections_cms_write on public.edition_sections;
drop policy if exists edition_section_items_cms_write on public.edition_section_items;
drop policy if exists slugs_cms_write on public.slugs;
drop policy if exists search_entries_cms_write on public.search_entries;
drop policy if exists import_sources_cms_all on public.import_sources;

-- Import audit remains readable to CMS, writable only via service_role.
grant select on public.import_sources to authenticated;

create policy import_sources_cms_read on public.import_sources
  for select to authenticated
  using ((select private.is_cms_admin()));
