import {
  ARTISTS,
  ARTWORKS,
  CURATOR_ZONES,
  LATEST_EDITION,
  PREVIOUS_EDITIONS,
  VENUES,
  type ArtistCard,
  type ArtworkCard,
  type CuratorCard,
  type CuratorZone,
  type VenueCard,
} from "../../data/site";
import { getEditionSearchTags, searchIndexFromTags } from "../../data/editions";
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

const CURATOR_LOCAL: Record<string, { image: string; focus?: string }> = {
  savyasachi: { image: "/curators/savyasachi.png", focus: "center bottom" },
  sukanya: { image: "/curators/sukanya.png", focus: "center bottom" },
  gabaa: { image: "/curators/gabaa.png", focus: "center bottom" },
  seethal: { image: "/curators/seethal.png", focus: "center bottom" },
  sudheesh: { image: "/curators/sudheesh.png", focus: "center bottom" },
  anga: { image: "/curators/anga.png", focus: "center bottom" },
  secular: { image: "/curators/secular.png", focus: "center bottom" },
  ashok: { image: "/curators/ashok.png", focus: "center bottom" },
  chinar: { image: "/curators/chinar.png", focus: "center bottom" },
  salman: { image: "/curators/salman.png", focus: "center bottom" },
};

const VENUE_LOCAL: Record<string, { image?: string; images?: string[]; address?: string }> = {
  "st-andrews": {
    image: "/venues/st-andrews.jpg",
    images: ["/venues/st-andrews-hero.jpg", "/venues/st-andrews-2.jpg", "/venues/st-andrews-3.jpg"],
    address: "Elphinstone Road, Fort Kochi",
  },
  vkl: {
    image: "/venues/vkl.jpg",
    images: ["/venues/vkl.jpg"],
    address: "Fort Kochi, Kerala",
  },
  bms: {
    image: "/venues/bms.jpg",
    images: ["/venues/bms.jpg"],
    address: "Bazaar Road, Mattancherry",
  },
  arthshila: {
    image: "/venues/arthshila.jpg",
    images: ["/venues/arthshila.jpg"],
    address: "Fort Kochi, Kerala",
  },
  "david-hall": {
    image: "/venues/david-hall.jpg",
    images: ["/venues/david-hall.jpg"],
    address: "Parade Ground, Fort Kochi",
  },
  space: {
    image: "/venues/space.jpg",
    images: ["/venues/space.jpg"],
    address: "Fort Kochi, Kerala",
  },
};

function localCuratorImage(
  name: string,
  slug?: string | null,
): { image?: string; focus?: string } {
  const blob = `${slug ?? ""} ${name}`.toLowerCase();
  for (const [key, value] of Object.entries(CURATOR_LOCAL)) {
    if (blob.includes(key)) return value;
  }
  return {};
}

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

function localArtworkByTitle(title: string): ArtworkCard | undefined {
  const needle = title.trim().toLowerCase();
  return ARTWORKS.find(
    (row) =>
      row.title.toLowerCase() === needle ||
      needle.includes(row.title.toLowerCase()) ||
      row.title.toLowerCase().includes(needle),
  );
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

function mapCurator(person: SnapshotPerson, zone: SnapshotZone): CuratorCard {
  const local = localCuratorImage(person.name, person.slug);
  return {
    id: person.id,
    name: person.name,
    region: zone.label,
    note: person.individual_curatorial_note || zone.region || zone.label,
    bio: person.bio ?? undefined,
    image: person.cover_url || local.image,
    focus: local.focus,
  };
}

function mapZone(zone: SnapshotZone): CuratorZone {
  const assistants = zone.assistants.map((a) => a.name).filter(Boolean);
  const localZone = CURATOR_ZONES.find(
    (z) => z.id === zone.id || z.label.toLowerCase() === zone.label.toLowerCase(),
  );
  return {
    id: zone.id,
    label: zone.label,
    states: zone.region || localZone?.states || "",
    curators: zone.curators.map((person) => mapCurator(person, zone)),
    curatorialAssistant: assistants.length ? assistants.join(", ") : localZone?.curatorialAssistant,
    noteTitle: localZone?.noteTitle,
    noteBody: zone.common_curatorial_note ?? localZone?.noteBody,
  };
}

function mapArtwork(
  artwork: SnapshotArtwork,
  years: string,
  _zones: CuratorZone[],
  index: SearchIndexEntry[],
): ArtworkCard {
  const local = localArtworkByTitle(artwork.title);
  const materials = artwork.contributors
    .map((c) => c.materials)
    .filter((value): value is string => Boolean(value));
  const images = uniqueUrls(artwork.cover_url, artwork.gallery_urls, local?.image, local?.images);
  const image = images[0];
  return {
    id: artwork.id,
    slug: artwork.slug,
    title: artwork.title,
    venue: artwork.venue_name || local?.venue || "",
    year: displayYear(years),
    description: artwork.description || local?.description || "",
    artists: artwork.contributors.map((c) => ({
      name: c.display_name,
      institution: c.institution_name || "",
    })),
    materials:
      materials.length > 0
        ? materials
        : artwork.materials_summary
          ? [artwork.materials_summary]
          : local?.materials ?? [],
    dimensions: artwork.dimensions_summary || local?.dimensions || "",
    zoneId: artwork.zone_id ?? local?.zoneId,
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
): VenueCard {
  const key = venueLocalKey(venue.id, venue.name);
  const local = key ? VENUE_LOCAL[key] : undefined;
  const staticVenue = VENUES.find(
    (row) => row.name.toLowerCase() === venue.name.toLowerCase() || (key && row.id === key),
  );
  const images = uniqueUrls(
    venue.cover_url,
    venue.gallery_urls,
    local?.image,
    local?.images,
    staticVenue?.image,
    staticVenue?.images,
  );
  return {
    id: venue.id,
    name: venue.name,
    address: local?.address || staticVenue?.address || "",
    hours: staticVenue?.hours || "Open during exhibition hours",
    description: venue.history || staticVenue?.description || "",
    image: images[0],
    images,
    mapUrl: venue.map_url || staticVenue?.mapUrl,
    tourUrl: venue.virtual_tour_url || staticVenue?.tourUrl,
    searchText: taggedText(index, venue.id, venue.name, local?.address || staticVenue?.address, years),
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
  const venues = (payload.venues ?? []).map((venue) => mapVenue(venue, index, years));
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
    searchIndex: index,
    generatedAt: row.generated_at,
    source: "remote",
    teamBody: teamSection?.body ?? null,
  };
}

function withSearch(card: ArtworkCard): ArtworkCard {
  return {
    ...card,
    searchText: [card.title, card.venue, card.year, ...card.artists.map((a) => a.name)]
      .join(" ")
      .toLowerCase(),
  };
}

export function staticCurrentCatalogue(): MappedCatalogue {
  const zones = CURATOR_ZONES.map((z) => ({
    ...z,
    curators: z.curators.map((c) => ({
      ...c,
      searchText: [c.name, c.region, z.label].join(" ").toLowerCase(),
    })),
  }));
  const artworks = ARTWORKS.map(withSearch);
  const artists = ARTISTS.map((a) => ({
    ...a,
    searchText: [a.name, a.institution, a.zone].join(" ").toLowerCase(),
  }));
  const venues = VENUES.map((v) => ({
    ...v,
    searchText: [v.name, v.address].join(" ").toLowerCase(),
  }));
  return {
    editionId: `edition-${LATEST_EDITION.id}`,
    years: LATEST_EDITION.id,
    number: 6,
    title: "Sensing Grounds",
    slug: LATEST_EDITION.id,
    overview: null,
    overallCuratorialNote: null,
    isCurrent: true,
    heroUrl: null,
    heroUrls: [],
    galleryUrls: [],
    sections: [],
    zones,
    curators: zones.flatMap((z) => z.curators),
    artworks,
    artists,
    venues,
    institutions: [...new Set(ARTISTS.map((a) => a.institution))].sort((a, b) =>
      a.localeCompare(b),
    ),
    searchIndex: [],
    generatedAt: "static",
    source: "static",
    teamBody: null,
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
    searchIndex: [],
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
    searchIndex,
    generatedAt: "static",
    source: "static",
    teamBody: null,
  };
}

export function mergeCatalogues(remote: MappedCatalogue[]): MappedCatalogue[] {
  const byYears = new Map(remote.map((row) => [row.years, row]));
  const fallback = staticCurrentCatalogue();
  const current = byYears.get(LATEST_EDITION.id);
  if (!current || (current.artworks.length === 0 && current.zones.length === 0)) {
    byYears.set(LATEST_EDITION.id, fallback);
  }
  for (const [i, years] of PREVIOUS_EDITIONS.entries()) {
    const existing = byYears.get(years);
    if (!existing) {
      byYears.set(years, emptyEditionCatalogue(years, 5 - i));
      continue;
    }
    // Sparse remote packs: always merge tag-based search index for cross-edition search.
    if (existing.artworks.length === 0 && existing.zones.length === 0) {
      const seeded = emptyEditionCatalogue(years, existing.number || 5 - i);
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
        searchIndex: seeded.searchIndex.length ? seeded.searchIndex : existing.searchIndex,
      });
    }
  }
  return [...byYears.values()].sort((a, b) => b.number - a.number);
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