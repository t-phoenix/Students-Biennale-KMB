import { isSupabaseConfigured, supabase } from "../supabase";
import { EMPTY_PROGRAMMES } from "./fallbacks";
import { mapProgrammes } from "./mappers";
import type { AwardWinnerRow, MappedProgrammes, ProgrammeAsset, ProgrammeRow } from "./types";

const STORAGE_KEY = "sb-programmes-v11";
const PROGRAMME_SELECT =
  "id, subtype, state, title, slug, summary, body, dates, place, host, awardees, sort_order, published, programme_facilitators(display_name, sort_order)";

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

async function fetchAwardWinners(): Promise<AwardWinnerRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("award_winners")
    .select(
      "id, programme_id, artwork_id, sort_order, active, artworks(title), award_winner_artists(person_id, sort_order, people(name))",
    )
    .eq("active", true)
    .order("sort_order");
  if (error) return [];

  const artworkIds = [...new Set((data ?? []).map((row) => row.artwork_id).filter(Boolean))];
  const institutionByKey = new Map<string, string>();
  if (artworkIds.length) {
    const { data: contributors } = await supabase
      .from("artwork_contributors")
      .select("artwork_id, person_id, institution_name, display_name")
      .in("artwork_id", artworkIds);
    for (const row of contributors ?? []) {
      if (row.person_id && row.institution_name) {
        institutionByKey.set(`${row.artwork_id}:${row.person_id}`, row.institution_name);
      }
    }
  }

  return (data ?? []).map((row) => {
    const artworksRel = (row as { artworks?: { title: string } | { title: string }[] | null }).artworks;
    const artworkTitle = Array.isArray(artworksRel)
      ? artworksRel[0]?.title ?? null
      : artworksRel?.title ?? null;

    const artists = (
      (
        row as {
          award_winner_artists?: {
            person_id: string;
            sort_order: number;
            people?: { name: string } | { name: string }[] | null;
          }[];
        }
      ).award_winner_artists ?? []
    )
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((artist) => {
        const peopleRel = artist.people;
        const name = Array.isArray(peopleRel)
          ? peopleRel[0]?.name ?? ""
          : peopleRel?.name ?? "";
        return {
          person_id: artist.person_id,
          name,
          institution: institutionByKey.get(`${row.artwork_id}:${artist.person_id}`) ?? null,
          sort_order: artist.sort_order,
        };
      });

    return {
      id: row.id,
      programme_id: row.programme_id,
      artwork_id: row.artwork_id,
      artwork_title: artworkTitle,
      sort_order: row.sort_order,
      active: row.active,
      artists,
    };
  });
}

async function fetchMapped(): Promise<MappedProgrammes> {
  const [rows, assets, awardWinners] = await Promise.all([
    fetchRows(),
    fetchAssets(),
    fetchAwardWinners(),
  ]);
  if (!rows.length) return EMPTY_PROGRAMMES;
  return mapProgrammes(rows, assets, awardWinners);
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
    memory = EMPTY_PROGRAMMES;
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
    memory = peekProgrammes() ?? EMPTY_PROGRAMMES;
    return memory;
  }
  const mapped = await fetchMapped();
  writeSession(mapped);
  memory = mapped;
  return mapped;
}
