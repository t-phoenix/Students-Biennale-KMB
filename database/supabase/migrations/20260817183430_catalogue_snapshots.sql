-- Denormalized per-edition packs for the public site.
-- Import writes these; the browser fetches once and caches. Not CMS-editable.

create table public.catalogue_snapshots (
  edition_id text primary key references public.editions (id) on delete cascade,
  payload jsonb not null,
  search_index jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

grant select on public.catalogue_snapshots to anon, authenticated;
revoke insert, update, delete on public.catalogue_snapshots from authenticated;
grant all on public.catalogue_snapshots to service_role;

alter table public.catalogue_snapshots enable row level security;

create policy catalogue_snapshots_public_read on public.catalogue_snapshots
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.editions e
      where e.id = catalogue_snapshots.edition_id
        and (e.published = true or (select private.is_cms_admin()))
    )
  );
