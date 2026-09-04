import type { MappedCatalogue, SearchIndexEntry } from "./types";

/** Client-side tagged filter. Does not call Postgres.
 *  Matches when query tokens are ordered prefixes of the text tokens,
 *  so "vkl w" hits "VKL Warehouse" and "faiza h" hits "Faiza Hasan".
 */
export function matchesQuery(query: string, ...parts: Array<string | null | undefined>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const queryTokens = q.split(/[^a-z0-9]+/).filter(Boolean);
  if (!queryTokens.length) return true;

  return parts.some((part) => {
    const text = (part ?? "").toLowerCase();
    if (!text) return false;
    const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);
    if (!tokens.length) return false;

    let cursor = 0;
    for (const needle of queryTokens) {
      let found = false;
      while (cursor < tokens.length) {
        if (tokens[cursor].startsWith(needle)) {
          found = true;
          cursor += 1;
          break;
        }
        cursor += 1;
      }
      if (!found) return false;
    }
    return true;
  });
}

export function searchBlob(entry: SearchIndexEntry): string {
  return [
    entry.title,
    entry.subtitle,
    entry.field_title,
    entry.field_artist,
    entry.field_curator,
    entry.field_venue,
    entry.field_zone,
    entry.field_institution,
    entry.field_edition,
  ]
    .filter(Boolean)
    .join(" ");
}

export function indexBlobForEntity(index: SearchIndexEntry[], entityId: string): string {
  return index
    .filter((row) => row.entity_id === entityId)
    .map(searchBlob)
    .join(" ");
}

export function taggedText(
  index: SearchIndexEntry[],
  entityId: string,
  ...local: Array<string | null | undefined>
): string {
  return [...local, indexBlobForEntity(index, entityId)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Split text into segments for `<mark>` rendering. Case-insensitive.
 *  Highlights each query token (so "vkl w" marks both words in "VKL Warehouse").
 */
export function highlightSegments(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  const q = query.trim();
  if (!q || !text) return [{ text, match: false }];

  const needles = [
    ...new Set(
      q
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean),
    ),
  ].sort((a, b) => b.length - a.length);
  if (!needles.length) return [{ text, match: false }];

  const lower = text.toLowerCase();
  const marks: Array<{ start: number; end: number }> = [];
  for (const needle of needles) {
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      // Prefer token-boundary-ish matches (start, or non-alnum before).
      const prev = idx === 0 ? "" : lower[idx - 1];
      if (idx === 0 || /[^a-z0-9]/.test(prev)) {
        marks.push({ start: idx, end: idx + needle.length });
      }
      from = idx + needle.length;
    }
  }
  if (!marks.length) return [{ text, match: false }];

  marks.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: Array<{ start: number; end: number }> = [];
  for (const mark of marks) {
    const last = merged[merged.length - 1];
    if (last && mark.start <= last.end) {
      last.end = Math.max(last.end, mark.end);
    } else {
      merged.push({ ...mark });
    }
  }

  const parts: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  for (const mark of merged) {
    if (mark.start > cursor) {
      parts.push({ text: text.slice(cursor, mark.start), match: false });
    }
    parts.push({ text: text.slice(mark.start, mark.end), match: true });
    cursor = mark.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts.length ? parts : [{ text, match: false }];
}

const TAGGED_FIELDS = [
  "field_title",
  "field_artist",
  "field_curator",
  "field_venue",
  "field_zone",
  "field_institution",
  "field_edition",
  "title",
  "subtitle",
] as const;

export type EditionMetaMatch = {
  matchedField: string;
  matchedSnippet: string;
  entry: SearchIndexEntry;
};

function indexEntriesForCatalogue(
  catalogue: Pick<MappedCatalogue, "searchIndex" | "title" | "years" | "institutions">,
): SearchIndexEntry[] {
  return [
    ...(catalogue.searchIndex ?? []),
    {
      entity_type: "edition",
      entity_id: catalogue.years,
      title: catalogue.title,
      route: `/editions/${catalogue.years}`,
      field_title: catalogue.title,
      field_edition: catalogue.years,
      field_institution: catalogue.institutions.join(", ") || undefined,
    },
  ];
}

function matchIndexEntries(
  query: string,
  entries: SearchIndexEntry[],
): EditionMetaMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: EditionMetaMatch[] = [];
  for (const entry of entries) {
    for (const field of TAGGED_FIELDS) {
      const value = entry[field];
      if (typeof value === "string" && matchesQuery(q, value)) {
        hits.push({ matchedField: field, matchedSnippet: value, entry });
        break;
      }
    }
  }
  return hits;
}

/** Match query against an edition's compact search index (tagged fields only). */
export function matchEditionMeta(
  query: string,
  catalogue: Pick<MappedCatalogue, "searchIndex" | "title" | "years" | "institutions">,
): EditionMetaMatch | null {
  return matchIndexEntries(query, indexEntriesForCatalogue(catalogue))[0] ?? null;
}

/** True when this catalogue has no entity rows but may still be searchable via tags. */
export function isSparseCatalogue(
  catalogue: Pick<MappedCatalogue, "artworks" | "artists" | "venues" | "zones" | "curators">,
): boolean {
  return (
    catalogue.artworks.length === 0 &&
    catalogue.artists.length === 0 &&
    catalogue.venues.length === 0 &&
    catalogue.zones.length === 0 &&
    catalogue.curators.length === 0
  );
}

export type SearchHitKind =
  | "curator"
  | "team"
  | "artwork"
  | "artist"
  | "venue"
  | "institution"
  | "previous-edition";

export type SearchHit = {
  kind: SearchHitKind;
  title: string;
  subtitle?: string;
  href: string;
  matchedSnippet: string;
  editionYears: string;
  source: "entity" | "previous-meta";
  image?: string;
};

export type EditionSearchResults = {
  curators: SearchHit[];
  team: SearchHit[];
  artworks: SearchHit[];
  artists: SearchHit[];
  venues: SearchHit[];
  institutions: SearchHit[];
  previousEditions: SearchHit[];
};

function dedupeKey(hit: SearchHit): string {
  return `${hit.kind}:${hit.href}:${hit.matchedSnippet.toLowerCase()}`;
}

function pushHit(hits: SearchHit[], seen: Set<string>, hit: SearchHit) {
  const key = dedupeKey(hit);
  if (seen.has(key)) return;
  seen.add(key);
  hits.push(hit);
}

export function searchHitHref(href: string, query: string): string {
  const q = query.trim();
  if (!q) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}highlight=${encodeURIComponent(q)}`;
}

function indexHitToPreviousEditionHit(
  hit: EditionMetaMatch,
  catalogue: Pick<MappedCatalogue, "years" | "heroUrl" | "heroUrls">,
  query: string,
): SearchHit {
  const { entry, matchedSnippet } = hit;
  const editionYears = catalogue.years;
  const href = searchHitHref(
    entry.route.startsWith("/") ? entry.route : `/editions/${editionYears}`,
    query,
  );
  const image = catalogue.heroUrls[0] ?? catalogue.heroUrl ?? undefined;

  if (entry.entity_type === "edition") {
    return {
      kind: "previous-edition",
      title: entry.title,
      subtitle: editionYears.replace("-", "–"),
      href,
      matchedSnippet,
      editionYears,
      source: "previous-meta",
      image,
    };
  }

  return {
    kind: "previous-edition",
    title: entry.title,
    subtitle: entry.subtitle ?? editionYears.replace("-", "–"),
    href,
    matchedSnippet,
    editionYears,
    source: "previous-meta",
    image,
  };
}

function indexHitToSearchHit(
  hit: EditionMetaMatch,
  catalogue: Pick<MappedCatalogue, "years" | "heroUrl" | "heroUrls">,
  query: string,
): SearchHit | null {
  const { entry, matchedSnippet } = hit;
  const editionYears = catalogue.years;
  const href = searchHitHref(
    entry.route.startsWith("/") ? entry.route : `/editions/${editionYears}`,
    query,
  );
  const image = catalogue.heroUrls[0] ?? catalogue.heroUrl ?? undefined;

  if (entry.entity_type === "edition") {
    return {
      kind: "previous-edition",
      title: entry.title,
      subtitle: editionYears.replace("-", "–"),
      href,
      matchedSnippet,
      editionYears,
      source: "previous-meta",
      image,
    };
  }

  const base = {
    title: entry.title,
    subtitle: entry.subtitle ?? editionYears.replace("-", "–"),
    href,
    matchedSnippet,
    editionYears,
    source: "previous-meta" as const,
    image,
  };

  // Classify by entity_type first. Artwork rows carry field_venue / field_institution
  // for search text — those must not be re-bucketed as venues or institutions.
  if (entry.entity_type === "artwork") {
    return { kind: "artwork", ...base };
  }
  if (entry.entity_type === "venue") {
    return { kind: "venue", ...base };
  }
  if (entry.entity_type === "institution") {
    return {
      kind: "institution",
      title: entry.title,
      subtitle: entry.subtitle ?? `Institution · ${editionYears.replace("-", "–")}`,
      href,
      matchedSnippet,
      editionYears,
      source: "previous-meta",
      image,
    };
  }
  if (entry.entity_type === "programme") {
    return null;
  }
  if (entry.entity_type === "person") {
    if (entry.field_curator) return { kind: "curator", ...base };
    if (entry.subtitle?.startsWith("Team")) return { kind: "team", ...base };
    if (entry.field_artist) return { kind: "artist", ...base };
    return { kind: "team", ...base };
  }

  // Untyped credit-tag fallbacks (edition-search-tags.json).
  if (entry.field_curator) return { kind: "curator", ...base };
  if (entry.subtitle?.startsWith("Team")) return { kind: "team", ...base };
  if (entry.field_artist) return { kind: "artist", ...base };
  if (entry.field_venue) return { kind: "venue", ...base };
  if (entry.field_institution) {
    return {
      kind: "institution",
      title: entry.title,
      subtitle: entry.subtitle ?? `Institution · ${editionYears.replace("-", "–")}`,
      href,
      matchedSnippet,
      editionYears,
      source: "previous-meta",
      image,
    };
  }
  return null;
}

function pushIndexHits(
  results: EditionSearchResults,
  seen: Set<string>,
  query: string,
  catalogue: Pick<MappedCatalogue, "years" | "heroUrl" | "heroUrls" | "searchIndex" | "title" | "institutions">,
  asPreviousSection: boolean,
  onlyKinds?: ReadonlySet<SearchHitKind>,
) {
  const hits = matchIndexEntries(query, indexEntriesForCatalogue(catalogue));
  const specific = hits.filter((hit) => hit.entry.entity_type !== "edition");
  const toProcess = specific.length
    ? specific
    : hits.filter((hit) => hit.entry.entity_type === "edition");
  for (const hit of toProcess) {
    if (asPreviousSection) {
      pushHit(results.previousEditions, seen, indexHitToPreviousEditionHit(hit, catalogue, query));
      continue;
    }
    const searchHit = indexHitToSearchHit(hit, catalogue, query);
    if (!searchHit) continue;
    if (onlyKinds && !onlyKinds.has(searchHit.kind)) continue;
    if (searchHit.kind === "previous-edition") {
      pushHit(results.previousEditions, seen, searchHit);
      continue;
    }
    if (searchHit.kind === "team") {
      pushHit(results.team, seen, searchHit);
      continue;
    }
    if (searchHit.kind === "institution") {
      pushHit(results.institutions, seen, searchHit);
      continue;
    }
    if (searchHit.kind === "venue") {
      const titleKey = searchHit.title.toLowerCase();
      if (results.venues.some((row) => row.title.toLowerCase() === titleKey)) continue;
      pushHit(results.venues, seen, searchHit);
      continue;
    }
    const bucket = results[`${searchHit.kind}s` as keyof Pick<
      EditionSearchResults,
      "curators" | "artworks" | "artists"
    >];
    pushHit(bucket, seen, searchHit);
  }
}

/** Unified cross-entity search for the edition catalogue shell. */
export function searchEditionCatalog(
  query: string,
  current: MappedCatalogue,
  all: MappedCatalogue[],
): EditionSearchResults {
  const q = query.trim();
  const empty: EditionSearchResults = {
    curators: [],
    team: [],
    artworks: [],
    artists: [],
    venues: [],
    institutions: [],
    previousEditions: [],
  };
  if (!q) return empty;

  const seen = new Set<string>();
  const results: EditionSearchResults = {
    curators: [],
    team: [],
    artworks: [],
    artists: [],
    venues: [],
    institutions: [],
    previousEditions: [],
  };

  for (const curator of current.curators) {
    const zone = current.zones.find((z) => z.curators.some((c) => c.id === curator.id));
    // Curators match visible identity fields only — not zone geography lists
    // (e.g. "Rajasthan" inside states must not surface Zone 1 curators for "raja").
    if (!matchesQuery(q, curator.name, curator.region, zone?.label)) {
      continue;
    }
    pushHit(results.curators, seen, {
      kind: "curator",
      title: curator.name,
      subtitle: zone?.label ?? curator.region,
      href: searchHitHref(`/editions/${current.years}/curators/${curator.id}`, q),
      matchedSnippet: curator.name,
      editionYears: current.years,
      source: "entity",
      image: curator.image,
    });
  }

  for (const artwork of current.artworks) {
    // Artworks match title/venue/artist names — institutions belong under Artists.
    if (
      !matchesQuery(
        q,
        artwork.title,
        artwork.venue,
        artwork.year,
        ...artwork.artists.map((x) => x.name),
      )
    ) {
      continue;
    }
    pushHit(results.artworks, seen, {
      kind: "artwork",
      title: artwork.title,
      subtitle: artwork.venue ? `Venue : ${artwork.venue}` : undefined,
      href: searchHitHref(`/editions/${current.years}/artworks/${artwork.id}`, q),
      matchedSnippet: artwork.title,
      editionYears: current.years,
      source: "entity",
      image: artwork.image || artwork.images?.[0],
    });
  }

  for (const artist of current.artists) {
    if (!matchesQuery(q, artist.searchText, artist.name, artist.institution, artist.zone)) {
      continue;
    }
    const work = current.artworks.find((w) =>
      w.artists.some(
        (x) => x.name === artist.name || x.name.toLowerCase() === artist.name.toLowerCase(),
      ),
    );
    pushHit(results.artists, seen, {
      kind: "artist",
      title: artist.name,
      subtitle: artist.institution || artist.zone,
      href: searchHitHref(
        work
          ? `/editions/${current.years}/artworks/${work.id}`
          : `/editions/${current.years}/artists`,
        q,
      ),
      matchedSnippet: artist.name,
      editionYears: current.years,
      source: "entity",
      image: work?.image || work?.images?.[0],
    });
  }

  for (const venue of current.venues) {
    if (!matchesQuery(q, venue.searchText, venue.name, venue.address)) {
      continue;
    }
    pushHit(results.venues, seen, {
      kind: "venue",
      title: venue.name,
      subtitle: venue.address,
      href: searchHitHref(`/editions/${current.years}/venue/${venue.id}`, q),
      matchedSnippet: venue.name,
      editionYears: current.years,
      source: "entity",
      image: venue.image,
    });
  }

  // Credit tags: full index for sparse editions; team/institutions for the live catalogue.
  if (isSparseCatalogue(current)) {
    pushIndexHits(results, seen, q, current, false);
  } else {
    pushIndexHits(results, seen, q, current, false, new Set(["team", "institution", "venue"]));
  }

  for (const catalogue of all) {
    if (catalogue.years === current.years) continue;
    pushIndexHits(results, seen, q, catalogue, true);
  }

  return results;
}

export function hasSearchResults(results: EditionSearchResults): boolean {
  return (
    results.curators.length > 0 ||
    results.team.length > 0 ||
    results.artworks.length > 0 ||
    results.artists.length > 0 ||
    results.venues.length > 0 ||
    results.institutions.length > 0 ||
    results.previousEditions.length > 0
  );
}
