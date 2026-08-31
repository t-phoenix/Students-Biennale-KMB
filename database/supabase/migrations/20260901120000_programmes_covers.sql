-- Programmes page hero carousel covers + optional Home banner selection.

create table public.programmes_covers (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  show_on_home boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger programmes_covers_set_updated_at
  before update on public.programmes_covers
  for each row execute function public.set_updated_at();

-- Only one cover may be flagged for the Home programmes banner.
create unique index programmes_covers_one_home
  on public.programmes_covers ((true))
  where show_on_home = true;

-- Splice-on-write sort_order (mirrors home_covers_shift_sort).
create or replace function public.programmes_covers_shift_sort()
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
    update public.programmes_covers
    set sort_order = sort_order - 1
    where sort_order > old.sort_order;
    return old;
  end if;

  select count(*) into n
  from public.programmes_covers
  where tg_op = 'INSERT' or id <> new.id;

  new.sort_order := least(greatest(coalesce(new.sort_order, n), 0), n);

  if tg_op = 'INSERT' then
    update public.programmes_covers
    set sort_order = sort_order + 1
    where sort_order >= new.sort_order;
    return new;
  end if;

  if new.sort_order is distinct from old.sort_order then
    if new.sort_order < old.sort_order then
      update public.programmes_covers
      set sort_order = sort_order + 1
      where id <> new.id
        and sort_order >= new.sort_order
        and sort_order < old.sort_order;
    else
      update public.programmes_covers
      set sort_order = sort_order - 1
      where id <> new.id
        and sort_order > old.sort_order
        and sort_order <= new.sort_order;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists programmes_covers_shift_sort_write on public.programmes_covers;
create trigger programmes_covers_shift_sort_write
  before insert or update of sort_order on public.programmes_covers
  for each row execute function public.programmes_covers_shift_sort();

drop trigger if exists programmes_covers_shift_sort_delete on public.programmes_covers;
create trigger programmes_covers_shift_sort_delete
  after delete on public.programmes_covers
  for each row execute function public.programmes_covers_shift_sort();

-- RLS
alter table public.programmes_covers enable row level security;

create policy programmes_covers_public_read on public.programmes_covers
  for select to anon, authenticated
  using (active = true or (select private.is_cms_admin()));

create policy programmes_covers_cms_insert on public.programmes_covers
  for insert to authenticated with check ((select private.is_cms_admin()));

create policy programmes_covers_cms_update on public.programmes_covers
  for update to authenticated
  using ((select private.is_cms_admin()))
  with check ((select private.is_cms_admin()));

create policy programmes_covers_cms_delete on public.programmes_covers
  for delete to authenticated using ((select private.is_cms_admin()));

-- Grants
grant select on public.programmes_covers to anon, authenticated;
grant insert, update, delete on public.programmes_covers to authenticated;
grant all on public.programmes_covers to service_role;
