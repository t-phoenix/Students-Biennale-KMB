import type { SearchIndexEntry } from "./types";

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