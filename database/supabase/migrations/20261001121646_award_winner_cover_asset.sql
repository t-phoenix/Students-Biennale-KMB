-- Point an award card at one existing public artwork image.
-- Null keeps the artwork catalogue cover. No copied URL or file.

alter table public.award_winners
  add column if not exists cover_asset_id text references public.assets (id) on delete restrict;

create index if not exists award_winners_cover_asset_idx
  on public.award_winners (cover_asset_id);

create or replace function private.award_winner_cover_belongs_to_artwork()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.cover_asset_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.asset_links al
    join public.assets a on a.id = al.asset_id
    where al.asset_id = new.cover_asset_id
      and al.entity_type = 'artwork'
      and al.entity_id = new.artwork_id
      and a.variant <> 'original'
      and a.status = 'ready'
      and a.public_url is not null
  ) then
    raise exception 'cover_asset_id must be a ready public image already linked to this artwork';
  end if;

  return new;
end;
$$;

revoke all on function private.award_winner_cover_belongs_to_artwork() from public;

drop trigger if exists award_winners_cover_asset on public.award_winners;
create trigger award_winners_cover_asset
  before insert or update of cover_asset_id, artwork_id
  on public.award_winners
  for each row
  execute function private.award_winner_cover_belongs_to_artwork();
