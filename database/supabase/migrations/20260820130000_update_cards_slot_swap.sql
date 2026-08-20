-- Allow temporary slot 0 so CMS can swap update_card positions safely under UNIQUE(slot).

alter table public.update_cards drop constraint if exists update_cards_slot_check;
alter table public.update_cards
  add constraint update_cards_slot_check check (slot between 0 and 3);
