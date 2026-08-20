-- Structured residency fields on programmes (host + awardees).
-- Period = dates, Venue = place, Description = body, Card teaser = summary.

alter table public.programmes
  add column if not exists host text,
  add column if not exists awardees text;

comment on column public.programmes.host is 'Residency host (also usable by other subtypes if needed)';
comment on column public.programmes.awardees is 'Residency awardees display string';
comment on column public.programmes.dates is 'Period / dates display string';
comment on column public.programmes.place is 'Venue / place display string';
comment on column public.programmes.summary is 'Short card teaser (residencies band)';
comment on column public.programmes.body is 'Full description body';

-- Backfill host / awardees / clean body from legacy free-text for residencies.
do $$
declare
  r record;
  lines text[];
  line text;
  host_val text;
  awardees_val text;
  period_val text;
  venue_val text;
  rest text[] := array[]::text[];
  cleaned text;
  first_para text;
begin
  for r in
    select id, title, dates, place, summary, body
    from public.programmes
    where subtype = 'residency'
  loop
    host_val := null;
    awardees_val := null;
    period_val := null;
    venue_val := null;
    rest := array[]::text[];

    -- Prefer host already in summary like "Residency Host: KBF"
    if r.summary ~* 'host:\s*(.+)$' then
      host_val := btrim(substring(r.summary from '(?i)host:\s*(.+)$'));
    end if;

    lines := string_to_array(replace(coalesce(r.body, ''), E'\r\n', E'\n'), E'\n');
    foreach line in array coalesce(lines, array[]::text[]) loop
      line := btrim(line);
      if line = '' then
        rest := array_append(rest, '');
        continue;
      end if;
      if lower(line) = lower(r.title) then
        continue;
      end if;
      if line ~* '^(?:residency\s+)?host:\s*(.+)$' then
        host_val := coalesce(host_val, btrim(substring(line from '(?i)^(?:residency\s+)?host:\s*(.+)$')));
        continue;
      end if;
      if line ~* '^(?:residency\s+)?period:\s*(.+)$' then
        period_val := btrim(substring(line from '(?i)^(?:residency\s+)?period:\s*(.+)$'));
        continue;
      end if;
      if line ~* '^venue:\s*(.+)$' then
        venue_val := btrim(substring(line from '(?i)^venue:\s*(.+)$'));
        continue;
      end if;
      if line ~* '^awardees:\s*(.+)$' then
        awardees_val := btrim(substring(line from '(?i)^awardees:\s*(.+)$'));
        continue;
      end if;
      rest := array_append(rest, line);
    end loop;

    -- Marseille: extract awardees from known names if still empty
    if awardees_val is null
      and r.body ilike '%Kaki Weiss%'
      and r.body ilike '%Nina Durel%'
    then
      awardees_val := 'Kaki Weiss & Nina Durel';
    end if;

    if host_val is null and r.body ilike '%Beaux-Arts de Marseille%' then
      host_val := 'Kochi Biennale Foundation × Beaux-Arts de Marseille';
    end if;

    cleaned := btrim(regexp_replace(array_to_string(rest, E'\n'), E'\n{3,}', E'\n\n', 'g'));

    -- Card teaser: first paragraph of cleaned description (unless summary already looks like prose)
    first_para := null;
    if cleaned <> '' then
      first_para := btrim(split_part(cleaned, E'\n\n', 1));
    end if;

    update public.programmes
    set
      host = coalesce(host, host_val),
      awardees = coalesce(awardees, awardees_val),
      dates = coalesce(nullif(btrim(dates), ''), period_val, dates),
      place = coalesce(nullif(btrim(place), ''), venue_val, place),
      body = case when cleaned <> '' then cleaned else body end,
      summary = case
        when summary is null or summary ~* 'host:' or char_length(summary) < 40
          then left(coalesce(first_para, summary), 360)
        else summary
      end
    where id = r.id;
  end loop;
end $$;
