import { isSupabaseConfigured, supabase } from "../supabase";
import type { Json } from "../database.types";
import { mapLiveEdition, mapSnapshot, mergeCatalogues } from "./mappers";
import type { MappedCatalogue, SearchIndexEntry, SnapshotPayload, SnapshotRow, SnapshotSection } from "./types";

const STORAGE_KEY = "sb-catalogue-v8";
const SELECT_FULL = "edition_id, payload, search_index, generated_at";
const SELECT_META = "edition_id, generated_at";

let memory: MappedCatalogue[] | null = null;

function isPayload(value: Json): value is Json & SnapshotPayload {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && "edition" in value);
}

function parseIndex(value: Json): SearchIndexEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is SearchIndexEntry => Boolean(row && typeof row === "object"));
}

function parseRows(
  rows: Array<{
    edition_id: string;
    payload: Json;
    search_index: Json;
    generated_at: string;
  }>,
): SnapshotRow[] {
  return rows.flatMap((row) => {
    if (!isPayload(row.payload)) return [];
    return [
      {
        edition_id: row.edition_id,
        payload: row.payload as SnapshotPayload,
        search_index: parseIndex(row.search_index),
        generated_at: row.generated_at,
      },
    ];
  });
}

function readSession(): MappedCatalogue[] | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SnapshotRow[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return mergeCatalogues(parsed.map(mapSnapshot));
  } catch {
    return null;
  }
}

function writeSession(rows: SnapshotRow[]) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Quota or private mode — in-memory cache still applies.
  }
}

async function fetchRows(): Promise<SnapshotRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("catalogue_snapshots").select(SELECT_FULL);
  if (error) throw error;
  return parseRows(data ?? []);
}

/** When a snapshot pack is missing, read overview/team from the live tables. */
async function fetchLiveEditions(haveYears: Set<string>): Promise<MappedCatalogue[]> {
  if (!supabase) return [];
  const { data: editions, error } = await supabase
    .from("editions")
    .select("id, years, number, title, slug, overview, overall_curatorial_note, is_current, published")
    .eq("published", true);
  if (error) throw error;
  const missing = (editions ?? []).filter((row) => !haveYears.has(row.years));
  if (!missing.length) return [];
  const { data: sections, error: sectionError } = await supabase
    .from("edition_sections")
    .select("id, edition_id, section_key, title, body, sort_order");
  if (sectionError) throw sectionError;
  const byEdition = new Map<string, SnapshotSection[]>();
  for (const row of sections ?? []) {
    const list = byEdition.get(row.edition_id) ?? [];
    list.push({
      id: row.id,
      section_key: row.section_key,
      title: row.title,
      body: row.body,
      sort_order: row.sort_order,
      items: [],
    });
    byEdition.set(row.edition_id, list);
  }
  return missing.map((edition) => mapLiveEdition(edition, byEdition.get(edition.id) ?? []));
}

async function assembleCatalogues(rows: SnapshotRow[]): Promise<MappedCatalogue[]> {
  const mapped = rows.map(mapSnapshot);
  const live = await fetchLiveEditions(new Set(mapped.map((row) => row.years)));
  return mergeCatalogues([...mapped, ...live]);
}

export function peekCatalogues(): MappedCatalogue[] | null {
  if (memory) return memory;
  const cached = readSession();
  if (cached) memory = cached;
  return cached;
}

export async function loadCatalogues(): Promise<MappedCatalogue[]> {
  if (memory) return memory;
  const cached = readSession();
  if (cached) {
    memory = cached;
    return cached;
  }
  if (!isSupabaseConfigured || !supabase) {
    memory = mergeCatalogues([]);
    return memory;
  }
  const rows = await fetchRows();
  writeSession(rows);
  memory = await assembleCatalogues(rows);
  return memory;
}

/** One cheap metadata check per tab. Refetches packs only if import changed. */
export async function refreshCataloguesIfStale(): Promise<MappedCatalogue[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const cached = readSession();
  const { data, error } = await supabase.from("catalogue_snapshots").select(SELECT_META);
  if (error) throw error;
  const remote = data ?? [];
  const cachedStamp = new Map(
    (cached ?? []).filter((row) => row.source === "remote").map((row) => [row.editionId, row.generatedAt]),
  );
  const stale =
    remote.length !== cachedStamp.size ||
    remote.some((row) => cachedStamp.get(row.edition_id) !== row.generated_at);
  if (!stale && cached && remote.length) return null;
  const rows = await fetchRows();
  writeSession(rows);
  memory = await assembleCatalogues(rows);
  return memory;
}
