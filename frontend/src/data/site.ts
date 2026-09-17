export const LATEST_EDITION = { id: "2025-26", label: "Students' Biennale 2025–26" };

export const PREVIOUS_EDITIONS = [
  "2022-23",
  "2020-21",
  "2018-19",
  "2016-17",
  "2014-15",
] as const;

export const EDITIONS_PATH = `/editions/${LATEST_EDITION.id}`;

export type CanvasItem = {
  id: string;
  kind: "curator" | "artist" | "artwork" | "venue";
  name: string;
  meta: string;
  image?: string;
  bio?: string;
  tags?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Which masonry column this tile is in — each column tiles vertically on
   *  its own period, independent of the others (see packMasonry). */
  col: number;
};

/**
 * Discover Artworks — infinite artwork canvas.
 * Tiles vary freely between a min and max within their column, with an
 * irregular (non-constant) gap around each one — a scattered bento, not an
 * even grid.
 */
export type CanvasTier = "mobile" | "tablet" | "desktop";

export const TIER_CONFIG: Record<
  CanvasTier,
  {
    seedW: number;
    /** Target packed height before the world tiles/repeats. */
    seedH: number;
    /** Base column gap between columns. */
    colGap: number;
    /** Base vertical spacing between tiles. */
    rowGap: number;
    /** How far vertical spacing strays from `rowGap`, as a fraction of it (0-1). */
    gapJitter: number;
    columns: number;
    /** How unevenly column widths vary around the mean, 0-1. */
    columnJitter: number;
    minTileH: number;
    maxTileH: number;
    /** Smallest a tile is ever allowed to shrink to, regardless of kind. */
    absMinW: number;
  }
> = {
  // Golden-ratio visual balance: minimum tiles are clearly readable (~210px), hero tiles fill the column (~360px), with consistent breathing room
  mobile: { seedW: 968, seedH: 4800, colGap: 16, rowGap: 56, gapJitter: 0.20, columns: 3, columnJitter: 0.12, minTileH: 140, maxTileH: 290, absMinW: 140 },
  tablet: { seedW: 1550, seedH: 5400, colGap: 20, rowGap: 72, gapJitter: 0.20, columns: 4, columnJitter: 0.14, minTileH: 160, maxTileH: 360, absMinW: 160 },
  desktop: { seedW: 2309, seedH: 6000, colGap: 24, rowGap: 88, gapJitter: 0.20, columns: 6, columnJitter: 0.16, minTileH: 180, maxTileH: 420, absMinW: 180 },
};

/** Balanced scale span: compact accent (0.58) -> standard (0.78) -> hero (0.98) */
const KIND_SCALE: Record<CanvasItem["kind"], [number, number]> = {
  curator: [0.80, 0.98],
  artist: [0.80, 0.98],
  venue: [0.80, 0.98],
  artwork: [0.58, 0.98],
};

export function getCanvasTier(viewportWidth: number): CanvasTier {
  if (viewportWidth < 640) return "mobile";
  if (viewportWidth < 1100) return "tablet";
  return "desktop";
}

/** Deterministic pseudo-random in [-1, 1], stable across renders for the same index. */
function pseudoRandom(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

type CanvasDraft = Omit<CanvasItem, "x" | "y" | "width" | "height" | "col"> & {
  /** Natural pixel size of the source image (width / height). */
  imageW?: number;
  imageH?: number;
};

/** Measured natural dimensions for local static assets under /public (brand/UI only).
 *  Catalogue / CMS media ships width/height on the card when available. */
const IMAGE_NATURAL: Record<string, { w: number; h: number }> = {};

function aspectOf(draft: CanvasDraft): number {
  if (draft.imageW && draft.imageH) return draft.imageW / draft.imageH;
  if (draft.image && IMAGE_NATURAL[draft.image]) {
    const { w, h } = IMAGE_NATURAL[draft.image];
    return w / h;
  }
  return 1;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const PLACEHOLDER_TITLES = [
  "What absence carries",
  "The quiet beneath the rubble",
  "A warm kind of panic",
  "The house that remembers",
  "Blind Command",
  "Residual Marks",
  "Dar - Dara - Dariya",
  "Milk Distributors",
  "The Panopticon",
  "Uncanny: The Quiet Rusty Sign",
  "Where memories are immured",
  "Labour of the Imagined",
  "Root System Analysis",
  "Who is the print-er?",
  "Sensing Grounds study",
  "Threshold notes",
];

const PLACEHOLDER_META = [
  "VKL Warehouse",
  "BMS Warehouse",
  "St. Andrews Parish Hall",
  "Arthshila Kochi",
  "Space Gallery",
  "David Hall",
];

/** Stable Picsum IDs — landscape 1600×1000, portrait 1000×1600. Kept small and
 *  only for aspect-ratio variety against the real (mostly interior) photos —
 *  real submissions should dominate the field, not stock photography. */
const LANDSCAPE_IDS = [10, 11, 15, 20];
const PORTRAIT_IDS = [12, 25, 30, 33];

function placeholderDrafts(): CanvasDraft[] {
  const out: CanvasDraft[] = [];

  LANDSCAPE_IDS.forEach((picId, i) => {
    out.push({
      id: `ph-land-${picId}`,
      kind: "artwork",
      name: PLACEHOLDER_TITLES[i % PLACEHOLDER_TITLES.length],
      meta: PLACEHOLDER_META[i % PLACEHOLDER_META.length],
      image: `https://picsum.photos/id/${picId}/1600/1000`,
      imageW: 1600,
      imageH: 1000,
      bio: "Placeholder landscape study for Discover Artworks layout.",
    });
  });

  PORTRAIT_IDS.forEach((picId, i) => {
    out.push({
      id: `ph-port-${picId}`,
      kind: "artwork",
      name: PLACEHOLDER_TITLES[(i + 3) % PLACEHOLDER_TITLES.length],
      meta: PLACEHOLDER_META[(i + 2) % PLACEHOLDER_META.length],
      image: `https://picsum.photos/id/${picId}/1000/1600`,
      imageW: 1000,
      imageH: 1600,
      bio: "Placeholder portrait study for Discover Artworks layout.",
    });
  });

  return out;
}

function withNaturalSize(draft: CanvasDraft): CanvasDraft {
  if (draft.imageW && draft.imageH) return draft;
  if (!draft.image) return draft;
  const natural = IMAGE_NATURAL[draft.image];
  if (!natural) return draft;
  return { ...draft, imageW: natural.w, imageH: natural.h };
}

function artworkDrafts(artworks: ArtworkCard[]): CanvasDraft[] {
  return artworks.map((artwork) => {
    const artistNames = artwork.artists?.map((a) => a.name).join(", ") || "";
    const institutions = artwork.artists?.map((a) => a.institution).join(", ") || "";
    const materialsStr = artwork.materials?.join(", ") || "";
    const searchBlob = [
      artwork.title,
      artistNames,
      institutions,
      artwork.venue,
      artwork.year,
      artwork.medium,
      materialsStr,
      artwork.description,
      artwork.searchText,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return withNaturalSize({
      id: `aw-${artwork.id}`,
      kind: "artwork" as const,
      name: artwork.title,
      meta: [artistNames, artwork.venue, artwork.year].filter(Boolean).join(" · ") || artwork.year || "",
      image: artwork.image,
      bio: artwork.description,
      tags: searchBlob,
      imageW: artwork.imageWidth ?? (artwork.image ? 1600 : undefined),
      imageH: artwork.imageHeight ?? (artwork.image ? 1200 : undefined),
    });
  });
}

function canvasBase(artworks?: ArtworkCard[]): CanvasDraft[] {
  if (artworks) {
    const realArtworks = artworkDrafts(artworks);
    const withImages = realArtworks.filter((row) => row.image);
    if (withImages.length >= 12) return realArtworks;
    return [...realArtworks, ...placeholderDrafts()];
  }
  return placeholderDrafts();
}

/**
 * Column masonry — no shared row bands, no width-stretching. Each column has
 * its own (jittered) width; each tile's height is its own image aspect ratio
 * applied to that column's width, only clamped at the tier's extremes.
 *
 * Each column also gets its own vertical *period* (colPeriods) instead of a
 * single shared world height. A shared height would force every column to
 * "reset" to a fresh tile at the exact same Y when the world tiles — visible
 * as a straight seam across the whole canvas. With independent periods, each
 * column repeats at a different Y, so no seam ever lines up across columns.
 */
function packMasonry(
  tier: CanvasTier,
  artworks?: ArtworkCard[],
): { items: CanvasItem[]; colWidths: number[]; colPeriods: number[] } {
  const config = TIER_CONFIG[tier];
  const { seedW, seedH, colGap, rowGap, gapJitter, columns, columnJitter, minTileH, maxTileH, absMinW } = config;
  const gapLo = rowGap * (1 - gapJitter);
  const gapHi = rowGap * (1 + gapJitter);
  const base = canvasBase(artworks);

  // Jittered column widths with tight column gap, renormalized to exactly fill seedW.
  const inner = seedW - colGap * (columns + 1);
  const rawWeights = Array.from({ length: columns }, (_, i) => 1 + pseudoRandom(i * 7 + 3) * columnJitter);
  const weightSum = rawWeights.reduce((s, w) => s + w, 0);
  const colWidths = rawWeights.map((w) => (inner * w) / weightSum);
  const colX: number[] = [];
  {
    let x = colGap;
    for (const w of colWidths) {
      colX.push(x);
      x += w + colGap;
    }
  }
  const colHeights = new Array(columns).fill(0);
  const colSlack = ((minTileH + maxTileH) / 2) * 0.6;

  // Track the most recent tile placed per column to enforce size contrast
  type SizeTier = 0 | 1 | 2; // 0: Compact, 1: Medium, 2: Hero
  const lastTileInCol: Array<{ tier: SizeTier; y: number } | null> = new Array(columns).fill(null);

  const items: CanvasItem[] = [];
  let n = 0;

  // Keep going until EVERY column has reached the target height
  while (Math.min(...colHeights) < seedH && n < base.length * 10) {
    const minH = Math.min(...colHeights);
    const candidates: number[] = [];
    for (let i = 0; i < columns; i++) {
      if (colHeights[i] - minH <= colSlack) candidates.push(i);
    }
    const pickT = (pseudoRandom(n * 23 + 17) + 1) / 2;
    const col = candidates[Math.min(candidates.length - 1, Math.floor(pickT * candidates.length))];

    const src = base[n % base.length];
    const cycle = Math.floor(n / base.length);
    const draft: CanvasDraft = cycle === 0 ? src : { ...src, id: `${src.id}__c${col}-${n}` };
    n += 1;

    const aspect = aspectOf(draft);
    const colW = colWidths[col];

    const [scaleLo, scaleHi] = KIND_SCALE[draft.kind];
    
    // Neighbor contrast rule: similar sized tiles MUST NOT come next to each other
    const prevTile = lastTileInCol[col];
    const leftTile = col > 0 ? lastTileInCol[col - 1] : null;
    const rightTile = col < columns - 1 ? lastTileInCol[col + 1] : null;
    const currentY = colHeights[col];

    const forbidden = new Set<SizeTier>();
    if (prevTile) {
      // Must not match immediately preceding tile in the same column
      forbidden.add(prevTile.tier);
    }
    // Check horizontal neighbors within overlapping Y vicinity
    const overlapThreshold = (minTileH + maxTileH) * 0.7;
    if (leftTile && Math.abs(currentY - leftTile.y) < overlapThreshold) {
      forbidden.add(leftTile.tier);
    }
    if (rightTile && Math.abs(currentY - rightTile.y) < overlapThreshold) {
      forbidden.add(rightTile.tier);
    }

    let allowedTiers: SizeTier[] = ([0, 1, 2] as SizeTier[]).filter((t) => !forbidden.has(t));
    if (allowedTiers.length === 0) {
      allowedTiers = ([0, 1, 2] as SizeTier[]).filter((t) => t !== prevTile?.tier);
    }

    const tierPickR = (pseudoRandom(n * 41 + col * 17 + 83) + 1) / 2;
    const chosenTier = allowedTiers[Math.min(allowedTiers.length - 1, Math.floor(tierPickR * allowedTiers.length))];

    // Sub-jitter within the selected tier band
    const subR = (pseudoRandom(n * 67 + col * 29 + 11) + 1) / 2;
    let scaleT = 0.5;
    if (chosenTier === 0) {
      // Compact accent tier: scale approx 0.58 - 0.69
      scaleT = 0.02 + subR * 0.26;
    } else if (chosenTier === 1) {
      // Medium standard tier: scale approx 0.73 - 0.84
      scaleT = 0.38 + subR * 0.26;
    } else {
      // Hero prominent tier: scale approx 0.89 - 0.98
      scaleT = 0.78 + subR * 0.20;
    }

    const scale = scaleLo + (scaleHi - scaleLo) * scaleT;
    const tileW = clamp(Math.round(colW * scale), absMinW, Math.round(colW * (scaleHi > 1 ? scaleHi : 1)));
    const tileH = clamp(Math.round(tileW / aspect), minTileH, maxTileH);

    // Center each tile horizontally in its column
    const slack = colW - tileW;
    const xInCol = Math.round(slack / 2);

    // Organic vertical spacing with balanced row gap and controlled jitter
    const gapT = (pseudoRandom(n * 29 + col * 43 + 97) + 1) / 2;
    const tileGap = Math.round(gapLo + (gapHi - gapLo) * gapT);
    const tileY = Math.round(colHeights[col] + tileGap);

    lastTileInCol[col] = { tier: chosenTier, y: tileY };

    items.push({
      id: draft.id,
      kind: draft.kind,
      name: draft.name,
      meta: draft.meta,
      image: draft.image,
      bio: draft.bio,
      tags: draft.tags,
      x: Math.round(colX[col] + xInCol),
      y: tileY,
      width: tileW,
      height: tileH,
      col,
    });
    colHeights[col] += tileH + tileGap;
  }

  // Each column's own period — where its content ends and its own pattern repeats.
  const colPeriods = colHeights.map((h) => Math.round(h + rowGap));
  return { items, colWidths: colWidths.map((w) => Math.round(w)), colPeriods };
}

export type CanvasPack = {
  items: CanvasItem[];
  seedW: number;
  colWidths: number[];
  colPeriods: number[];
};

const packCache = new Map<string, CanvasPack>();

/** Bust layout cache after packing rules change (dev / HMR safety). */
const PACK_VERSION = "artworks-no-adjacent-similar-sizes-v19";

export function getCanvasPack(
  tier: CanvasTier = "desktop",
  artworks?: ArtworkCard[],
  sourceKey = "static",
): CanvasPack {
  const key = `${PACK_VERSION}:${tier}:${sourceKey}`;
  let cached = packCache.get(key);
  if (!cached) {
    const packed = packMasonry(tier, artworks);
    cached = {
      items: packed.items,
      seedW: TIER_CONFIG[tier].seedW,
      colWidths: packed.colWidths,
      colPeriods: packed.colPeriods,
    };
    packCache.set(key, cached);
  }
  return cached;
}

export type CuratorCard = {
  id: string;
  name: string;
  region: string;
  note: string;
  /** Full curator biography, as written in the Figma curators list panel. */
  bio?: string;
  image?: string;
  /** CSS object-position — keeps heads framed in the 315×360 crop */
  focus?: string;
  searchText?: string;
  /** Per-curator note title (Zone 6 dual notes). */
  noteTitle?: string;
  /** Per-curator note body (Zone 6 dual notes). */
  noteBody?: string;
  /** Optional attribution line under the note title, e.g. "Curated by Ashok Vish". */
  noteAttribution?: string;
};

export type CuratorZone = {
  id: string;
  label: string;
  states: string;
  curators: CuratorCard[];
  curatorialAssistant?: string;
  /** Curatorial framework note — title + statement, shown once per zone. */
  noteTitle?: string;
  noteBody?: string;
};


export type ArtworkCard = {
  id: string;
  slug?: string;
  title: string;
  venue: string;
  year: string;
  description: string;
  artists: { name: string; institution: string }[];
  materials: string[];
  dimensions: string;
  /** Curatorial zone this work sits in — drives the "Curator :" line and the
   *  artworks shown on a curator's page. Only set where Figma states it. */
  zoneId?: string;
  /** Medium shown instead of a venue on some catalogue cards. */
  medium?: string;
  /** Catalogue / card thumbnail when known. */
  image?: string;
  /** Detail hero carousel frames; falls back to `[image]` when omitted. */
  images?: string[];
  imageWidth?: number;
  imageHeight?: number;
  searchText?: string;
};

function uniqueMedia(...values: Array<string | string[] | null | undefined>): string[] {
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

/** Hero / carousel frames for an artwork detail page. */
export function artworkImages(artwork: ArtworkCard): string[] {
  return uniqueMedia(artwork.images, artwork.image);
}

/** Hero / carousel frames for a venue detail page. */
export function venueImages(venue: VenueCard): string[] {
  return uniqueMedia(venue.images, venue.image);
}

export type VenueCard = {
  id: string;
  name: string;
  address: string;
  hours: string;
  /** Venue history shown on the catalogue row and detail page. */
  description: string;
  /** List-row photo (Figma ~482×300). */
  image?: string;
  /** Detail hero carousel; falls back to `[image]` when omitted. */
  images?: string[];
  mapUrl?: string;
  tourUrl?: string;
  searchText?: string;
};

/** The six edition venues, in the order and with the copy from Figma 718:1326. */
export type ArtistCard = {
  id: string;
  name: string;
  institution: string;
  zone: string;
  searchText?: string;
};

export type PastWorkshop = {
  id: string;
  title: string;
  year: string;
  facilitators: string;
  location?: string;
  heroImage?: string;
  description?: string;
  galleryImages?: string[];
};

/** Raza scholarship portraits — intentional frontend assets until CMS owns scholar images. */
export const RAZA_SCHOLARS: { id: string; name: string; image: string }[] = [
  { id: "kaki-weiss", name: "Kaki Weiss", image: "/programmes/raza-kaki-weiss.jpg" },
  { id: "nina-durel", name: "Nina Durel", image: "/programmes/raza-nina-durel.jpg" },
  { id: "rutuja-sonawane", name: "Rutuja Sonawane", image: "/programmes/raza-rutuja-sonawane.jpg" },
  { id: "mohammad-riyaz", name: "Mohammad Riyaz", image: "/programmes/raza-mohammad-riyaz.jpg" },
];

export const RAZA_SCHOLAR_ARTWORKS: ArtworkCard[] = [
  {
    id: "kaki-weiss",
    title: "Tabut",
    venue: "VKL Warehouse, Fort Kochi",
    year: "2025 - 26",
    description: `Kaki Weiss proposes a kitchen where the act of cooking becomes a medium for transmission and memory. Centered around a table, the installation also invites participation in activating the space.\n\nHere, the kitchen is reimagined not as a private, enclosed space but as a site of exchange — a place where knowledge is handed down not through instruction alone, but through repeated gesture, smell, taste, and touch. Cooking becomes a language of its own, one that carries memory across bodies and generations, often without the need for words.\n\nThe table at the center of the work anchors this exchange. It is less an object to be viewed than a threshold to be crossed — a surface where making and remembering happen simultaneously, and where the boundary between artist and audience begins to dissolve. By inviting participation, Weiss resists the idea of the artwork as something finished or fixed. Instead, the installation only becomes whole through activation: through hands that stir, mix, and share.\n\nIn this sense, the work asks what it means to inherit — not objects, but practices; not stories, but the living memory held in the act of cooking itself.`,
    artists: [{ name: "Kaki Weiss", institution: "Beaux Arts de Marseille, France" }],
    materials: [
      "Mixed media installation with performance (reclaimed wood, textile, kitchen implements, food materials)",
    ],
    dimensions: "Variable",
    image: "/programmes/raza-kaki-weiss.jpg",
    images: ["/programmes/raza-kaki-hero.jpg", "/programmes/raza-kaki-weiss.jpg"],
  },
  {
    id: "nina-durel",
    title: "Inseamm",
    venue: "VKL Warehouse, Fort Kochi",
    year: "2025 - 26",
    description: `Conceived as a book-object with variable dimensions (55 x 40 x 20 cm when closed), this work unfolds as a "sensitive cartography" of Kochi's fluvial and coastal networks. Beginning with a digital drift through Google Maps, the artist turns to the act of walking and observing, measuring not land, but water. Inspired by artist Matías Poisson, who maps cities through horizon lines and urban details, the project embraces mapping as an intuitive, imperfect art where distortions, invented keys, and shifting perspectives reveal what standard cartography cannot.\n\nThrough observational drawing, the waterways are traced for their biodiverse edges: water hyacinths, fishing structures, and imagined sea creatures echoing the legendary "Here be dragons" of Olaus Magnus. Traditional Chinese fishing nets (Cheena vala) along Vypin become recurring motifs forms held between function and image.\n\nA deployable surveying tool, built to the scale of a carry-on suitcase, accompanies this process. Hybrid in nature, it evokes scientific instruments such as GPS/GNSS units and theodolites while functioning as a sculptural observation module. Drawing from the field structures of Gilles Ebersolt and the inhabitable sculptures of Abraham Poincheval, the work becomes both instrument and artwork, a portable studio carried on the back.\n\nHere, cartography is not fixed but lived. Art moves through the landscape, made outdoors and shown in passage, tracing the unstable contours of water and memory.`,
    artists: [{ name: "Nina Durel", institution: "Beaux Arts de Marseille, France" }],
    materials: ["Mixed media installation"],
    dimensions: "Variable",
    image: "/programmes/raza-nina-durel.jpg",
    images: ["/programmes/raza-nina-hero.jpg", "/programmes/raza-nina-durel.jpg"],
  },
  {
    id: "rutuja-sonawane",
    title: "The People’s Orchestra",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Rutuja Sonawane", institution: "Sir J. J. School of Art, Mumbai, Maharashtra" }],
    materials: ["Mixed media installation"],
    dimensions: "Variable",
    image: "/programmes/raza-rutuja-sonawane.jpg",
    images: ["/programmes/raza-rutuja-sonawane.jpg"],
  },
  {
    id: "mohammad-riyaz",
    title: "Inheritance of the hand",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [
      {
        name: "Mohammad Riyaz",
        institution: "Govt. Institute of Fine Arts, Gwalior, Madhya Pradesh",
      },
    ],
    materials: ["Mixed media installation"],
    dimensions: "Variable",
    image: "/programmes/raza-mohammad-riyaz.jpg",
    images: ["/programmes/raza-mohammad-riyaz.jpg"],
  },
];

export type AwardWinner = { name: string; artwork: string; institution: string; artworkId: string };

export type ProgrammeCard = {
  id: string;
  title: string;
  kind: "workshop" | "residency" | "award";
  blurb: string;
  place?: string;
};
