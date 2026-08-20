import { isSupabaseConfigured, supabase } from "../supabase";
import type { HomeCms, HomeCover, HomeUpdateCard } from "./types";

const STORAGE_KEY = "sb-home-cms-v1";

let memory: HomeCms | null = null;
let inflight: Promise<HomeCms> | null = null;
const preloaded = new Set<string>();

function isCover(value: unknown): value is HomeCover {
  if (!value || typeof value !== "object") return false;
  const row = value as HomeCover;
  return typeof row.id === "string" && typeof row.image_url === "string";
}

function isCard(value: unknown): value is HomeUpdateCard {
  if (!value || typeof value !== "object") return false;
  const row = value as HomeUpdateCard;
  return typeof row.id === "string" && typeof row.heading === "string" && typeof row.body === "string";
}

function readSession(): HomeCms | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeCms;
    if (!parsed || !Array.isArray(parsed.covers) || !Array.isArray(parsed.cards)) return null;
    if (parsed.covers.length && !parsed.covers.every(isCover)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(data: HomeCms) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota or private mode — in-memory cache still applies.
  }
}

function preloadUrl(url: string) {
  if (!url || preloaded.has(url) || typeof Image === "undefined") return;
  preloaded.add(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  void img.decode?.().catch(() => {
    // decode() can reject for broken URLs; the <img> in the hero still loads.
  });
}

function preloadCmsImages(data: HomeCms) {
  for (const cover of data.covers) preloadUrl(cover.image_url);
}

async function fetchHomeCms(): Promise<HomeCms> {
  if (!supabase) return { covers: [], cards: [] };

  const [coversRes, cardsRes] = await Promise.all([
    supabase
      .from("home_covers")
      .select("id, image_url, artwork_name, artist, institution")
      .eq("active", true)
      .order("sort_order")
      .order("created_at"),
    supabase.from("update_cards").select("id, slot, heading, body, link_url, link_external, card_type").eq("active", true).order("slot"),
  ]);

  if (coversRes.error) throw coversRes.error;
  if (cardsRes.error) throw cardsRes.error;

  return {
    covers: (coversRes.data ?? []).filter(isCover),
    cards: (cardsRes.data ?? []).filter(isCard),
  };
}

export function peekHomeCms(): HomeCms | null {
  return memory ?? readSession();
}

/** Fetch hero rows and start decoding every image immediately. */
export function loadHomeCms(): Promise<HomeCms> {
  const cached = peekHomeCms();
  if (cached) preloadCmsImages(cached);

  if (!isSupabaseConfigured || !supabase) {
    memory = cached ?? { covers: [], cards: [] };
    return Promise.resolve(memory);
  }
  if (!inflight) {
    inflight = fetchHomeCms()
      .then((data) => {
        memory = data;
        writeSession(data);
        preloadCmsImages(data);
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

void loadHomeCms();
