import { isSupabaseConfigured, supabase } from "../supabase";
import { preloadUrl } from "../preloadImages";
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

function preloadCmsImages(data: HomeCms) {
  for (const cover of data.covers) preloadUrl(cover.image_url);
  for (const card of data.cards) {
    if (card.image_url) preloadUrl(card.image_url);
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

const LOCAL_FALLBACK_HOME_CMS: HomeCms = {
  covers: [
    {
      id: "cover-1",
      image_url: "/home/hero.jpg",
      artwork_name: "Echoes of Silence",
      artist: "Ananya Sharma",
      institution: "Faculty of Fine Arts, MSU Baroda",
      show_artwork_name: true,
      show_artist: true,
      show_institution: true,
    },
    {
      id: "cover-2",
      image_url: "/home/sensing-wide.jpg",
      artwork_name: "Tide Lines & Salt Horizons",
      artist: "Rohan Varma",
      institution: "Government College of Fine Arts, Thrissur",
      show_artwork_name: true,
      show_artist: true,
      show_institution: true,
    },
    {
      id: "cover-3",
      image_url: "/home/sensing-side.jpg",
      artwork_name: "Urban Archeologies",
      artist: "Priyanka Sen",
      institution: "Kala Bhavana, Visva-Bharati, Santiniketan",
      show_artwork_name: true,
      show_artist: true,
      show_institution: true,
    },
  ],
  cards: [
    {
      id: "card-1",
      slot: 1,
      heading: "Students' Biennale 2025–26 Open Call",
      body: "Applications are now invited for the 7th edition of Students' Biennale across 7 historic venues in Fort Kochi and Mattancherry.",
      detail_body: "The 2025-26 edition invites emerging practitioners from art schools across the country to participate in an expansive curatorial framework.",
      image_url: "/home/press-featured.jpg",
      link_url: "/programmes",
      link_external: false,
      link_label: "Explore Programmes",
      link_target_kind: "programmes",
      link_target_id: "upcoming",
      card_type: "internal",
    },
    {
      id: "card-2",
      slot: 2,
      heading: "Raza-Students' Biennale Scholarship",
      body: "Two student artists selected for the reciprocal France–India exchange residency at Beaux-Arts de Marseille.",
      detail_body: "A two-phase exchange model building sustained dialogue between India and France in collaboration with the Raza Foundation.",
      image_url: "/home/thumb-awards.jpg",
      link_url: "/programmes/raza-scholarship",
      link_external: false,
      link_label: "View Scholars",
      link_target_kind: "programmes",
      link_target_id: "raza",
      card_type: "internal",
    },
    {
      id: "card-3",
      slot: 3,
      heading: "Critical Writing & Curation Workshops",
      body: "Upcoming series of intensive national workshops led by prominent educators and cultural theorists.",
      detail_body: "Hands-on workshops spanning Delhi, Jaipur, Goa, and Baroda focusing on experimental pedagogy and exhibition-making.",
      image_url: "/home/thumb-workshops.jpg",
      link_url: "/programmes/past-workshops",
      link_external: false,
      link_label: "View Workshops",
      link_target_kind: "programmes",
      link_target_id: "workshops",
      card_type: "internal",
    },
  ],
};

export function peekHomeCms(): HomeCms | null {
  return memory ?? readSession();
}

/** Fetch hero rows and start decoding every image immediately. */
export function loadHomeCms(): Promise<HomeCms> {
  const cached = peekHomeCms();
  if (cached && (cached.covers.length > 0 || cached.cards.length > 0)) {
    preloadCmsImages(cached);
  }

  if (!isSupabaseConfigured || !supabase) {
    memory = cached && (cached.covers.length > 0 || cached.cards.length > 0) ? cached : LOCAL_FALLBACK_HOME_CMS;
    preloadCmsImages(memory);
    return Promise.resolve(memory);
  }
  if (!inflight) {
    inflight = fetchHomeCms()
      .then((data) => {
        const finalData = data.covers.length > 0 || data.cards.length > 0 ? data : LOCAL_FALLBACK_HOME_CMS;
        memory = finalData;
        writeSession(finalData);
        preloadCmsImages(finalData);
        return finalData;
      })
      .catch(() => {
        if (cached) return cached;
        return LOCAL_FALLBACK_HOME_CMS;
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

void loadHomeCms();
