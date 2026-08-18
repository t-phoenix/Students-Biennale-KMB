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
 * Even column rhythm, larger tiles, soft shadow — not a random-size bento.
 */
export type CanvasTier = "mobile" | "tablet" | "desktop";

export const TIER_CONFIG: Record<
  CanvasTier,
  {
    seedW: number;
    /** Target packed height before the world tiles/repeats. */
    seedH: number;
    gap: number;
    columns: number;
    /** How unevenly column widths vary around the mean, 0-1. */
    columnJitter: number;
    minTileH: number;
    maxTileH: number;
    /** Smallest a tile is ever allowed to shrink to, regardless of kind. */
    absMinW: number;
  }
> = {
  mobile: { seedW: 900, seedH: 2400, gap: 28, columns: 2, columnJitter: 0.04, minTileH: 200, maxTileH: 520, absMinW: 160 },
  tablet: { seedW: 1400, seedH: 2800, gap: 36, columns: 3, columnJitter: 0.05, minTileH: 240, maxTileH: 640, absMinW: 220 },
  desktop: { seedW: 2100, seedH: 3200, gap: 48, columns: 4, columnJitter: 0.06, minTileH: 280, maxTileH: 780, absMinW: 280 },
};

/** Artworks fill nearly the full column — slight variance only. */
const KIND_SCALE: Record<CanvasItem["kind"], [number, number]> = {
  curator: [0.9, 1],
  artist: [0.9, 1],
  venue: [0.9, 1],
  artwork: [0.92, 1],
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

/** Stable Picsum IDs — landscape 1600×1000, portrait 1000×1600. */
const LANDSCAPE_IDS = [
  10, 11, 15, 20, 28, 29, 37, 48, 54, 65, 70, 82, 91, 103, 111, 129, 145, 160, 177, 193,
];
const PORTRAIT_IDS = [
  12, 25, 30, 33, 40, 42, 49, 57, 58, 64, 76, 83, 96, 101, 119, 137, 152, 164, 180, 201,
];

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
  return artworks.map((artwork) =>
    withNaturalSize({
      id: `aw-${artwork.id}`,
      kind: "artwork" as const,
      name: artwork.title,
      meta: artwork.venue ? `${artwork.venue}${artwork.year ? ` · ${artwork.year}` : ""}` : artwork.year,
      image: artwork.image,
      bio: artwork.description,
      tags: artwork.searchText,
      imageW: artwork.imageWidth ?? (artwork.image ? 1600 : undefined),
      imageH: artwork.imageHeight ?? (artwork.image ? 1200 : undefined),
    }),
  );
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
  const { seedW, seedH, gap, columns, columnJitter, minTileH, maxTileH, absMinW } = config;
  const base = canvasBase(artworks);

  // Jittered column widths, renormalized to exactly fill seedW.
  const inner = seedW - gap * (columns + 1);
  const rawWeights = Array.from({ length: columns }, (_, i) => 1 + pseudoRandom(i * 7 + 3) * columnJitter);
  const weightSum = rawWeights.reduce((s, w) => s + w, 0);
  const colWidths = rawWeights.map((w) => (inner * w) / weightSum);
  const colX: number[] = [];
  {
    let x = gap;
    for (const w of colWidths) {
      colX.push(x);
      x += w + gap;
    }
  }
  const colHeights = new Array(columns).fill(0);

  const items: CanvasItem[] = [];
  let n = 0;

  // Always feed the currently-shortest column, and keep going until EVERY
  // column has reached the target height — never stop while one column is
  // still short, or that column leaves a bare gap before the next tiled
  // repeat starts. Columns may overshoot the target by less than one tile's
  // height; that's normal masonry raggedness, not a visible seam.
  while (Math.min(...colHeights) < seedH && n < base.length * 10) {
    let col = 0;
    for (let i = 1; i < columns; i++) {
      if (colHeights[i] < colHeights[col]) col = i;
    }

    const src = base[n % base.length];
    const cycle = Math.floor(n / base.length);
    const draft: CanvasDraft = cycle === 0 ? src : { ...src, id: `${src.id}__c${col}-${n}` };
    n += 1;

    const aspect = aspectOf(draft);
    const colW = colWidths[col];

    const [scaleLo, scaleHi] = KIND_SCALE[draft.kind];
    const scaleT = (pseudoRandom(n * 9 + col * 4) + 1) / 2;
    const scale = scaleLo + (scaleHi - scaleLo) * scaleT;
    const tileW = clamp(Math.round(colW * scale), absMinW, Math.round(colW));
    const tileH = clamp(Math.round(tileW / aspect), minTileH, maxTileH);

    // Keep tiles column-aligned for a calm infinite-canvas rhythm.
    const xInCol = Math.round((colW - tileW) / 2);

    items.push({
      id: draft.id,
      kind: draft.kind,
      name: draft.name,
      meta: draft.meta,
      image: draft.image,
      bio: draft.bio,
      tags: draft.tags,
      x: Math.round(colX[col] + xInCol),
      y: Math.round(colHeights[col] + gap),
      width: tileW,
      height: tileH,
      col,
    });
    colHeights[col] += tileH + gap;
  }

  // Each column's own period — where its content ends and its own pattern
  // repeats. These differ across columns (that's the point).
  const colPeriods = colHeights.map((h) => Math.round(h + gap));
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
const PACK_VERSION = "artworks-only-v2";

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

/** Hero / carousel frames for an artwork detail page. */
export function artworkImages(artwork: ArtworkCard): string[] {
  if (artwork.images?.length) return artwork.images;
  if (artwork.image) return [artwork.image];
  return [];
}

/** Hero / carousel frames for a venue detail page. */
export function venueImages(venue: VenueCard): string[] {
  if (venue.images?.length) return venue.images;
  if (venue.image) return [venue.image];
  return [];
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

export type PressItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  body?: string;
  image?: string;
  teaser?: boolean;
  url?: string;
};

export const PRESS: PressItem[] = [
  {
    id: "kbf-curators",
    title: "KBF Announces Curators For Students' Biennale 2025-26",
    date: "4 Dec 2025",
    image: "/press/featured.jpg",
    excerpt:
      "The Kochi Biennale Foundation (KBF) has announced the curators for Students' Biennale, a key educational initiative for emerging artists across India.",
    body: `The Kochi Biennale Foundation (KBF) has announced the curators for Students' Biennale, a key educational initiative of the Kochi Biennale Foundation for budding young artists. The programme works with state-funded art colleges across India, encouraging emerging artists to reflect on their practice and showcase their work on an international stage.

The Students' Biennale exhibition will open on 13 December 2025 and run alongside the Kochi-Muziris Biennale (KMB). The largest contemporary art festival in India, the sixth edition of the KMB is scheduled to open on 12 December 2025 until March 31, 2026.

The programme is led by curators/collectives who will mentor students from over 150 institutions across seven regions of the nation. They engage with the students, shortlist the exhibition participants, and work closely with participating students to develop their projects for the exhibition in Kochi.

With emphasis on alternative education beyond the classroom and learning from practice, the event serves as a forum to foster fine arts education in the country.

Mario D'Souza, Director of Programmes, Kochi Biennale Foundation, said, "Each edition of the Students' Biennale is a learning exercise. We work with students, educators, curators, and artists to understand the needs and shortcomings of art education in India."

He added, "For this edition, we examine what other forms of nourishing practice are possible outside of the market and grant economy. We invited curators as peers, who could exemplify and share these "other" frameworks across independent artist-run initiatives, residency models, collective work, teaching, and self-publishing, amongst others. We aspire to build a peer group and artist-to-artist network that is concerned with the 'now'. We want to learn together - about and with each other's contexts and challenges. We want to listen."

The curators/collectives for the seven regions are:

Savyasachi Anju Prabir, and Sukanya Deb for Punjab, Delhi, Haryana, Gujarat, Goa, and Rajasthan; Dr. Sudheesh Kottembram and Dr. Seethal CP for Kerala, Tamil Nadu, and Andhra Pradesh; Chinar Shah and Ashok Vish for Karnataka and Telangana states; and Kursheed Ahmed and Salman Basheer Baba for Jammu and Kashmir, Himachal Pradesh, Uttarakhand, and Ladakh.

Gabba, an artists-led space represented by Ritushree Mondal, Himangshu Sarma, Rabiul Khan, and Surajit Mudi, will guide students from West Bengal, Odisha, Uttar Pradesh, and Chhattisgarh.

Anga Art Collective leads workshops in the seven north-eastern states and Sikkim, and Secular Art Collective, represented by Salik Ansari, Bhushan Bhombale, Shamim Khan, and Shamooda Amrelia, leads workshops in Maharashtra, Bihar, Jharkhand, and Madhya Pradesh.`,
  },
  {
    id: "walkthrough",
    title: "Book A Guided Walkthrough",
    date: "1 Jan 2026",
    teaser: true,
    image: "/press/walkthrough.jpg",
    excerpt:
      "Book a guided walk-through of the Biennale exhibitions, led by our trained art mediators.",
  },
  {
    id: "guide-map",
    title: "The Ultimate Guide & Map to the Kochi-Muziris Biennale 2025/26 Venues",
    date: "15 Feb 2026",
    excerpt: "A practical guide to navigating Biennale venues across Fort Kochi.",
  },
  {
    id: "st-andrews",
    title: "St. Andrews Parish Hall - Students' Biennale at Kochi",
    date: "31 Mar 2026",
    excerpt: "On the Students' Biennale presentation at St. Andrews Parish Hall.",
    url: "https://catsofkochi.com/st-andrews-parish-hall-students-biennale-at-kochi/",
  },
  {
    id: "panic",
    title: "A warm kind of panic",
    date: "31 Dec 2025",
    excerpt: "Critical writing on works from Sensing Grounds.",
  },
  {
    id: "peta",
    title: "The Power of the Peta / Honour",
    date: "31 Dec 2025",
    excerpt: "Critical writing from the edition.",
  },
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

/** Raza - Students' Biennale Scholarship — the two Beaux-Arts de Marseille exchange
 *  artists (Figma 7:321, 10:1193, 10:1397). Shared by Programmes.tsx and
 *  RazaScholarship.tsx so the list only exists in one place. */
export const RAZA_SCHOLARS: { id: string; name: string; image: string }[] = [
  { id: "kaki-weiss", name: "Kaki Weiss", image: "/programmes/raza-kaki-weiss.jpg" },
  { id: "nina-durel", name: "Nina Durel", image: "/programmes/raza-nina-durel.jpg" },
];

/* Figma 10:1193 (Kaki) / 10:1397 (Nina) — both "Artwork Page" frames whose real
   content isn't finalised yet, so the design itself is Lorem Ipsum. Preserved
   verbatim (including Kaki's venue being unset in Figma, unlike Nina's "VKL
   Warehouse", and the description paragraph repeating twice) since matching
   the two frames exactly was the explicit ask. Shaped as full ArtworkCard
   records — not a bespoke subset — so the scholar spotlight can render them
   through the exact same ArtworkDetailBody used by the real artwork pages,
   rather than a hand-rolled layout that drifts from Figma over time. */
const RAZA_LOREM =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised thanks to these sheets and more recently with desktop publishing software like Aldus PageMaker and Microsoft Word including versions of Lorem Ipsum.";

export const RAZA_SCHOLAR_ARTWORKS: ArtworkCard[] = [
  {
    id: "kaki-weiss",
    title: "Lorem Ipsum",
    venue: "Lorem Ipsum",
    year: "2025 - 26",
    description: `${RAZA_LOREM}\n\n${RAZA_LOREM}`,
    artists: [{ name: "Kaki Weiss", institution: "National Institute of Design, Ahmedabad" }],
    materials: ["Lorem Ipsum | Variable", "Lorem Ipsum | Variable", "Lorem Ipsum | Variable"],
    dimensions: "Variable",
  },
  {
    id: "nina-durel",
    title: "Lorem Ipsum",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: `${RAZA_LOREM}\n\n${RAZA_LOREM}`,
    artists: [{ name: "Nina Durel", institution: "National Institute of Design, Ahmedabad" }],
    materials: ["Lorem Ipsum | Variable", "Lorem Ipsum | Variable", "Lorem Ipsum | Variable"],
    dimensions: "Variable",
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
