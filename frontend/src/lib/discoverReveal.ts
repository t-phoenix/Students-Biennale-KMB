import type { CanvasItem } from "../data/site";

/** Tracks images that have already played their entrance on Discover. */
const revealedImages = new Set<string>();

export function isDiscoverImageRevealed(url: string): boolean {
  return revealedImages.has(url);
}

export function markDiscoverImageRevealed(url: string) {
  revealedImages.add(url);
}

/** Stagger delay from viewport center — nearer tiles emerge first. */
export function getTileRevealDelay(
  item: CanvasItem,
  tx: number,
  ty: number,
  colPeriod: number,
  seedW: number,
  panX: number,
  panY: number,
  viewportW: number,
  viewportH: number,
): number {
  const tileCx = tx * seedW + item.x + item.width / 2 + panX;
  const tileCy = item.y + ty * colPeriod + item.height / 2 + panY;
  const viewCx = viewportW / 2;
  const viewCy = viewportH / 2;
  const dist = Math.hypot(tileCx - viewCx, tileCy - viewCy);
  const maxDist = Math.hypot(viewportW, viewportH) * 0.52;
  return Math.min(0.85, (dist / maxDist) * 0.85);
}
