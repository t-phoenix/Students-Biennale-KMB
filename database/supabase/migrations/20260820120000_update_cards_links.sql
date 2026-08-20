-- Update cards: optional internal/external hyperlink (image_url retained but unused in CMS).

alter table public.update_cards
  add column if not exists link_url text check (char_length(link_url) <= 500),
  add column if not exists link_external boolean not null default false;
