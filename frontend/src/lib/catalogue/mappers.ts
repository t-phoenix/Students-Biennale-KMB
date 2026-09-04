import {
  LATEST_EDITION,
  PREVIOUS_EDITIONS,
  type ArtistCard,
  type ArtworkCard,
  type CuratorCard,
  type CuratorZone,
  type VenueCard,
} from "../../data/site";
import { getEditionSearchTags, mergeTagSearchIndex, searchIndexFromTags } from "../../data/editions";
import { taggedText } from "./search";
import type {
  MappedCatalogue,
  SearchIndexEntry,
  SnapshotArtwork,
  SnapshotPayload,
  SnapshotPerson,
  SnapshotRow,
  SnapshotSection,
  SnapshotVenue,
  SnapshotZone,
} from "./types";

function uniqueUrls(...values: Array<string | string[] | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    for (const url of list) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

function venueLocalKey(id: string, name: string): string | undefined {
  const blob = `${id} ${name}`.toLowerCase();
  if (blob.includes("st-andrew") || blob.includes("parish")) return "st-andrews";
  if (blob.includes("vkl")) return "vkl";
  if (blob.includes("bms") || blob.includes("bright")) return "bms";
  if (blob.includes("arthshila")) return "arthshila";
  if (blob.includes("david")) return "david-hall";
  if (blob.includes("space")) return "space";
  return undefined;
}

function displayYear(years: string): string {
  return years.replace("-", " – ");
}

/** Split "Title\\n\\nBody" (and optional "Curated by …" line) from catalogue notes. */
function parseCuratorialNote(raw: string | null | undefined): {
  title?: string;
  attribution?: string;
  body?: string;
} {
  const text = (raw ?? "").trim();
  if (!text) return {};
  const parts = text.split(/\n\s*\n/);
  if (parts.length === 1) return { body: parts[0].trim() };
  const head = parts[0].trim();
  const body = parts.slice(1).join("\n\n").trim();
  const lines = head.split("\n").map((l) => l.trim()).filter(Boolean);
  let title = lines[0];
  let attribution: string | undefined;
  if (lines[1]?.toLowerCase().startsWith("curated by")) {
    attribution = lines[1];
  } else {
    const mashed = title.match(/^(Conditions of Practice)\s+(Curated by .+)$/i);
    if (mashed) {
      title = mashed[1];
      attribution = mashed[2];
    }
  }
  return { title, attribution, body: body || undefined };
}

/** Ignore Zone 7's "for now" note when it was pasted into another zone's common field. */
function isLeakedForNowNote(zoneNumber: number, raw: string | null | undefined): boolean {
  if (zoneNumber === 7) return false;
  return Boolean(raw?.trim().toLowerCase().startsWith("for now"));
}

function mapCurator(person: SnapshotPerson, zone: SnapshotZone): CuratorCard {
  const parsed = parseCuratorialNote(person.individual_curatorial_note);
  return {
    id: person.id,
    name: person.name,
    region: zone.label,
    note: zone.region || zone.label,
    bio: person.bio ?? undefined,
    image: person.cover_url || undefined,
    noteTitle: parsed.title,
    noteAttribution: parsed.attribution,
    noteBody: parsed.body,
  };
}

function mapZone(zone: SnapshotZone): CuratorZone {
  const assistants = zone.assistants.map((a) => a.name).filter(Boolean);
  const raw = zone.common_curatorial_note;
  const usable = raw && !isLeakedForNowNote(zone.number, raw) ? raw : null;
  const parsed = parseCuratorialNote(usable);
  return {
    id: zone.id,
    label: zone.label,
    states: zone.region || "",
    curators: zone.curators.map((person) => mapCurator(person, zone)),
    curatorialAssistant: assistants.length ? assistants.join(", ") : undefined,
    noteTitle: parsed.title,
    noteBody: parsed.body,
  };
}

function mapArtwork(
  artwork: SnapshotArtwork,
  years: string,
  _zones: CuratorZone[],
  index: SearchIndexEntry[],
): ArtworkCard {
  const materials = artwork.contributors
    .map((c) => c.materials)
    .filter((value): value is string => Boolean(value));
  const images = uniqueUrls(artwork.cover_url, artwork.gallery_urls);
  const image = images[0];
  return {
    id: artwork.id,
    slug: artwork.slug,
    title: artwork.title,
    venue: artwork.venue_name || "",
    year: displayYear(years),
    description: artwork.description || "",
    artists: artwork.contributors.map((c) => ({
      name: c.display_name,
      institution: c.institution_name || "",
    })),
    materials:
      materials.length > 0
        ? materials
        : artwork.materials_summary
          ? [artwork.materials_summary]
          : [],
    dimensions: artwork.dimensions_summary || "",
    zoneId: artwork.zone_id ?? undefined,
    image,
    images,
    imageWidth: artwork.cover_width ?? undefined,
    imageHeight: artwork.cover_height ?? undefined,
    searchText: taggedText(
      index,
      artwork.id,
      artwork.title,
      artwork.venue_name,
      artwork.slug,
      years,
      ...artwork.contributors.map((c) => c.display_name),
    ),
  };
}

function mapVenue(
  venue: SnapshotVenue,
  index: SearchIndexEntry[],
  years?: string,
  extraImages: string[] = [],
): VenueCard {
  const key = venueLocalKey(venue.id, venue.name);
  let cover = venue.cover_url;
  let gallery = [...(venue.gallery_urls ?? [])];
  // Mislabelled St. Andrews cover in snapshot (jos9237 is a VKL photograph).
  if (key === "st-andrews" && cover && /jos9237/i.test(cover)) {
    const replacement = gallery.find((url) => !/jos9237/i.test(url));
    if (replacement) {
      gallery = gallery.filter((url) => url !== replacement);
      cover = replacement;
    } else {
      cover = undefined;
    }
  }
  if (key === "st-andrews") {
    gallery = gallery.filter((url) => !/jos9237/i.test(url));
  }
  const images = uniqueUrls(cover, gallery, extraImages);
  return {
    id: venue.id,
    name: venue.name,
    address: "",
    hours: "Open during exhibition hours",
    description: venue.history || "",
    image: images[0],
    images,
    mapUrl: venue.map_url || undefined,
    tourUrl: venue.virtual_tour_url || undefined,
    searchText: taggedText(index, venue.id, venue.name, years),
  };
}

export function mapSnapshot(row: SnapshotRow): MappedCatalogue {
  const payload = row.payload;
  const years = payload.edition.years;
  const index = row.search_index ?? [];
  const zones = (payload.zones ?? []).map(mapZone);
  const artworks = (payload.artworks ?? []).map((artwork) =>
    mapArtwork(artwork, years, zones, index),
  );
  const artists: ArtistCard[] = (payload.artists ?? []).map((artist) => ({
    id: artist.id,
    name: artist.name,
    institution: artist.institution || "",
    zone: artist.zone_label || "",
    // Artist search is scoped to artist-owned fields only. Related artwork
    // titles/venues stay searchable under Artworks / Venues, not Artists.
    searchText: taggedText(
      index,
      artist.id,
      artist.name,
      artist.institution,
      artist.zone_label,
      years,
    ),
  }));
  const venuesRaw = payload.venues ?? [];
  const jos9237FromStAndrews = venuesRaw
    .filter((v) => venueLocalKey(v.id, v.name) === "st-andrews")
    .flatMap((v) => uniqueUrls(v.cover_url, v.gallery_urls))
    .filter((url) => /jos9237/i.test(url));
  const venues = venuesRaw.map((venue) =>
    mapVenue(
      venue,
      index,
      years,
      venueLocalKey(venue.id, venue.name) === "vkl" ? jos9237FromStAndrews : [],
    ),
  );
  const institutions = [
    ...new Set(artists.map((a) => a.institution).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const teamSection = (payload.sections ?? []).find((s) => s.section_key === "team");

  const curators = zones.flatMap((z) =>
    z.curators.map((c) => ({
      ...c,
      // Name + zone label only — do not index geographic state lists (or index
      // blobs that embed them), or queries like "raja" match "Rajasthan".
      searchText: [c.name, c.region, z.label, years].filter(Boolean).join(" ").toLowerCase(),
    })),
  );

  return {
    editionId: payload.edition.id,
    years,
    number: payload.edition.number,
    title: payload.edition.title || "Students' Biennale",
    slug: payload.edition.slug,
    overview: payload.edition.overview ?? null,
    overallCuratorialNote: payload.edition.overall_curatorial_note ?? null,
    isCurrent: payload.edition.is_current,
    heroUrl: payload.edition.hero_url ?? null,
    heroUrls: (() => {
      const fromList = payload.edition.hero_urls ?? [];
      if (fromList.length) return fromList;
      const single = payload.edition.hero_url;
      return single ? [single] : [];
    })(),
    galleryUrls: payload.edition.gallery_urls ?? [],
    sections: payload.sections ?? [],
    zones: zones.map((z) => ({
      ...z,
      curators: z.curators.map((c) => curators.find((x) => x.id === c.id) ?? c),
    })),
    curators,
    artworks,
    artists,
    venues,
    institutions,
    searchIndex: mergeTagSearchIndex({
      years,
      searchIndex: index,
      venues,
      institutions,
    }),
    generatedAt: row.generated_at,
    source: "remote",
    teamBody: teamSection?.body ?? null,
  };
}

export function mapLiveEdition(
  edition: {
    id: string;
    years: string;
    number: number;
    title: string | null;
    slug: string;
    overview: string | null;
    overall_curatorial_note: string | null;
    is_current: boolean;
  },
  sections: SnapshotSection[],
): MappedCatalogue {
  const teamSection = sections.find((s) => s.section_key === "team");
  return {
    editionId: edition.id,
    years: edition.years,
    number: edition.number,
    title: edition.title || "Students' Biennale",
    slug: edition.slug,
    overview: edition.overview ?? null,
    overallCuratorialNote: edition.overall_curatorial_note ?? null,
    isCurrent: edition.is_current,
    heroUrl: null,
    heroUrls: [],
    galleryUrls: [],
    sections,
    zones: [],
    curators: [],
    artworks: [],
    artists: [],
    venues: [],
    institutions: [],
    searchIndex: mergeTagSearchIndex({
      years: edition.years,
      searchIndex: [],
      institutions: [],
    }),
    generatedAt: "live-edition",
    source: "remote",
    teamBody: teamSection?.body ?? null,
  };
}

export function emptyEditionCatalogue(years: string, number: number): MappedCatalogue {
  const tags = getEditionSearchTags(years);
  const searchIndex = searchIndexFromTags(years, tags);
  const staticHero = years === "2014-15" ? "/editions/2014-15/hero.jpg" : null;
  return {
    editionId: `edition-${years}`,
    years,
    number,
    title: tags.title || "Students' Biennale",
    slug: years,
    overview: null,
    overallCuratorialNote: null,
    isCurrent: years === LATEST_EDITION.id,
    heroUrl: staticHero,
    heroUrls: staticHero ? [staticHero] : [],
    galleryUrls: [],
    sections: [],
    zones: [],
    curators: [],
    artworks: [],
    artists: [],
    venues: [],
    institutions: tags.institutions,
    searchIndex: mergeTagSearchIndex({
      years,
      searchIndex,
      institutions: tags.institutions,
    }),
    generatedAt: "static",
    source: "static",
    teamBody: null,
  };
}

export function mergeCatalogues(remote: MappedCatalogue[]): MappedCatalogue[] {
  const byYears = new Map(remote.map((row) => [row.years, row]));
  // Current edition comes only from Supabase snapshots — no local catalogue swap.
  if (!byYears.has(LATEST_EDITION.id)) {
    byYears.set(LATEST_EDITION.id, emptyEditionCatalogue(LATEST_EDITION.id, 6));
  }
  for (const [i, years] of PREVIOUS_EDITIONS.entries()) {
    const existing = byYears.get(years);
    const seeded = emptyEditionCatalogue(years, existing?.number || 5 - i);
    if (!existing) {
      byYears.set(years, seeded);
      continue;
    }
    // Prefer tag-based search index for sparse previous editions (snapshot index is often empty).
    const searchIndex =
      existing.searchIndex.length && (existing.artworks.length > 0 || existing.zones.length > 0)
        ? existing.searchIndex
        : seeded.searchIndex.length
          ? seeded.searchIndex
          : existing.searchIndex;
    if (existing.artworks.length === 0 && existing.zones.length === 0) {
      const heroUrls =
        existing.heroUrls.length > 0
          ? existing.heroUrls
          : seeded.heroUrls.length
            ? seeded.heroUrls
            : existing.heroUrl
              ? [existing.heroUrl]
              : [];
      byYears.set(years, {
        ...existing,
        title: existing.title || seeded.title,
        heroUrl: existing.heroUrl || seeded.heroUrl || heroUrls[0] || null,
        heroUrls,
        institutions: existing.institutions.length ? existing.institutions : seeded.institutions,
        searchIndex,
      });
      continue;
    }
    if (searchIndex !== existing.searchIndex) {
      byYears.set(years, { ...existing, searchIndex });
    }
  }
  return [...byYears.values()]
    .map((row) => ({
      ...row,
      searchIndex: mergeTagSearchIndex(row),
    }))
    .sort((a, b) => b.number - a.number);
}

export function findCard<T extends { id: string; slug?: string }>(
  items: T[],
  id: string,
): T | undefined {
  return items.find(
    (item) => item.id === id || item.slug === id || item.id.endsWith(`-${id}`),
  );
}

export function curatorsForArtworkIn(
  artwork: ArtworkCard,
  zones: CuratorZone[],
): CuratorCard[] {
  if (!artwork.zoneId) return [];
  return zones.find((z) => z.id === artwork.zoneId)?.curators ?? [];
}

export function artworksForZoneIn(artworks: ArtworkCard[], zoneId: string): ArtworkCard[] {
  return artworks.filter((a) => a.zoneId === zoneId);
}

export type { SnapshotPayload };