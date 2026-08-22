import type { MappedCatalogue, SearchIndexEntry } from "./types";

/** Client-side tagged filter. Does not call Postgres. */
export function matchesQuery(query: string, ...parts: Array<string | null | undefined>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((part) => (part ?? "").toLowerCase().includes(q));
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

/** Split text into segments for `<mark>` rendering. Case-insensitive. */
export function highlightSegments(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  const q = query.trim();
  if (!q || !text) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: Array<{ text: string; match: boolean }> = [];
  let start = 0;
  let idx = lower.indexOf(needle, start);
  while (idx !== -1) {
    if (idx > start) parts.push({ text: text.slice(start, idx), match: false });
    parts.push({ text: text.slice(idx, idx + needle.length), match: true });
    start = idx + needle.length;
    idx = lower.indexOf(needle, start);
  }
  if (start < text.length) parts.push({ text: text.slice(start), match: false });
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
      if (typeof value === "string" && value.toLowerCase().includes(q)) {
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

export type SearchHitKind = "curator" | "artwork" | "artist" | "venue" | "previous-edition";

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
  artworks: SearchHit[];
  artists: SearchHit[];
  venues: SearchHit[];
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

  if (entry.entity_type === "person" && entry.field_curator) {
    return { kind: "curator", ...base };
  }
  if (entry.entity_type === "person" && entry.field_artist) {
    return { kind: "artist", ...base };
  }
  if (entry.entity_type === "venue" || entry.field_venue) {
    return { kind: "venue", ...base };
  }
  if (entry.entity_type === "artwork") {
    return { kind: "artwork", ...base };
  }
  if (entry.entity_type === "institution" || entry.field_institution) {
    return {
      kind: "artist",
      title: entry.title,
      subtitle: entry.subtitle ?? `Institution · ${editionYears.replace("-", "–")}`,
      href,
      matchedSnippet,
      editionYears,
      source: "previous-meta",
      image,
    };
  }
  if (entry.field_curator) return { kind: "curator", ...base };
  if (entry.field_artist) return { kind: "artist", ...base };
  if (entry.field_venue) return { kind: "venue", ...base };
  return null;
}

function pushIndexHits(
  results: EditionSearchResults,
  seen: Set<string>,
  query: string,
  catalogue: Pick<MappedCatalogue, "years" | "heroUrl" | "heroUrls" | "searchIndex" | "title" | "institutions">,
  asPreviousSection: boolean,
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
    if (searchHit.kind === "previous-edition") {
      pushHit(results.previousEditions, seen, searchHit);
      continue;
    }
    const bucket = results[`${searchHit.kind}s` as keyof Pick<
      EditionSearchResults,
      "curators" | "artworks" | "artists" | "venues"
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
    artworks: [],
    artists: [],
    venues: [],
    previousEditions: [],
  };
  if (!q) return empty;

  const seen = new Set<string>();
  const results = { ...empty, curators: [], artworks: [], artists: [], venues: [], previousEditions: [] };

  for (const curator of current.curators) {
    const zone = current.zones.find((z) => z.curators.some((c) => c.id === curator.id));
    if (
      !matchesQuery(q, curator.searchText, curator.name, curator.region, zone?.label, zone?.states)
    ) {
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
    if (
      !matchesQuery(
        q,
        artwork.searchText,
        artwork.title,
        artwork.venue,
        artwork.year,
        ...artwork.artists.map((x) => x.name),
        ...artwork.artists.map((x) => x.institution),
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

  if (isSparseCatalogue(current)) {
    pushIndexHits(results, seen, q, current, false);
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
    results.artworks.length > 0 ||
    results.artists.length > 0 ||
    results.venues.length > 0 ||
    results.previousEditions.length > 0
  );
}
