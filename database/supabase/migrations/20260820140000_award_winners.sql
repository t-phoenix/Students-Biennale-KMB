-- Structured award winners (replaces free-text programmes.body lists for CMS).

create table public.award_winners (
  id uuid primary key default gen_random_uuid(),
  programme_id text not null references public.programmes (id) on delete cascade,
  artwork_title text not null check (char_length(artwork_title) <= 200),
  year text check (char_length(year) <= 40),
  venue text check (char_length(venue) <= 200),
  dimensions text check (char_length(dimensions) <= 200),
  materials text check (char_length(materials) <= 1000),
  description text,
  curator text check (char_length(curator) <= 300),
  image_url text,
  artwork_id text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger award_winners_set_updated_at
  before update on public.award_winners
  for each row execute function public.set_updated_at();

create index award_winners_programme_sort_idx
  on public.award_winners (programme_id, sort_order);

create table public.award_winner_artists (
  id uuid primary key default gen_random_uuid(),
  award_winner_id uuid not null references public.award_winners (id) on delete cascade,
  name text not null check (char_length(name) <= 120),
  institution text check (char_length(institution) <= 200),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index award_winner_artists_winner_sort_idx
  on public.award_winner_artists (award_winner_id, sort_order);

-- RLS
alter table public.award_winners enable row level security;
alter table public.award_winner_artists enable row level security;

create policy award_winners_public_read on public.award_winners
  for select to anon, authenticated using (true);

create policy award_winners_cms_insert on public.award_winners
  for insert to authenticated with check ((select private.is_cms_admin()));

create policy award_winners_cms_update on public.award_winners
  for update to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy award_winners_cms_delete on public.award_winners
  for delete to authenticated using ((select private.is_cms_admin()));

create policy award_winner_artists_public_read on public.award_winner_artists
  for select to anon, authenticated using (true);

create policy award_winner_artists_cms_insert on public.award_winner_artists
  for insert to authenticated with check ((select private.is_cms_admin()));

create policy award_winner_artists_cms_update on public.award_winner_artists
  for update to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy award_winner_artists_cms_delete on public.award_winner_artists
  for delete to authenticated using ((select private.is_cms_admin()));

grant select on public.award_winners to anon, authenticated;
grant insert, update, delete on public.award_winners to authenticated;
grant all on public.award_winners to service_role;

grant select on public.award_winner_artists to anon, authenticated;
grant insert, update, delete on public.award_winner_artists to authenticated;
grant all on public.award_winner_artists to service_role;

-- Migrate existing bullet lists from programmes.body into structured rows.
do $$
declare
  prog record;
  lines text[];
  i int;
  line text;
  next_line text;
  name_part text;
  artwork_part text;
  institution_part text;
  img_part text;
  m text[];
  winner_id uuid;
  sort_i int;
begin
  for prog in
    select id, body
    from public.programmes
    where subtype in ('national-award', 'international-award')
      and body is not null
  loop
    lines := string_to_array(replace(prog.body, E'\r\n', E'\n'), E'\n');
    sort_i := 0;
    i := 1;
    while i <= coalesce(array_length(lines, 1), 0) loop
      line := btrim(coalesce(lines[i], ''));
      if line = '' or line ~* '^tata trusts' or line ~* '^format' then
        i := i + 1;
        continue;
      end if;

      line := regexp_replace(line, '^[-•]\s*', '');
      img_part := null;
      if line ~ '\[img:(.+)\]\s*$' then
        img_part := substring(line from '\[img:(.+)\]\s*$');
        line := btrim(regexp_replace(line, '\s*\[img:.+\]\s*$', ''));
      end if;

      -- name — artwork (institution)
      if line ~ '^.+\s+[—–-]\s+.+\s+\(.+\)\.?$' then
        m := regexp_match(line, '^(.+?)\s+[—–-]\s+(.+?)\s+\((.+?)\)\.?$');
        name_part := btrim(m[1]);
        artwork_part := btrim(m[2]);
        institution_part := btrim(regexp_replace(m[3], '\.$', ''));
      elsif line ~ '^.+\s+[—–-]\s+.+$' then
        m := regexp_match(line, '^(.+?)\s+[—–-]\s+(.+)$');
        name_part := btrim(m[1]);
        artwork_part := btrim(m[2]);
        institution_part := null;
        -- institution may be on the next non-empty line
        if i + 1 <= coalesce(array_length(lines, 1), 0) then
          next_line := btrim(coalesce(lines[i + 1], ''));
          next_line := regexp_replace(next_line, '^[-•]\s*', '');
          if next_line <> ''
            and next_line !~ '^.+\s+[—–-]\s+.+$'
            and next_line !~* '^tata trusts'
            and char_length(next_line) < 140
          then
            institution_part := btrim(regexp_replace(next_line, '\.$', ''));
            i := i + 1;
          end if;
        end if;
      else
        i := i + 1;
        continue;
      end if;

      insert into public.award_winners (
        programme_id, artwork_title, image_url, sort_order, active
      ) values (
        prog.id, artwork_part, img_part, sort_i, true
      ) returning id into winner_id;

      insert into public.award_winner_artists (
        award_winner_id, name, institution, sort_order
      ) values (
        winner_id, name_part, institution_part, 0
      );

      sort_i := sort_i + 1;
      i := i + 1;
    end loop;
  end loop;
end $$;
