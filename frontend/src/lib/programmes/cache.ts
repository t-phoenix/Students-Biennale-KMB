import { isSupabaseConfigured, supabase } from "../supabase";
import { FALLBACK_PROGRAMMES } from "./fallbacks";
import { mapProgrammes } from "./mappers";
import type { MappedProgrammes, ProgrammeAsset, ProgrammeRow } from "./types";

const STORAGE_KEY = "sb-programmes-v2";
const PROGRAMME_SELECT =
  "id, subtype, state, title, slug, summary, body, dates, place, sort_order, published, programme_facilitators(display_name, sort_order)";

let memory: MappedProgrammes | null = null;
let inflight: Promise<MappedProgrammes> | null = null;

function isProgrammeRow(value: unknown): value is ProgrammeRow {
  if (!value || typeof value !== "object") return false;
  const row = value as ProgrammeRow;
  return typeof row.id === "string" && typeof row.slug === "string" && typeof row.subtype === "string";
}

function readSession(): MappedProgrammes | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MappedProgrammes;
    if (!parsed || !Array.isArray(parsed.pastWorkshops)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(data: MappedProgrammes) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota or private mode — in-memory cache still applies.
  }
}

async function fetchAssets(): Promise<ProgrammeAsset[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("asset_links")
    .select("entity_id, role, assets(public_url, storage_path, variant, sort_order, status)")
    .eq("entity_type", "programme");
  if (error) return [];

  const out: ProgrammeAsset[] = [];
  for (const link of data ?? []) {
    const asset = (link as {
      assets?: {
        public_url: string | null;
        storage_path: string | null;
        variant: string;
        sort_order: number;
        status: string;
      } | null;
    }).assets;
    if (!asset || asset.status === "failed") continue;
    const url =
      asset.public_url ||
      (asset.storage_path?.startsWith("http") || asset.storage_path?.startsWith("/")
        ? asset.storage_path
        : null);
    if (!url) continue;
    out.push({
      entityId: (link as { entity_id: string }).entity_id,
      role: (link as { role: string }).role,
      url,
      sortOrder: asset.sort_order ?? 0,
    });
  }
  return out;
}

async function fetchRows(): Promise<ProgrammeRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("programmes").select(PROGRAMME_SELECT).eq("published", true);
  if (error) throw error;
  return (data ?? []).filter(isProgrammeRow);
}

async function fetchMapped(): Promise<MappedProgrammes> {
  const [rows, assets] = await Promise.all([fetchRows(), fetchAssets()]);
  if (!rows.length) return FALLBACK_PROGRAMMES;
  return mapProgrammes(rows, assets);
}

export function peekProgrammes(): MappedProgrammes | null {
  if (memory) return memory;
  const cached = readSession();
  if (cached) memory = cached;
  return cached;
}

export async function loadProgrammes(): Promise<MappedProgrammes> {
  if (memory) return memory;
  const cached = readSession();
  if (cached) {
    memory = cached;
    return cached;
  }
  if (inflight) return inflight;
  if (!isSupabaseConfigured || !supabase) {
    memory = FALLBACK_PROGRAMMES;
    return memory;
  }
  inflight = fetchMapped()
    .then((mapped) => {
      writeSession(mapped);
      memory = mapped;
      inflight = null;
      return mapped;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

/** Re-fetch so CMS edits show up in the same tab after a navigation. */
export async function refreshProgrammes(): Promise<MappedProgrammes> {
  if (!isSupabaseConfigured || !supabase) {
    memory = peekProgrammes() ?? FALLBACK_PROGRAMMES;
    return memory;
  }
  const mapped = await fetchMapped();
  writeSession(mapped);
  memory = mapped;
  return mapped;
}
