/** Compressed splash tiles — all catalogue artworks at ~160px (~72KB total). */

export const SPLASH_TILES = [
  "/splash/tiles/absence.jpg",
  "/splash/tiles/rubble.jpg",
  "/splash/tiles/panic.jpg",
  "/splash/tiles/residual-marks.jpg",
  "/splash/tiles/dar-dara-dariya.jpg",
  "/splash/tiles/milk-distributors.jpg",
  "/splash/tiles/panopticon.jpg",
  "/splash/tiles/uncanny-rusty-sign.jpg",
  "/splash/tiles/where-memories-are-immured.jpg",
  "/splash/tiles/labour-of-the-imagined.jpg",
] as const;

/** Repeat tiles so the globe reads as a dense sphere without extra network weight. */
export function buildSplashTileSet(copies = 5): string[] {
  const out: string[] = [];
  for (let i = 0; i < copies; i += 1) {
    out.push(...SPLASH_TILES);
  }
  return out;
}

/** Brand star colors for the burst (SB red / green / teal + soft white). */
export const SPLASH_STAR_COLORS = [
  "#e83239",
  "#b4cf45",
  "#7bc8c0",
  "#ffffff",
] as const;

/**
 * Fibonacci sphere points for a globe layout.
 * Returns pixel offsets centered at origin.
 */
export function fibonacciSphere(count: number, radius: number): { x: number; y: number; z: number }[] {
  if (count <= 0) return [];
  const points: { x: number; y: number; z: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    points.push({
      x: Math.cos(theta) * r * radius,
      y: y * radius,
      z: Math.sin(theta) * r * radius,
    });
  }
  return points;
}
