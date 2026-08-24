-- Update cards: three interaction modes
--   content  (Option 1) — spotlight with long detail text + optional image
--   internal (Option 2) — preview modal → Know more navigates on-site
--   external (Option 3) — preview modal → confirm before opening external URL

alter table public.update_cards
  add column if not exists detail_body text,
  add column if not exists link_label text check (char_length(link_label) <= 40),
  add column if not exists link_target_kind text check (
    link_target_kind is null
    or link_target_kind in (
      'section',
      'workshop',
      'residency',
      'award',
      'press',
      'custom'
    )
  ),
  add column if not exists link_target_id text check (
    link_target_id is null or char_length(link_target_id) <= 200
  );

-- Map legacy type labels onto the three options.
update public.update_cards
set card_type = case card_type
  when 'general' then 'content'
  when 'programmes' then 'internal'
  when 'news' then 'internal'
  else card_type
end
where card_type in ('general', 'programmes', 'news');

-- Default any leftover/unknown values to content.
update public.update_cards
set card_type = 'content'
where card_type not in ('content', 'internal', 'external');

alter table public.update_cards
  drop constraint if exists update_cards_card_type_check;

alter table public.update_cards
  add constraint update_cards_card_type_check
  check (card_type in ('content', 'internal', 'external'));

alter table public.update_cards
  alter column card_type set default 'content';
