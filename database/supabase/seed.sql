-- Local smoke-test shells only. Full catalogue arrives via the import job / CMS.
-- Applied on `supabase db reset` (see config.toml [db.seed]).

insert into public.editions (id, number, years, title, slug, is_current, published)
values
  ('edition-2014-15', 1, '2014-15', 'Students'' Biennale', '2014-15', false, true),
  ('edition-2016-17', 2, '2016-17', 'Students'' Biennale', '2016-17', false, true),
  ('edition-2018-19', 3, '2018-19', 'Students'' Biennale', '2018-19', false, true),
  ('edition-2020-21', 4, '2020-21', 'Students'' Biennale', '2020-21', false, true),
  ('edition-2022-23', 5, '2022-23', 'Students'' Biennale', '2022-23', false, true),
  ('edition-2025-26', 6, '2025-26', 'Sensing Grounds', '2025-26', true, true);

insert into public.slugs (slug, entity_type, entity_id, edition_id)
values
  ('2014-15', 'edition', 'edition-2014-15', 'edition-2014-15'),
  ('2016-17', 'edition', 'edition-2016-17', 'edition-2016-17'),
  ('2018-19', 'edition', 'edition-2018-19', 'edition-2018-19'),
  ('2020-21', 'edition', 'edition-2020-21', 'edition-2020-21'),
  ('2022-23', 'edition', 'edition-2022-23', 'edition-2022-23'),
  ('2025-26', 'edition', 'edition-2025-26', 'edition-2025-26');

insert into public.search_entries (
  id, entity_type, entity_id, edition_id, title, subtitle, route, field_title, field_edition
)
values (
  'search-edition-2025-26',
  'edition',
  'edition-2025-26',
  'edition-2025-26',
  'Sensing Grounds',
  'Students'' Biennale 2025–26',
  '/editions/2025-26',
  'Sensing Grounds',
  '2025-26'
);
