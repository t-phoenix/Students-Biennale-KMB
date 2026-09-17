import { isSupabaseConfigured, supabase } from "../supabase";
import { preloadUrl, preloadUrlsConcurrent, whenIdle } from "../preloadImages";
import type { HomeCms, HomeCover, HomeUpdateCard } from "./types";

const STORAGE_KEY = "sb-home-cms-v3";

let memory: HomeCms | null = null;
let inflight: Promise<HomeCms> | null = null;

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

/** Preload the LCP hero immediately; secondary covers/cards follow without long idle delay. */
function preloadCmsImages(data: HomeCms) {
  const [primary, ...rest] = data.covers;
  if (primary?.image_url) void preloadUrl(primary.image_url, "high");

  const secondary = [
    ...rest.map((cover) => cover.image_url),
    ...data.cards.map((card) => card.image_url).filter((url): url is string => Boolean(url)),
  ];
  if (secondary.length) {
    // Start secondary warms promptly — splash (when present) also awaits these.
    whenIdle(() => {
      void preloadUrlsConcurrent(secondary, "low", 3);
    }, 400);
  }
}

async function fetchHomeCms(): Promise<HomeCms> {
  if (!supabase) return { covers: [], cards: [] };

  const [coversRes, cardsRes] = await Promise.all([
    supabase
      .from("home_covers")
      .select(
        "id, image_url, artwork_name, artist, institution, show_artwork_name, show_artist, show_institution",
      )
      .eq("active", true)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("update_cards")
      .select(
        "id, slot, heading, body, detail_body, image_url, link_url, link_external, link_label, link_target_kind, link_target_id, card_type",
      )
      .eq("active", true)
      .order("slot"),
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

/** Fetch hero rows. Images come only from CMS / Storage — no local image pack. */
export function loadHomeCms(): Promise<HomeCms> {
  const cached = peekHomeCms();
  if (cached && (cached.covers.length > 0 || cached.cards.length > 0)) {
    preloadCmsImages(cached);
  }

  if (!isSupabaseConfigured || !supabase) {
    memory = cached ?? { covers: [], cards: [] };
    if (memory.covers.length || memory.cards.length) preloadCmsImages(memory);
    return Promise.resolve(memory);
  }
  if (!inflight) {
    inflight = fetchHomeCms()
      .then((data) => {
        memory = data;
        writeSession(data);
        if (data.covers.length || data.cards.length) preloadCmsImages(data);
        return data;
      })
      .catch(() => {
        if (cached) return cached;
        return { covers: [], cards: [] };
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}



/** Force a fresh fetch (e.g. after CMS visibility edits). */
export async function refreshHomeCms(): Promise<HomeCms> {
  memory = null;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  inflight = null;
  return loadHomeCms();
}
