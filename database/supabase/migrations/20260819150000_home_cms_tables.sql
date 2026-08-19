-- Home page CMS tables: hero covers and update cards

create table public.home_covers (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  heading text check (char_length(heading) <= 50),
  body text check (char_length(body) <= 100),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger home_covers_set_updated_at
  before update on public.home_covers
  for each row execute function public.set_updated_at();

create table public.update_cards (
  id uuid primary key default gen_random_uuid(),
  slot int not null check (slot between 1 and 3),
  heading text not null check (char_length(heading) <= 60),
  body text not null check (char_length(body) <= 140),
  image_url text,
  card_type text not null default 'general',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slot)
);

create trigger update_cards_set_updated_at
  before update on public.update_cards
  for each row execute function public.set_updated_at();

-- RLS
alter table public.home_covers enable row level security;
alter table public.update_cards enable row level security;

create policy home_covers_public_read on public.home_covers
  for select to anon, authenticated using (true);

create policy home_covers_cms_insert on public.home_covers
  for insert to authenticated with check ((select private.is_cms_admin()));

create policy home_covers_cms_update on public.home_covers
  for update to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy home_covers_cms_delete on public.home_covers
  for delete to authenticated using ((select private.is_cms_admin()));

create policy update_cards_public_read on public.update_cards
  for select to anon, authenticated using (true);

create policy update_cards_cms_insert on public.update_cards
  for insert to authenticated with check ((select private.is_cms_admin()));

create policy update_cards_cms_update on public.update_cards
  for update to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy update_cards_cms_delete on public.update_cards
  for delete to authenticated using ((select private.is_cms_admin()));

-- Grants (default privileges should cover this, but be explicit)
grant select on public.home_covers to anon, authenticated;
grant insert, update, delete on public.home_covers to authenticated;
grant all on public.home_covers to service_role;

grant select on public.update_cards to anon, authenticated;
grant insert, update, delete on public.update_cards to authenticated;
grant all on public.update_cards to service_role;
