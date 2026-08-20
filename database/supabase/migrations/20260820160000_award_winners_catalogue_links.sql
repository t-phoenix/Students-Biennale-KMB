-- Slim awards to catalogue links only (no duplicated artwork/artist fields).
-- Safe: backfills person_id, verifies, then drops redundant columns.

-- 1) Add person_id on award artists
alter table public.award_winner_artists
  add column if not exists person_id text references public.people (id) on delete restrict;

-- 2) Backfill person_id from exact name, contributor link, and known spellings
update public.award_winner_artists awa
set person_id = matched.person_id
from (
  select
    awa2.id as artist_row_id,
    coalesce(
      -- exact people.name
      (
        select p.id
        from public.people p
        where lower(p.name) = lower(awa2.name)
        limit 1
      ),
      -- artwork contributor display_name
      (
        select ac.person_id
        from public.award_winners w
        join public.artwork_contributors ac
          on ac.artwork_id = w.artwork_id
         and lower(ac.display_name) = lower(awa2.name)
        where w.id = awa2.award_winner_id
          and ac.person_id is not null
        limit 1
      ),
      -- known spelling variants from legacy free-text
      case lower(awa2.name)
        when 'abhishek kholapudi' then 'person-abhishek-kolapudi'
        when 'm. imran ahmed' then 'person-m-imran-ahamed'
        when 'm imran ahmed' then 'person-m-imran-ahamed'
        else null
      end
    ) as person_id
  from public.award_winner_artists awa2
) as matched
where awa.id = matched.artist_row_id
  and awa.person_id is null;

-- 3) Fail loudly if any active award artist is still unlinked
do $$
declare
  missing int;
  sample text;
begin
  select count(*), string_agg(awa.name, ', ')
  into missing, sample
  from public.award_winner_artists awa
  join public.award_winners w on w.id = awa.award_winner_id
  where w.active and awa.person_id is null;

  if missing > 0 then
    raise exception
      'award_winner_artists backfill incomplete (% rows): %',
      missing,
      sample;
  end if;
end $$;

-- 4) Fail if any active award lacks artwork_id
do $$
declare
  missing int;
begin
  select count(*) into missing
  from public.award_winners
  where active and artwork_id is null;

  if missing > 0 then
    raise exception
      'award_winners missing artwork_id on % active rows — aborting',
      missing;
  end if;
end $$;

-- 5) Enforce FKs / required links
alter table public.award_winners
  alter column artwork_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'award_winners_artwork_id_fkey'
  ) then
    alter table public.award_winners
      add constraint award_winners_artwork_id_fkey
      foreign key (artwork_id) references public.artworks (id) on delete restrict;
  end if;
end $$;

alter table public.award_winner_artists
  alter column person_id set not null;

-- 6) Drop free-text / duplicated detail columns (source of truth = catalogue)
alter table public.award_winners
  drop column if exists artwork_title,
  drop column if exists year,
  drop column if exists venue,
  drop column if exists dimensions,
  drop column if exists materials,
  drop column if exists description,
  drop column if exists curator,
  drop column if exists image_url;

alter table public.award_winner_artists
  drop column if exists name,
  drop column if exists institution;

-- 7) Helpful index for CMS lists
create index if not exists award_winners_artwork_idx
  on public.award_winners (artwork_id);

create index if not exists award_winner_artists_person_idx
  on public.award_winner_artists (person_id);
