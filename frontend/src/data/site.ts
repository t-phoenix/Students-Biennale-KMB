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

/** Measured natural dimensions for assets under /public. */
const IMAGE_NATURAL: Record<string, { w: number; h: number }> = {
  "/curators/anga.png": { w: 1600, h: 1067 },
  "/curators/ashok.png": { w: 1500, h: 1600 },
  "/curators/chinar.png": { w: 1204, h: 1600 },
  "/curators/gabaa.png": { w: 1600, h: 1067 },
  "/curators/salman.png": { w: 1552, h: 1190 },
  "/curators/savyasachi.png": { w: 1600, h: 1064 },
  "/curators/secular.png": { w: 1600, h: 1280 },
  "/curators/seethal.png": { w: 1242, h: 1600 },
  "/curators/sudheesh.png": { w: 1067, h: 1600 },
  "/curators/sukanya.png": { w: 1501, h: 1600 },
};

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
  const realArtworks = artworkDrafts(ARTWORKS.filter((a) => a.image));
  return [...realArtworks, ...placeholderDrafts()];
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
    
    // Balanced multi-harmonic distribution across accent (0.58), standard (0.78), and hero (0.98) tiers
    const r1 = (pseudoRandom(n * 37 + col * 19 + 71) + 1) / 2;
    const r2 = (pseudoRandom(n * 53 + col * 31 + 13) + 1) / 2;
    let scaleT = r1 * 0.65 + r2 * 0.35;
    if (scaleT > 0.70) {
      // Hero tier: prominent focal artworks (up to 0.98)
      scaleT = 0.80 + (scaleT - 0.70) * 0.60;
    } else if (scaleT < 0.30) {
      // Compact accent tier (down to 0.58)
      scaleT = scaleT * 0.85;
    }
    scaleT = clamp(scaleT, 0, 1);

    const scale = scaleLo + (scaleHi - scaleLo) * scaleT;
    const tileW = clamp(Math.round(colW * scale), absMinW, Math.round(colW * (scaleHi > 1 ? scaleHi : 1)));
    const tileH = clamp(Math.round(tileW / aspect), minTileH, maxTileH);

    // Center each tile horizontally in its column
    const slack = colW - tileW;
    const xInCol = Math.round(slack / 2);

    // Organic vertical spacing with balanced row gap and controlled jitter
    const gapT = (pseudoRandom(n * 29 + col * 43 + 97) + 1) / 2;
    const tileGap = Math.round(gapLo + (gapHi - gapLo) * gapT);

    items.push({
      id: draft.id,
      kind: draft.kind,
      name: draft.name,
      meta: draft.meta,
      image: draft.image,
      bio: draft.bio,
      tags: draft.tags,
      x: Math.round(colX[col] + xInCol),
      y: Math.round(colHeights[col] + tileGap),
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
const PACK_VERSION = "artworks-golden-ratio-balance-v18";

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

export const CURATOR_ZONES: CuratorZone[] = [
  {
    id: "zone-1",
    label: "Zone 1",
    states: "Delhi, Goa, Gujarat, Haryana, Punjab, Rajasthan",
    curatorialAssistant: "Sahana Srikanth",
    noteTitle: "Square at the shoulders",
    noteBody:
      "As public spaces shrink and control is exercised, the home and the classroom begin to blur, as refuge and belonging exist alongside surveillance and boundaries. When searching for a language that is sufficient to shift institutional accounts, there emerges a trembling space — one of negotiation, disruption, and resistance. We call upon disobedient practices––ones that resist resolution, ones that listen differently. In reclaiming the domestic, the pedagogic, the material, and the technological as the grounds for a collective response, how might we unlearn the hierarchies of authorship, labour, and knowledge that bind our gestures before they can even begin? Re-examining technology's potential, we call to a new set of logics to incorporate play, generate criticality, and build resources. Do-it-yourself and material practices become spirited enquiries that engage with detailing systems and apparatuses. Thinking errantly invites us to work from within: to touch what has been made invisible, to turn disobedience into method and care, and imagine new collaborations.",
    curators: [
      {
        id: "savyasachi",
        name: "Savyasachi Anju Prabir",
        region: "Zone 1",
        note: "Regional mentorship · North & West",
        bio: "Savyasachi Anju Prabir has a background in film and visual anthropology. His practice engages with moving images at the intersections of film, art, and anthropology. He currently teaches film and video communication at the National Institute of Design, Ahmedabad. He has worked as a programmer and jury member for festivals such as the Freiburger Filmforum, Experimenta India, IDA Documentary Awards, and the Alpavirama International Youth Film Festival. His ongoing research explores intergenerational memory, countermapping, and multimodal pedagogy through teaching, filmmaking, and artistic research.",
        image: "/curators/savyasachi.png",
        focus: "center bottom",
      },
      {
        id: "sukanya",
        name: "Sukanya Deb",
        region: "Zone 1",
        note: "Regional mentorship · North & West",
        bio: "Sukanya Deb is a writer, editor and curator, whose interest lies in the intersections of contemporary art, digital culture, technology and their material propositions. She has worked extensively in programs within the arts sector, which has broadened her interest in generating and experimenting with existing infrastructures for support, collaborative exchange and dissemination. She established Purée Mag in 2024, in order to address critical positions in art and culture. She has been a recipient of Experimenter Generator Grant 2025, Khoj CISA Fellowship 2023, India Foundation for the Arts’ 25x25 Grant, and her writing has been featured in publications such as e-flux Education, STIRworld, ASAP | Art, Write | Art | Connect, AQNB, and others. Since 2022, she has been Programmes Manager at Shared Ecologies, an initiative of the Shyama Foundation.",
        image: "/curators/sukanya.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-2",
    label: "Zone 2",
    states: "West Bengal, Orissa, Uttar Pradesh, Chhattisgarh",
    curators: [
      {
        id: "gabaa",
        name: "GABAA",
        region: "Zone 2",
        note: "te(a)m-plurality — Sensing Grounds curatorial note",
        image: "/curators/gabaa.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-3",
    label: "Zone 3",
    states: "Kerala, Tamil Nadu, and Andhra Pradesh",
    curators: [
      {
        id: "seethal",
        name: "Dr. Seethal C. P",
        region: "Zone 3",
        note: "Regional mentorship · South",
        image: "/curators/seethal.png",
        focus: "center bottom",
      },
      {
        id: "sudheesh",
        name: "Dr Sudheesh Kottembram",
        region: "Zone 3",
        note: "Regional mentorship · South",
        image: "/curators/sudheesh.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-4",
    label: "Zone 4",
    states:
      "Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim and Tripura",
    curators: [
      {
        id: "anga",
        name: "Anga Art Collective",
        region: "Zone 4",
        note: "Collective mentorship across the Northeast",
        image: "/curators/anga.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-5",
    label: "Zone 5",
    states: "Maharashtra, Bihar, Jharkhand, Madhya Pradesh",
    curators: [
      {
        id: "secular",
        name: "Secular Art Collective",
        region: "Zone 5",
        note: "Collective frameworks · Central India",
        image: "/curators/secular.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-6",
    label: "Zone 6",
    states: "Karnataka and Telangana",
    curators: [
      {
        id: "ashok",
        name: "Ashok Vish",
        region: "Zone 6",
        note: "Artistic duo · regional frameworks",
        image: "/curators/ashok.png",
        focus: "center bottom",
      },
      {
        id: "chinar",
        name: "Chinar Shah",
        region: "Zone 6",
        note: "Artistic duo · regional frameworks",
        image: "/curators/chinar.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-7",
    label: "Zone 7",
    states: "Himachal Pradesh, Jammu and Kashmir, Ladakh and Uttarakhand",
    curators: [
      {
        id: "khursheed",
        name: "Khursheed Ahmad",
        region: "Zone 7",
        note: "Artistic duo · mountain ecologies",
        // Frame 97.png is a placeholder strip, not a portrait — omit image
      },
      {
        id: "salman",
        name: "Salman B Baba",
        region: "Zone 7",
        note: "Artistic duo · mountain ecologies",
        image: "/curators/salman.png",
        focus: "center bottom",
      },
    ],
  },
];

export const CURATORS: CuratorCard[] = CURATOR_ZONES.flatMap((z) => z.curators);

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

/**
 * Catalogue order matches the Figma "Edition Page_Grid_Artwork" frame (1:1574)
 * row by row, left card then right card, so the 2-up grid reproduces it exactly.
 * Only "absence" has full curatorial detail; the rest carry the real Figma
 * title/venue with placeholder body copy until catalogue text is supplied.
 */
export const ARTWORKS: ArtworkCard[] = [
  {
    id: "absence",
    title: "What absence carries",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "What absence carries traces the quiet terrain where memory, grief and body entwine. Through soft sculptures, fluid drawings, tender photographs, and stitched traces, the work attends to forms that hover between presence and disappearance, lives imagined, interrupted, or suspended. Emerging from a subconscious current that precedes language, the pieces gather gestures and stains that echo cellular growths, matrilineal rhythms, and the residues the body carries without speech. Each form reveals how value, grief, and inherited memory are tethered to roles and absences that remain unfulfilled, withheld, or imposed.\n\nWorking intuitively, the sculptures, drawings, photographs, and moving body register what lingers after rupture: textures of care, pressure, hesitation, and loss. They do not illustrate the body but listen to it, allowing fragments, smudges, and soft boundaries to surface as traces of sensation. The work moves between stillness and motion, expanding into elliptical pathways that trace the imperfect orbits of growth, inheritance and becoming. The stitched scars, layered pages and residual images ask how memory persists through matter and whether something can be considered absent if it continues to live through touch, form and feeling.",
    artists: [
      { name: "Ananya Gautam", institution: "National Institute of Design, Ahmedabad" },
      { name: "Annanya Dhanda", institution: "The Maharaja Sayajirao University, Baroda" },
      { name: "Jyotismriti Bordoloi", institution: "The Maharaja Sayajirao University, Baroda" },
    ],
    materials: [
      "Prints on fabric, video, dimensions variable",
      "Fabric, fibre, dimensions variable",
      "Mixed media drawings on Nepali paper, dimensions variable",
    ],
    dimensions: "5 x 15 Feet",
    zoneId: "zone-1",
    image: "/artworks/absence.jpg",
    images: ["/artworks/absence-hero.jpg", "/artworks/absence.jpg"],
  },
  {
    id: "rubble",
    title: "The quiet beneath the rubble",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Pratik Khurkutiya", institution: "The Maharaja Sayajirao University of Baroda" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    zoneId: "zone-1",
    image: "/artworks/rubble.jpg",
  },
  {
    id: "panic",
    title: "A warm kind of panic",
    venue: "BMS Warehouse",
    year: "2025 - 26",
    description:
      "A warm kind of panic begins from the quiet turbulence of everyday experience, the subtle frictions, doubts, and distances that gather beneath the surface of routine life. It draws from instances that shape the individual self, tracing how relationships, environments, and internal thresholds leave impressions that remain difficult to name or contain.",
    artists: [{ name: "Monika", institution: "University of Rajasthan, Jaipur" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    zoneId: "zone-1",
    image: "/artworks/panic.jpg",
  },
  {
    id: "remembers",
    title: "The house that remembers",
    venue: "BMS Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "blind-command",
    title: "Blind Command A4 Collective",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "residual-marks",
    title: "Residual Marks",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Neelam Saini", institution: "Dada Lakhmi Chand State University of Performing and Visual Arts, Rohtak" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/residual-marks.jpg",
  },
  {
    id: "dar-dara-dariya",
    title: "Dar - Dara - Dariya",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Jyoti", institution: "Government College of Art, Chandigarh" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/dar-dara-dariya.jpg",
  },
  {
    id: "milk-distributors",
    title: "Milk Distributors",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Abhijit Das", institution: "Government College of Art, Chandigarh" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/milk-distributors.jpg",
  },
  {
    id: "who-is-the-printer",
    title: "Who is the print-er?",
    venue: "Arthshila Kochi",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Installation"],
    dimensions: "Dimensions variable",
    medium: "Installation",
  },
  {
    id: "root-system",
    title: "Root System Analysis",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Installation"],
    dimensions: "Dimensions variable",
    medium: "Installation",
  },
  {
    id: "root-system-arthshila",
    title: "Root System Analysis (Arthshila)",
    venue: "Arthshila Kochi",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Installation"],
    dimensions: "Dimensions variable",
    medium: "Installation",
  },
  {
    id: "panopticon",
    title: "The Panopticon",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [
      { name: "Ashwariya Singla", institution: "Students' Biennale" },
      { name: "Soumyaraj Acharya", institution: "Students' Biennale" },
    ],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/panopticon.jpg",
  },
  {
    id: "uncanny-rusty-sign",
    title: "Uncanny: The Quiet Rusty Sign",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [
      { name: "Sania Fathima", institution: "Students' Biennale" },
      { name: "Arun S", institution: "Students' Biennale" },
    ],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/uncanny-rusty-sign.jpg",
  },
  {
    id: "where-memories-immured",
    title: "WHERE MEMORIES ARE IMMURED",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [
      { name: "Arshaan Ali Khan", institution: "Free Thinkers Collective" },
      { name: "Haris Raza Ashraf", institution: "Free Thinkers Collective" },
    ],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/where-memories-are-immured.jpg",
  },
  {
    id: "labour-of-the-imagined",
    title: "Labour of the Imagined: Far Away from Left, Centre and Right",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Vineetha W", institution: "Students' Biennale" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/labour-of-the-imagined.jpg",
  },
  /* Tata Trusts award winners (Programmes page, Figma 1:1691/1:1692) who aren't
     otherwise part of the 2025-26 exhibited catalogue — stub records so their
     award card opens a real page, following the same placeholder pattern used
     above for entries whose catalogue copy isn't finalised yet. */
  {
    id: "staged-narratives-aswathy",
    title: "Staged Narratives",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Aswathy GS", institution: "Raja Ravi Varma College of Fine Arts, Mavelikkara, Kerala" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "ginning-justice-kailash",
    title: "Ginning Justice, 2025",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Kailash Khanjode", institution: "Government College of Art, Nagpur, Maharashtra" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "ginning-justice-sachin",
    title: "Ginning Justice, 2025",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Sachin Banne", institution: "Sir J. J. School of Art, Mumbai, Maharashtra" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "mirage-of-the-three",
    title: "Mirage of the Three, 2025",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Abhishek Kholapudi", institution: "Suravaram Pratap Reddy Telugu University, Hyderabad" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "staged-narratives-imran",
    title: "Staged Narratives",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "M. Imran Ahmed", institution: "Government College of Fine Arts, Chennai" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
];

/** Curator names for an artwork, via its curatorial zone. Empty when unassigned. */
export function curatorsForArtwork(artwork: ArtworkCard): CuratorCard[] {
  if (!artwork.zoneId) return [];
  return CURATOR_ZONES.find((z) => z.id === artwork.zoneId)?.curators ?? [];
}

/** Artworks belonging to a curatorial zone. */
export function artworksForZone(zoneId: string): ArtworkCard[] {
  return ARTWORKS.filter((a) => a.zoneId === zoneId);
}

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
export const VENUES: VenueCard[] = [
  {
    id: "st-andrews",
    name: "St. Andrews Parish Hall",
    address: "Elphinstone Road, Fort Kochi",
    hours: "Open during exhibition hours",
    description:
      "St. Andrew's Parish Hall, located on Elphinstone Road in Fort Kochi, is a British-era structure built in 1845 that reflects the town's colonial religious history. It originally served as a place of worship for Malayalam-speaking Protestant Christians, distinct from the European congregation that prayed at the nearby St. Francis Church. After India's independence in 1947, as the European community left Fort Kochi, the two congregations came together at St. Francis Church, and this building was gradually repurposed into what is now St. Andrew's Parish Hall. Today it functions under St. Francis CSI Church and is regularly used for weddings and community gatherings. For the sixth edition of the Kochi-Muziris Biennale, this hall was repurposed as a cultural venue to host exhibitions from the Students' Biennale and Invitations Programme. It also served as a venue for several KMB public programmes, including workshops, talks, and film screenings, while retaining its historic character.",
    image: "/venues/st-andrews.jpg",
    images: [
      "/venues/st-andrews-hero.jpg",
      "/venues/st-andrews-2.jpg",
      "/venues/st-andrews-3.jpg",
    ],
    mapUrl: "https://maps.google.com/?q=St+Andrews+Parish+Hall+Fort+Kochi",
    tourUrl: "https://maps.google.com/?q=St+Andrews+Parish+Hall+Fort+Kochi",
  },
  {
    id: "vkl",
    name: "VKL Warehouse",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    description:
      "Founded in 1935 by Vallabhdas Vasanji Mariwala, the VKL Warehouse property was once part of the ancestral home of Cochin’s Paliam family in Chendamangalam. In 1952, the property was partitioned under land reform rules and the ownership of the land was then transferred to the Mariwala family and the VKL group in 1971.",
    image: "/venues/vkl.jpg",
    images: ["/venues/vkl.jpg"],
    mapUrl: "https://maps.google.com/?q=VKL+Warehouse+Fort+Kochi",
    tourUrl: "https://maps.google.com/?q=VKL+Warehouse+Fort+Kochi",
  },
  {
    id: "bms",
    name: "BMS Warehouse",
    address: "Bazaar Road, Mattancherry",
    hours: "Open during exhibition hours",
    description:
      "Bright's Warehouse (BMS), situated on Bazaar Road in Mattancherry, is one of the historic godowns that reflects Kochi's long-standing role as a major port and trading centre along the Malabar Coast. Built to support the storage and movement of commodities such as spices, coir, timber, and other goods arriving through the nearby harbour, the warehouse formed part of the commercial infrastructure",
    image: "/venues/bms.jpg",
    images: ["/venues/bms.jpg"],
    mapUrl: "https://maps.google.com/?q=BMS+Warehouse+Mattancherry",
    tourUrl: "https://maps.google.com/?q=BMS+Warehouse+Mattancherry",
  },
  {
    id: "arthshila",
    name: "Arthshila Kochi",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    description:
      "Arthshila symbolises British rule in Kochi. It was a part of the daily life of the British in Kochi at that time as a company that sold food products imported from Britain. On October 20, 1795, Dutch rule in Kochi ended and British rule began. The Portuguese fort established in Kochi in 1503 was demolished in 1663 at the beginning of the subsequent Dutch rule.",
    image: "/venues/arthshila.jpg",
    images: ["/venues/arthshila.jpg"],
    mapUrl: "https://maps.google.com/?q=Arthshila+Kochi",
    tourUrl: "https://maps.google.com/?q=Arthshila+Kochi",
  },
  {
    id: "david-hall",
    name: "David Hall",
    address: "Parade Ground, Fort Kochi",
    hours: "Open during exhibition hours",
    description:
      "Situated on the west side of the parade ground in Fort Kochi, exemplifies Dutch architectural design, characterized by three expansive rooms, a verandah with chat benches, tall walls, wide windows, and adjacent seating areas. The building served as the residence of Henrik van Reed, the Dutch Governor of Kochi from 1669 to 1676",
    image: "/venues/david-hall.jpg",
    images: ["/venues/david-hall.jpg"],
    mapUrl: "https://maps.google.com/?q=David+Hall+Fort+Kochi",
    tourUrl: "https://maps.google.com/?q=David+Hall+Fort+Kochi",
  },
  {
    id: "space",
    name: "SPACE",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    description:
      "During the British administration in the 19th Century, the Indian traders in Kochi wanted to have an association, and there were discussions about the same. The history of the Indian Chamber of Commerce and Industry begins here. In 1897, a movement called \"The Cochin Native Merchants' Association\" was formed.",
    image: "/venues/space.jpg",
    images: ["/venues/space.jpg"],
    mapUrl: "https://maps.google.com/?q=Space+Gallery+Fort+Kochi",
    tourUrl: "https://maps.google.com/?q=Space+Gallery+Fort+Kochi",
  },
];

export type ArtistCard = {
  id: string;
  name: string;
  institution: string;
  zone: string;
  searchText?: string;
};

/**
 * Participating artists, in the reading order of the Figma "Edition Page_Grid_Artists"
 * frame (713:297) — 3-up, left to right, top to bottom. All are Zone 1 institutions.
 */
export const ARTISTS: ArtistCard[] = [
  { id: "ananya-gautam", name: "Ananya Gautam", institution: "National Institute of Design, Ahmedabad", zone: "Zone 1" },
  { id: "annanya-dhanda", name: "Annanya Dhanda", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "jyotismriti-bordoloi", name: "Jyotismriti Bordoloi", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "pratik-khurkutiya", name: "Pratik Khurkutiya", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "monika", name: "Monika", institution: "University of Rajasthan, Jaipur", zone: "Zone 1" },
  { id: "ambika-shirodkar", name: "Ambika Shirodkar", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "reedhvi-thanekar", name: "Reedhvi Hanumant Thanekar", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "shilpeksh-khalorkar", name: "Shilpeksh Khalorkar", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "unik-chari", name: "Unik Ramchandra Chari", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "gargi-kumawat", name: "Gargi Kumawat", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "lalchand-prajapat", name: "Lalchand Prajapat", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "priyanka-meena", name: "Priyanka Kumari Meena", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "yash-songara", name: "Yash Songara", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "neelam-saini", name: "Neelam Saini", institution: "Dada Lakhmi Chand State University of Performing and Visual Arts, Rohtak", zone: "Zone 1" },
  { id: "jyoti", name: "Jyoti", institution: "Government College of Art, Chandigarh", zone: "Zone 1" },
  { id: "abhijit-das", name: "Abhijit Das", institution: "Government College of Art, Chandigarh", zone: "Zone 1" },
  { id: "anurag-singraur", name: "Anurag Singraur", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "rishabh-jain", name: "Rishabh Jain", institution: "Shiv Nadar University, Delhi/NCR", zone: "Zone 1" },
  { id: "richardson-benedict", name: "Richardson Benedict", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "sai-gitanjali-poluru", name: "Sai Gitanjali Poluru", institution: "Shiv Nadar University, Delhi/NCR", zone: "Zone 1" },
  { id: "krittika-maji", name: "Krittika Maji", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "gunnica-arya", name: "Gunnica Arya", institution: "O.P. Jindal University, Delhi/NCR", zone: "Zone 1" },
  { id: "krishan-agarwal", name: "Krishan Agarwal", institution: "Jamia Millia Islamia University, Delhi", zone: "Zone 1" },
  { id: "abhijith-raju", name: "Abhijith Raju", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "ashish-chauhan", name: "Ashish Chauhan", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "khushi-mittal", name: "Khushi Mittal", institution: "O.P. Jindal University, Delhi/NCR", zone: "Zone 1" },
];

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

/** Completed workshops — Figma "Programmes page" 1:1648, Group 54/59/60/61.
 *  Order matches the page's 2-item preview (Programmes.tsx slices the first two)
 *  to the exact rows shown in Figma 10:701; "jorahaal-forest" — the one entry with
 *  full detail-page content from Figma 7:183 — is appended at the end rather than
 *  disturbing that preview. */
export const PAST_WORKSHOPS: PastWorkshop[] = [
  { id: "phone-call", title: "How to not answer a phone call?", year: "2025", facilitators: "Merv Espina and Sukanya Deb, New Delhi" },
  { id: "subverting-failures", title: "Subverting Failures", year: "2025", facilitators: "Ujjwal Utkarsh, Priyesh Gothwal and Savyasachi Anju Prabir, Jaipur" },
  { id: "uncertainties-welcomed", title: "Uncertainties Welcomed", year: "2025", facilitators: "Aditya Joshi & Maksud Ali Mondal, Goa" },
  { id: "editing-as-meaning-making", title: "Editing as Meaning Making", year: "2024", facilitators: "Urna Sinha & Varsha Nair, Baroda" },
  {
    id: "jorahaal-forest",
    title: "Jorahaal, Forest as Pedagogue: a kNOw School Workshop",
    year: "2025",
    facilitators: "Jogen Das, Anga Art Collective",
    location: "Bhalla, Assam, October 2025",
    heroImage: "/programmes/workshop-detail-hero.jpg",
    description:
      "This workshop took place in Gyandeep Puthibharal, a community hall situated in Bhalla village near Rani Reserve Forest, Assam, with selected candidates from the Northeast Indian region for the Students' Biennale. The layered interactive relations of the forest and the paddy, rural and the intruding urbanity, human and non-human elements, and so on provided the context to generate pedagogical questions, methodologies, and their implications for art practices. Participants visited farmer and artist Jogen Das' home-studio, who also guided a walking session across his paddy field and the adjacent Sal Kathoni, the Sal forest. Das guided our attention to the regenerative agency of the forest, where small shrubs and plants, both local and invasive, come together, contradicting the logic of monoculture. Students were encouraged to take photographs, write field notes, draw sketches, record sounds, and collect objects. The workshop screened The Full Moon, a two-channel experimental animated video created by collective member Dhrubajit Sarma, and read two texts, In Praise of Floods by James C Scott and The Mushroom at the End of the World by Anna Lowenhaupt Tsing. The conceptual and historical framings of Zomia, capitalist ruins, and contamination as collaboration were introduced, advancing the workshops' thematic concerns. Two participants—Tokpam Henthoiba and Laishram Niketan—held a musical recitation session with the Manipuri musical instrument, Pena.",
    galleryImages: [
      "/programmes/workshop-gallery-1.jpg",
      "/programmes/workshop-gallery-2.jpg",
      "/programmes/workshop-gallery-3.jpg",
      "/programmes/workshop-gallery-4.jpg",
      "/programmes/workshop-gallery-5.jpg",
      "/programmes/workshop-gallery-6.jpg",
      "/programmes/workshop-gallery-7.jpg",
      "/programmes/workshop-gallery-8.jpg",
    ],
  },
];

export const RAZA_SCHOLARS: { id: string; name: string; image: string }[] = [
  { id: "kaki-weiss", name: "Kaki Weiss", image: "/programmes/raza-kaki-weiss.jpg" },
  { id: "nina-durel", name: "Nina Durel", image: "/programmes/raza-nina-durel.jpg" },
  { id: "rutuja-sonawane", name: "Rutuja Sonawane", image: "/programmes/raza-rutuja-sonawane.jpg" },
  { id: "mohammad-riyaz", name: "Mohammad Riyaz", image: "/programmes/raza-mohammad-riyaz.jpg" },
];

export const RAZA_SCHOLAR_ARTWORKS: ArtworkCard[] = [
  {
    id: "kaki-weiss",
    title: "TABUT",
    venue: "Lorem Ipsum",
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
    title: "TABUT",
    venue: "Lorem Ipsum",
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
    title: "Lorem Ipsum",
    venue: "Lorem Ipsum",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Rutuja Sonawane", institution: "Sir J. J. School of Art, Mumbai" }],
    materials: ["Mixed media installation"],
    dimensions: "Variable",
    image: "/programmes/raza-rutuja-sonawane.jpg",
    images: ["/programmes/raza-rutuja-sonawane.jpg"],
  },
  {
    id: "mohammad-riyaz",
    title: "Lorem Ipsum",
    venue: "Lorem Ipsum",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Mohammad Riyaz", institution: "Government College of Fine Arts, Chennai" }],
    materials: ["Mixed media installation"],
    dimensions: "Variable",
    image: "/programmes/raza-mohammad-riyaz.jpg",
    images: ["/programmes/raza-mohammad-riyaz.jpg"],
  },
];

export type AwardWinner = { name: string; artwork: string; institution: string; artworkId: string };

/** International Awards — Figma 1:1691 / Group 269-271. */
export const AWARDS_INTERNATIONAL: AwardWinner[] = [
  { name: "Aswathy GS", artwork: "Staged Narratives", institution: "Raja Ravi Varma College of Fine Arts, Mavelikkara, Kerala", artworkId: "staged-narratives-aswathy" },
  { name: "Kailash Khanjode", artwork: "Ginning Justice, 2025", institution: "Government College of Art, Nagpur, Maharashtra", artworkId: "ginning-justice-kailash" },
  { name: "Sachin Banne", artwork: "Ginning Justice, 2025", institution: "Sir J. J. School of Art, Mumbai, Maharashtra", artworkId: "ginning-justice-sachin" },
];

/** National Awards — Figma 1:1692 / Group 276. */
export const AWARDS_NATIONAL: AwardWinner[] = [
  { name: "Abhishek Kholapudi", artwork: "Mirage of the Three, 2025", institution: "Suravaram Pratap Reddy Telugu University, Hyderabad", artworkId: "mirage-of-the-three" },
  { name: "Pratik Khurkutiya", artwork: "The quiet beneath the rubble", institution: "The Maharaja Sayajirao University of Baroda", artworkId: "rubble" },
  { name: "M. Imran Ahmed", artwork: "Staged Narratives", institution: "Government College of Fine Arts, Chennai", artworkId: "staged-narratives-imran" },
];

export type ProgrammeCard = {
  id: string;
  title: string;
  kind: "workshop" | "residency" | "award";
  blurb: string;
  place?: string;
};

export const PROGRAMMES_UPCOMING: ProgrammeCard[] = [
  {
    id: "w1",
    title: "Workshops",
    kind: "workshop",
    blurb: "Material practice and peer critique sessions with mid-career mentors.",
    place: "Fort Kochi",
  },
  {
    id: "w2",
    title: "Residencies",
    kind: "residency",
    blurb: "Short residencies supporting collaborative research and making.",
    place: "Kochi",
  },
  {
    id: "w3",
    title: "Awards",
    kind: "award",
    blurb: "Recognition for outstanding student projects from the edition.",
  },
];
