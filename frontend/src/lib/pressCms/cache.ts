import { isSupabaseConfigured, supabase } from "../supabase";
import type { PressItem } from "./types";

const STORAGE_KEY = "sb-press-cms-v2";

let memory: PressItem[] | null = null;
let inflight: Promise<PressItem[]> | null = null;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isPressRow(value: unknown): value is PressItem {
  if (!value || typeof value !== "object") return false;
  const row = value as PressItem;
  return typeof row.id === "string" && typeof row.title === "string";
}

function readSession(): PressItem[] | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isPressRow)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(data: PressItem[]) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota or private mode */
  }
}

async function fetchPressImages(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!supabase || !ids.length) return out;

  const { data } = await supabase
    .from("asset_links")
    .select("entity_id, role, assets(public_url, storage_path, status, sort_order)")
    .eq("entity_type", "press_item")
    .in("entity_id", ids);

  for (const link of data ?? []) {
    const entityId = (link as { entity_id: string }).entity_id;
    const asset = (
      link as {
        assets?: {
          public_url: string | null;
          storage_path: string | null;
          status: string;
          sort_order: number;
        } | null;
      }
    ).assets;
    if (!asset || asset.status === "failed") continue;
    const url =
      asset.public_url ||
      (asset.storage_path?.startsWith("http") || asset.storage_path?.startsWith("/")
        ? asset.storage_path
        : null);
    if (!url || out.has(entityId)) continue;
    out.set(entityId, url);
  }

  return out;
}

async function fetchPressItems(): Promise<PressItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("press_items")
    .select("id, title, slug, excerpt, body, external_url, published_at")
    .eq("published", true)
    .order("sort_order")
    .order("published_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  const images = await fetchPressImages(rows.map((row) => row.id));

  return rows.map((row) => {
    const id = row.slug || row.id;
    const body = row.body?.trim() || undefined;
    const excerpt =
      row.excerpt?.trim() ||
      body?.split(/\n\s*\n/).map((part) => part.trim()).find(Boolean) ||
      "";
    return {
      id,
      title: row.title,
      date: formatDate(row.published_at),
      excerpt,
      body,
      url: row.external_url?.trim() || undefined,
      image: images.get(row.id),
    };
  });
}

export function peekPressItems(): PressItem[] | null {
  return memory ?? readSession();
}

export function loadPressItems(): Promise<PressItem[]> {
  const cached = peekPressItems();

  if (!isSupabaseConfigured || !supabase) {
    memory = cached ?? [];
    return Promise.resolve(memory);
  }

  if (!inflight) {
    inflight = fetchPressItems()
      .then((data) => {
        memory = data;
        writeSession(data);
        return data;
      })
      .catch((err) => {
        if (cached) return cached;
        throw err;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Force a fresh fetch (e.g. after CMS visibility edits). */
export async function refreshPressItems(): Promise<PressItem[]> {
  memory = null;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  inflight = null;
  return loadPressItems();
}

void loadPressItems();
