-- Tagged-field search. Does not scan full body/bio/history.
-- Frontend: supabase.rpc('search_entities', { q, filter_edition_id, result_limit })
-- filter_edition_id is the arg name so it does not clash with the RETURNS TABLE column edition_id.

create or replace function public.search_entities(
  q text,
  filter_edition_id text default null,
  result_limit integer default 12
)
returns table (
  id text,
  entity_type text,
  entity_id text,
  edition_id text,
  title text,
  subtitle text,
  route text,
  matched_field text,
  matched_snippet text,
  rank real
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  query_text text := trim(q);
  tsquery tsquery;
begin
  if query_text is null or char_length(query_text) < 2 then
    return;
  end if;

  begin
    tsquery := websearch_to_tsquery('english', query_text);
  exception
    when others then
      tsquery := plainto_tsquery('english', query_text);
  end;

  return query
  select
    se.id,
    se.entity_type,
    se.entity_id,
    se.edition_id,
    se.title,
    se.subtitle,
    se.route,
    case
      when se.field_title ilike '%' || query_text || '%' then 'field_title'
      when se.field_artist ilike '%' || query_text || '%' then 'field_artist'
      when se.field_curator ilike '%' || query_text || '%' then 'field_curator'
      when se.field_venue ilike '%' || query_text || '%' then 'field_venue'
      when se.field_zone ilike '%' || query_text || '%' then 'field_zone'
      when se.field_edition ilike '%' || query_text || '%' then 'field_edition'
      when se.field_programme ilike '%' || query_text || '%' then 'field_programme'
      when se.field_institution ilike '%' || query_text || '%' then 'field_institution'
      else 'field_title'
    end as matched_field,
    case
      when se.field_title ilike '%' || query_text || '%' then se.field_title
      when se.field_artist ilike '%' || query_text || '%' then se.field_artist
      when se.field_curator ilike '%' || query_text || '%' then se.field_curator
      when se.field_venue ilike '%' || query_text || '%' then se.field_venue
      when se.field_zone ilike '%' || query_text || '%' then se.field_zone
      when se.field_edition ilike '%' || query_text || '%' then se.field_edition
      when se.field_programme ilike '%' || query_text || '%' then se.field_programme
      when se.field_institution ilike '%' || query_text || '%' then se.field_institution
      else se.title
    end as matched_snippet,
    ts_rank(se.search_vector, tsquery) as rank
  from public.search_entries se
  where
    (filter_edition_id is null or se.edition_id = filter_edition_id)
    and (
      se.search_vector @@ tsquery
      or se.title ilike '%' || query_text || '%'
      or se.field_artist ilike '%' || query_text || '%'
      or se.field_curator ilike '%' || query_text || '%'
      or se.field_venue ilike '%' || query_text || '%'
    )
  order by rank desc, se.title
  limit greatest(1, least(coalesce(result_limit, 12), 50));
end;
$$;

grant execute on function public.search_entities(text, text, integer) to anon, authenticated;
