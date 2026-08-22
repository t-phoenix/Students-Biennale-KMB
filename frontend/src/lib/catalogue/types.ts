import type {
  ArtistCard,
  ArtworkCard,
  CuratorCard,
  CuratorZone,
  VenueCard,
} from "../../data/site";

export type SearchIndexEntry = {
  entity_type: string;
  entity_id: string;
  title: string;
  route: string;
  subtitle?: string;
  field_title?: string;
  field_artist?: string;
  field_curator?: string;
  field_venue?: string;
  field_zone?: string;
  field_institution?: string;
  field_edition?: string;
};

export type SnapshotPerson = {
  id: string;
  name: string;
  slug?: string | null;
  bio?: string | null;
  is_collective?: boolean;
  individual_curatorial_note?: string | null;
  cover_url?: string | null;
  cover_width?: number | null;
  cover_height?: number | null;
};

export type SnapshotZone = {
  id: string;
  number: number;
  label: string;
  region?: string | null;
  common_curatorial_note?: string | null;
  curators: SnapshotPerson[];
  assistants: SnapshotPerson[];
};

export type SnapshotVenue = {
  id: string;
  slug: string;
  name: string;
  history?: string | null;
  map_url?: string | null;
  virtual_tour_url?: string | null;
  cover_url?: string | null;
  cover_width?: number | null;
  cover_height?: number | null;
  gallery_urls?: string[];
};

export type SnapshotContributor = {
  person_id?: string | null;
  display_name: string;
  institution_name?: string | null;
  materials?: string | null;
  dimensions?: string | null;
};

export type SnapshotArtwork = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  materials_summary?: string | null;
  dimensions_summary?: string | null;
  zone_id?: string | null;
  venue_id?: string | null;
  venue_name?: string | null;
  cover_url?: string | null;
  cover_width?: number | null;
  cover_height?: number | null;
  gallery_urls?: string[];
  contributors: SnapshotContributor[];
};

export type SnapshotArtist = {
  id: string;
  name: string;
  slug?: string | null;
  institution: string;
  zone_id?: string | null;
  zone_label?: string | null;
};

export type SnapshotSection = {
  id: string;
  section_key: string;
  title?: string | null;
  body?: string | null;
  sort_order: number;
  items: Array<{
    label?: string | null;
    url?: string | null;
    content_type?: string | null;
  }>;
};

export type SnapshotPayload = {
  edition: {
    id: string;
    years: string;
    number: number;
    title?: string | null;
    slug: string;
    overview?: string | null;
    overall_curatorial_note?: string | null;
    is_current: boolean;
    published: boolean;
    hero_url?: string | null;
    hero_urls?: string[];
    gallery_urls?: string[];
  };
  sections: SnapshotSection[];
  zones: SnapshotZone[];
  venues: SnapshotVenue[];
  artworks: SnapshotArtwork[];
  artists: SnapshotArtist[];
};

export type SnapshotRow = {
  edition_id: string;
  payload: SnapshotPayload;
  search_index: SearchIndexEntry[];
  generated_at: string;
};

export type MappedCatalogue = {
  editionId: string;
  years: string;
  number: number;
  title: string;
  slug: string;
  overview: string | null;
  overallCuratorialNote: string | null;
  isCurrent: boolean;
  heroUrl: string | null;
  /** Cover carousel frames (previous editions); first matches heroUrl when present. */
  heroUrls: string[];
  galleryUrls: string[];
  sections: SnapshotSection[];
  zones: CuratorZone[];
  curators: CuratorCard[];
  artworks: ArtworkCard[];
  artists: ArtistCard[];
  venues: VenueCard[];
  institutions: string[];
  searchIndex: SearchIndexEntry[];
  generatedAt: string;
  source: "remote" | "static";
  teamBody: string | null;
};

export type CatalogueStatus = "loading" | "ready" | "error";

export type CatalogueStore = {
  status: CatalogueStatus;
  error: string | null;
  catalogues: MappedCatalogue[];
};