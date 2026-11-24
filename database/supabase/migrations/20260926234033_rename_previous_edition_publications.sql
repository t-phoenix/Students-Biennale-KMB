-- Previous-edition download cards:
-- 2018-19: drop the catalogue link (publication 1); name the remaining file.
-- 2022-23: name the catalogue link. Empty labels were rendering as "Publication".

update public.edition_section_items
set label = 'SB Workshop 2018–19'
where id = 'edition-2018-19-downloads-3-item-1';

delete from public.edition_section_items
where id = 'edition-2018-19-downloads-3-item-0';

update public.edition_section_items
set label = 'SB Catalogue 2022–23'
where id = 'edition-2022-23-downloads-3-item-0';

update public.catalogue_snapshots cs
set
  payload = jsonb_set(
    cs.payload,
    '{sections}',
    (
      select coalesce(jsonb_agg(rebuilt.updated_section order by rebuilt.section_ord), '[]'::jsonb)
      from (
        select
          sections.section_ord,
          case
            when sections.section->>'section_key' <> 'downloads' then sections.section
            else jsonb_set(
              sections.section,
              '{items}',
              coalesce(
                (
                  select jsonb_agg(labeled.item order by labeled.item_ord)
                  from (
                    select
                      items.item_ord,
                      case cs.edition_id
                        when 'edition-2018-19' then
                          case
                            when items.item->>'url' like '%1Uw2bN39CT8tnAsw144_iJIF_9INjIs4L%' then null
                            when items.item->>'url' like '%1WXKapw1nvrKAGMNGsXUiKEC7zOL8AuPq%' then
                              jsonb_set(items.item, '{label}', to_jsonb('SB Workshop 2018–19'::text), true)
                            else items.item
                          end
                        when 'edition-2022-23' then
                          case
                            when items.item->>'url' like '%164ZJWh_ZlQK27jUzXM5aGEyuygfp8aWF%' then
                              jsonb_set(items.item, '{label}', to_jsonb('SB Catalogue 2022–23'::text), true)
                            else items.item
                          end
                        else items.item
                      end as item
                    from jsonb_array_elements(coalesce(sections.section->'items', '[]'::jsonb))
                      with ordinality as items(item, item_ord)
                  ) labeled
                  where labeled.item is not null
                ),
                '[]'::jsonb
              )
            )
          end as updated_section
        from jsonb_array_elements(coalesce(cs.payload->'sections', '[]'::jsonb))
          with ordinality as sections(section, section_ord)
      ) rebuilt
    )
  ),
  generated_at = now()
where cs.edition_id in ('edition-2018-19', 'edition-2022-23');
