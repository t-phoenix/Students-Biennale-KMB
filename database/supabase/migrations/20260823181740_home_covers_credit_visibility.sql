-- Per-field show/hide toggles for home hero credit lines.

alter table public.home_covers
  add column if not exists show_artwork_name boolean not null default true,
  add column if not exists show_artist boolean not null default true,
  add column if not exists show_institution boolean not null default true;

comment on column public.home_covers.show_artwork_name is
  'When false, artwork title is hidden on the home hero for this slide.';
comment on column public.home_covers.show_artist is
  'When false, artist name is hidden on the home hero for this slide.';
comment on column public.home_covers.show_institution is
  'When false, institution is hidden on the home hero for this slide.';
