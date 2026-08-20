-- Home covers: dedicated credit fields + splice-on-write sort_order.

alter table public.home_covers
  add column if not exists artwork_name text check (char_length(artwork_name) <= 50),
  add column if not exists artist text check (char_length(artist) <= 80),
  add column if not exists institution text check (char_length(institution) <= 100);

update public.home_covers
set
  artwork_name = nullif(btrim(coalesce(artwork_name, heading, '')), ''),
  artist = coalesce(
    nullif(artist, ''),
    nullif(btrim(split_part(replace(replace(coalesce(body, ''), '|', '·'), E'\n', '·'), '·', 1)), '')
  ),
  institution = coalesce(
    nullif(institution, ''),
    nullif(
      btrim(
        regexp_replace(
          coalesce(body, ''),
          '^[^·|\n]+(?:[·|\n]\s*)?',
          ''
        )
      ),
      ''
    )
  )
where artwork_name is null or artist is null or institution is null;

alter table public.home_covers drop column if exists heading;
alter table public.home_covers drop column if exists body;

-- Collapse duplicate indexes. On a tie, the later insert (the one the editor
-- meant to place at that slot) wins the lower number.
with ranked as (
  select
    id,
    row_number() over (order by sort_order asc, created_at desc) - 1 as new_order
  from public.home_covers
)
update public.home_covers h
set sort_order = ranked.new_order
from ranked
where h.id = ranked.id
  and h.sort_order is distinct from ranked.new_order;

create or replace function public.home_covers_shift_sort()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  n int;
begin
  if pg_trigger_depth() > 1 then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    update public.home_covers
    set sort_order = sort_order - 1
    where sort_order > old.sort_order;
    return old;
  end if;

  select count(*) into n
  from public.home_covers
  where tg_op = 'INSERT' or id <> new.id;

  new.sort_order := least(greatest(coalesce(new.sort_order, n), 0), n);

  if tg_op = 'INSERT' then
    update public.home_covers
    set sort_order = sort_order + 1
    where sort_order >= new.sort_order;
    return new;
  end if;

  if new.sort_order is distinct from old.sort_order then
    if new.sort_order < old.sort_order then
      update public.home_covers
      set sort_order = sort_order + 1
      where id <> new.id
        and sort_order >= new.sort_order
        and sort_order < old.sort_order;
    else
      update public.home_covers
      set sort_order = sort_order - 1
      where id <> new.id
        and sort_order > old.sort_order
        and sort_order <= new.sort_order;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists home_covers_shift_sort_write on public.home_covers;
create trigger home_covers_shift_sort_write
  before insert or update of sort_order on public.home_covers
  for each row execute function public.home_covers_shift_sort();

drop trigger if exists home_covers_shift_sort_delete on public.home_covers;
create trigger home_covers_shift_sort_delete
  after delete on public.home_covers
  for each row execute function public.home_covers_shift_sort();
