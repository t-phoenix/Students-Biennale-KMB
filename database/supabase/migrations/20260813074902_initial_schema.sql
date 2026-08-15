-- Students' Biennale core schema (Figma + TCT sheet model).
-- See content/ARCHITECTURE.md for entity rationale and cardinality.

create extension if not exists pg_trgm;

-- ─── Enums ───

create type public.asset_variant as enum (
  'original',
  'thumbnail',
  'card',
  'hero',
  'gallery'
);

create type public.asset_status as enum (
  'pending',
  'processing',
  'ready',
  'failed'
);

create type public.zone_person_role as enum ('curator', 'assistant');

create type public.programme_subtype as enum (
  'workshop',
  'residency',
  'national-award',
  'international-award'
);

create type public.programme_state as enum ('upcoming', 'past');

create type public.edition_section_key as enum (
  'overview',
  'team',
  'curators',
  'curatorial_note',
  'gallery',
  'downloads',
  'press',
  'resources',
  'custom'
);

create type public.asset_entity_type as enum (
  'artwork',
  'project',
  'person',
  'venue',
  'zone',
  'edition',
  'programme',
  'press_item',
  'about_section'
);

create type public.asset_role as enum (
  'cover',
  'gallery',
  'portrait',
  'map',
  'hero',
  'slider',
  'download',
  'logo'
);

-- ─── Helpers ───

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Editions ───

create table public.editions (
  id text primary key,
  number integer not null unique,
  years text not null unique,
  title text,
  slug text not null unique,
  overview text,
  overall_curatorial_note text,
  is_current boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger editions_set_updated_at
before update on public.editions
for each row execute function public.set_updated_at();

create unique index editions_one_current_idx
  on public.editions (is_current)
  where is_current;

-- ─── Zones ───

create table public.zones (
  id text primary key,
  edition_id text not null references public.editions (id) on delete cascade,
  number integer not null,
  label text,
  region text,
  common_curatorial_note text,
  sort_order integer,
  unique (edition_id, number)
);

create index zones_edition_id_idx on public.zones (edition_id);

-- ─── People / institutions ───

create table public.people (
  id text primary key,
  name text not null,
  slug text not null unique,
  bio text,
  is_collective boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.zone_people (
  zone_id text not null references public.zones (id) on delete cascade,
  person_id text not null references public.people (id) on delete cascade,
  role public.zone_person_role not null,
  individual_curatorial_note text,
  sort_order integer not null default 0,
  primary key (zone_id, person_id, role)
);

create index zone_people_person_id_idx on public.zone_people (person_id);

create table public.institutions (
  id text primary key,
  name text not null,
  slug text not null unique
);

-- ─── Venues ───

create table public.venues (
  id text primary key,
  slug text not null unique,
  name text not null,
  history text,
  map_url text,
  virtual_tour_url text,
  sort_order integer
);

create table public.edition_venues (
  edition_id text not null references public.editions (id) on delete cascade,
  venue_id text not null references public.venues (id) on delete cascade,
  primary key (edition_id, venue_id)
);

-- ─── Projects / artworks ───

create table public.projects (
  id text primary key,
  edition_id text not null references public.editions (id) on delete cascade,
  zone_id text references public.zones (id) on delete set null,
  project_number integer,
  title text not null,
  sort_order integer,
  published boolean not null default true
);

create index projects_edition_id_idx on public.projects (edition_id);
create index projects_zone_id_idx on public.projects (zone_id);

create table public.artworks (
  id text primary key,
  project_id text not null references public.projects (id) on delete cascade,
  edition_id text not null references public.editions (id) on delete cascade,
  zone_id text references public.zones (id) on delete set null,
  venue_id text references public.venues (id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  materials_summary text,
  dimensions_summary text,
  sort_order integer,
  published boolean not null default true,
  unique (edition_id, slug)
);

create index artworks_project_id_idx on public.artworks (project_id);
create index artworks_edition_id_idx on public.artworks (edition_id);
create index artworks_zone_id_idx on public.artworks (zone_id);
create index artworks_venue_id_idx on public.artworks (venue_id);
create index artworks_slug_idx on public.artworks (slug);

create table public.artwork_contributors (
  id text primary key,
  artwork_id text not null references public.artworks (id) on delete cascade,
  person_id text references public.people (id) on delete set null,
  display_name text not null,
  institution_id text references public.institutions (id) on delete set null,
  institution_name text,
  materials text,
  dimensions text,
  sort_order integer not null default 0
);

create index artwork_contributors_artwork_id_idx on public.artwork_contributors (artwork_id);
create index artwork_contributors_person_id_idx on public.artwork_contributors (person_id);

-- ─── Programmes ───

create table public.programmes (
  id text primary key,
  subtype public.programme_subtype not null,
  state public.programme_state not null,
  title text not null,
  slug text not null unique,
  summary text,
  body text,
  dates text,
  place text,
  sort_order integer,
  published boolean not null default true
);

create index programmes_subtype_state_idx on public.programmes (subtype, state);

create table public.programme_facilitators (
  programme_id text not null references public.programmes (id) on delete cascade,
  person_id text references public.people (id) on delete set null,
  display_name text,
  sort_order integer not null default 0
);

create index programme_facilitators_programme_id_idx
  on public.programme_facilitators (programme_id);

create table public.programme_project_links (
  programme_id text not null references public.programmes (id) on delete cascade,
  project_id text not null references public.projects (id) on delete cascade,
  primary key (programme_id, project_id)
);

-- ─── Press / about / sponsors ───

create table public.press_items (
  id text primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  external_url text,
  published_at date,
  sort_order integer,
  published boolean not null default true
);

create table public.about_sections (
  id text primary key,
  heading text not null,
  slug text not null unique,
  body text,
  sort_order integer,
  published boolean not null default true
);

create table public.sponsors (
  id text primary key,
  edition_id text references public.editions (id) on delete cascade,
  name text not null,
  tier text,
  url text,
  sort_order integer
);

-- ─── Archival edition pages ───

create table public.edition_sections (
  id text primary key,
  edition_id text not null references public.editions (id) on delete cascade,
  section_key public.edition_section_key not null,
  title text,
  body text,
  sort_order integer not null default 0,
  unique (edition_id, section_key, sort_order)
);

create index edition_sections_edition_id_idx on public.edition_sections (edition_id);

create table public.edition_section_items (
  id text primary key,
  section_id text not null references public.edition_sections (id) on delete cascade,
  label text,
  url text,
  content_type text,
  sort_order integer not null default 0
);

-- ─── Slugs + provenance ───

create table public.slugs (
  slug text primary key,
  entity_type text not null,
  entity_id text not null,
  edition_id text references public.editions (id) on delete cascade
);

create index slugs_entity_idx on public.slugs (entity_type, entity_id);

create table public.import_sources (
  id bigint generated always as identity primary key,
  entity_type text,
  entity_id text,
  source_type text,
  source_ref text,
  imported_at timestamptz not null default now()
);

-- ─── Assets ───

create table public.assets (
  id text primary key,
  bucket text not null,
  storage_path text not null,
  public_url text,
  parent_asset_id text references public.assets (id) on delete set null,
  variant public.asset_variant not null default 'original',
  mime_type text,
  bytes bigint,
  width integer,
  height integer,
  sha256 text,
  alt_text text,
  sort_order integer not null default 0,
  status public.asset_status not null default 'pending',
  source_url text,
  source_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

create index assets_parent_asset_id_idx on public.assets (parent_asset_id);
create index assets_variant_status_idx on public.assets (variant, status);

create table public.asset_links (
  asset_id text not null references public.assets (id) on delete cascade,
  entity_type public.asset_entity_type not null,
  entity_id text not null,
  role public.asset_role not null,
  primary key (asset_id, entity_type, entity_id, role)
);

create index asset_links_entity_idx on public.asset_links (entity_type, entity_id);

-- ─── Search index ───

create table public.search_entries (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  edition_id text references public.editions (id) on delete cascade,
  title text not null,
  subtitle text,
  route text not null,
  field_title text,
  field_artist text,
  field_curator text,
  field_venue text,
  field_zone text,
  field_institution text,
  field_edition text,
  field_programme text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(field_title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(field_artist, '')), 'A')
    || setweight(to_tsvector('english', coalesce(field_curator, '')), 'A')
    || setweight(to_tsvector('english', coalesce(field_venue, '')), 'B')
    || setweight(to_tsvector('english', coalesce(field_zone, '')), 'B')
    || setweight(to_tsvector('english', coalesce(field_edition, '')), 'B')
    || setweight(to_tsvector('english', coalesce(field_programme, '')), 'B')
    || setweight(to_tsvector('english', coalesce(field_institution, '')), 'C')
  ) stored
);

create index search_entries_vector_idx on public.search_entries using gin (search_vector);
create index search_entries_edition_id_idx on public.search_entries (edition_id);
create index search_entries_title_trgm_idx on public.search_entries using gin (title gin_trgm_ops);
