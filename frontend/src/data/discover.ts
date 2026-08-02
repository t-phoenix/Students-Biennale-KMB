export type CanvasKind = "curator" | "artist" | "artwork" | "venue";

export type CanvasItem = {
  id: string;
  kind: CanvasKind;
  name: string;
  meta: string;
  bio: string;
  image?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Seed mosaic for Discover Artworks (Archive UX). Visuals use placeholders until Figma assets are wired. */
const DRAFT: Omit<CanvasItem, "x" | "y" | "width" | "height">[] = [
  {
    id: "aw-1",
    kind: "artwork",
    name: "What absence carries",
    meta: "VKL Warehouse · 2025–26",
    bio: "Traces the quiet terrain where memory, grief and body entwine.",
  },
  {
    id: "aw-2",
    kind: "artwork",
    name: "The quiet beneath the rubble",
    meta: "VKL Warehouse · 2025–26",
    bio: "A material enquiry into residue, labour, and listening.",
  },
  {
    id: "aw-3",
    kind: "artwork",
    name: "A warm kind of panic",
    meta: "BMS Warehouse · 2025–26",
    bio: "Collective gestures staged across domestic and public thresholds.",
  },
  {
    id: "aw-4",
    kind: "artwork",
    name: "The house that remembers",
    meta: "BMS Warehouse · 2025–26",
    bio: "Architecture as an archive of unfinished belonging.",
  },
  {
    id: "aw-5",
    kind: "artwork",
    name: "Blind Command",
    meta: "St. Andrews Parish Hall · 2025–26",
    bio: "A4 Collective — disobedient practices of looking.",
  },
  {
    id: "aw-6",
    kind: "artwork",
    name: "Residual Marks",
    meta: "VKL Warehouse · 2025–26",
    bio: "Stitched scars and layered pages as forms of sensing.",
  },
  {
    id: "cu-1",
    kind: "curator",
    name: "GABAA",
    meta: "Curatorial collective",
    bio: "te(a)m-plurality — Sensing Grounds curatorial note.",
  },
  {
    id: "ve-1",
    kind: "venue",
    name: "VKL Warehouse",
    meta: "Fort Kochi",
    bio: "Primary Students' Biennale venue for this edition.",
  },
];

function pack(items: Omit<CanvasItem, "x" | "y" | "width" | "height">[]): CanvasItem[] {
  const sizes = [
    { width: 280, height: 360 },
    { width: 320, height: 240 },
    { width: 240, height: 300 },
    { width: 360, height: 280 },
  ];
  let x = 40;
  let y = 40;
  let rowH = 0;
  const maxW = 1600;

  return items.map((item, i) => {
    const size = sizes[i % sizes.length];
    if (x + size.width > maxW) {
      x = 40;
      y += rowH + 48;
      rowH = 0;
    }
    const placed: CanvasItem = { ...item, ...size, x, y };
    x += size.width + 48;
    rowH = Math.max(rowH, size.height);
    return placed;
  });
}

let pool: CanvasItem[] | null = null;

export function getCanvasPool(): CanvasItem[] {
  if (!pool) pool = pack(DRAFT);
  return pool;
}

export function getCanvasSeedSize() {
  const items = getCanvasPool();
  let maxX = 0;
  let maxY = 0;
  for (const item of items) {
    maxX = Math.max(maxX, item.x + item.width);
    maxY = Math.max(maxY, item.y + item.height);
  }
  return { width: maxX + 120, height: maxY + 120 };
}
