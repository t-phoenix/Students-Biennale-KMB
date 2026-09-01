import { preloadUrl } from "../preloadImages";
import { isSupabaseConfigured, supabase } from "../supabase";
import { resolveHomeProgrammesBanner, resolveProgrammesHeroCovers } from "./resolve";
import type { ProgrammesCover } from "./types";

const STORAGE_KEY = "sb-programmes-cms-v1";

let memory: ProgrammesCover[] | null = null;
let inflight: Promise<ProgrammesCover[]> | null = null;

function isCover(value: unknown): value is ProgrammesCover {
  if (!value || typeof value !== "object") return false;
  const row = value as ProgrammesCover;
  return typeof row.id === "string" && typeof row.image_url === "string";
}

function readSession(): ProgrammesCover[] | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every(isCover)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(data: ProgrammesCover[]) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota or private mode — in-memory cache still applies.
  }
}

function preloadCoverImages(covers: ProgrammesCover[]) {
  for (const cover of covers) preloadUrl(cover.image_url);
}

async function fetchProgrammesCovers(): Promise<ProgrammesCover[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("programmes_covers")
    .select("id, image_url, sort_order, show_on_home")
    .eq("active", true)
    .order("sort_order")
    .order("created_at");

  if (error) throw error;
  return (data ?? []).filter(isCover);
}

export function peekProgrammesCovers(): ProgrammesCover[] | null {
  return memory ?? readSession();
}

export function peekHomeProgrammesBannerUrl(): string | null {
  const covers = peekProgrammesCovers() ?? [];
  return resolveHomeProgrammesBanner(covers);
}

export function peekProgrammesHeroCovers(): ProgrammesCover[] {
  const covers = peekProgrammesCovers() ?? [];
  return resolveProgrammesHeroCovers(covers);
}

/** Fetch carousel rows and start decoding images immediately. */
export function loadProgrammesCovers(): Promise<ProgrammesCover[]> {
  const cached = peekProgrammesCovers();
  if (cached) preloadCoverImages(cached);

  if (!isSupabaseConfigured || !supabase) {
    memory = cached ?? [];
    return Promise.resolve(memory);
  }

  if (!inflight) {
    inflight = fetchProgrammesCovers()
      .then((data) => {
        memory = data;
        writeSession(data);
        preloadCoverImages(data);
        return data;
      })
      .catch((err) => {
        if (cached) return cached;
        console.warn("[programmesCms] fetch failed, using static fallbacks", err);
        memory = [];
        return [];
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Force a fresh fetch (e.g. after CMS edits). */
export async function refreshProgrammesCovers(): Promise<ProgrammesCover[]> {
  memory = null;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  inflight = null;
  return loadProgrammesCovers();
}

void loadProgrammesCovers();
