-- Link known award winners to catalogue artworks and copy public card images.

with covers as (
  select distinct on (al.entity_id)
    al.entity_id,
    a.public_url as image_url
  from public.asset_links al
  join public.assets a on a.id = al.asset_id
  where al.entity_type = 'artwork'
    and a.bucket = 'sb-assets-public'
    and a.public_url is not null
    and a.public_url <> ''
  order by al.entity_id,
    case
      when a.storage_path like '%/card/%' then 0
      when al.role = 'cover' then 1
      when al.role = 'hero' then 2
      else 3
    end,
    coalesce(a.sort_order, 0)
)
update public.award_winners w
set
  artwork_id = m.artwork_id,
  image_url = coalesce(nullif(w.image_url, ''), c.image_url)
from (values
  ('The quiet beneath the rubble', 'artwork-the-quiet-beneath-the-rubble'),
  ('Root System Analysis', 'artwork-root-system-analysis-i'),
  ('Expressions of Fragility', 'artwork-expression-of-fragility'),
  ('Staged Narratives', 'artwork-staged-narratives'),
  ('Mirage of the Three, 2025', 'artwork-mirage-of-the-three-2025'),
  ('Ginning Justice, 2025', 'artwork-ginning-justice'),
  ('Ginning Justice 2025', 'artwork-ginning-justice'),
  ('Shifting Landscapes', 'artwork-shifting-landscapes'),
  ('Sacred Scapes', 'artwork-sacred-scapes')
) as m(title, artwork_id)
left join covers c on c.entity_id = m.artwork_id
where lower(w.artwork_title) = lower(m.title);
