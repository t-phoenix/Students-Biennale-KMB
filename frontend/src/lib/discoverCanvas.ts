import {
  getCanvasPack,
  getCanvasTier,
  type ArtworkCard,
  type CanvasItem,
  type CanvasPack,
  type CanvasTier,
} from "../data/site";

const REPEAT_X = 3;
const REPEAT_Y = 3;

/** Unique tile image URLs used by the Discover canvas pack. */
export function getDiscoverCanvasImageUrls(
  artworks: readonly ArtworkCard[] | undefined,
  tier: CanvasTier = getCanvasTier(typeof window === "undefined" ? 1440 : window.innerWidth),
  sourceKey = "static",
): string[] {
  const pack = getCanvasPack(tier, artworks ? [...artworks] : undefined, sourceKey);
  return [...new Set(pack.items.map((item) => item.image).filter((url): url is string => Boolean(url)))];
}

export function getDiscoverCanvasPack(
  artworks: readonly ArtworkCard[] | undefined,
  tier: CanvasTier = getCanvasTier(typeof window === "undefined" ? 1440 : window.innerWidth),
  sourceKey = "static",
): CanvasPack {
  return getCanvasPack(tier, artworks ? [...artworks] : undefined, sourceKey);
}

function rectsOverlap(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/** Image URLs for tiles visible at the canvas open position — matches InfiniteCanvas initial offset. */
export function getViewportDiscoverImageUrls(
  pack: CanvasPack,
  viewportW: number,
  viewportH: number,
  offsetX?: number,
  offsetY = -40,
): string[] {
  const { items, seedW, colPeriods } = pack;
  const panX = offsetX ?? -(seedW - viewportW) / 2;
  const panY = offsetY;
  const view = {
    left: -panX,
    top: -panY,
    right: -panX + viewportW,
    bottom: -panY + viewportH,
  };

  const urls = new Set<string>();
  const itemsByCol: CanvasItem[][] = Array.from({ length: colPeriods.length }, () => []);
  for (const item of items) itemsByCol[item.col]?.push(item);

  for (let tx = 0; tx < REPEAT_X; tx++) {
    for (let col = 0; col < colPeriods.length; col++) {
      const period = colPeriods[col] || 1;
      for (let ty = 0; ty < REPEAT_Y; ty++) {
        for (const item of itemsByCol[col] ?? []) {
          if (!item.image) continue;
          const tile = {
            left: tx * seedW + item.x,
            top: item.y + ty * period,
            right: tx * seedW + item.x + item.width,
            bottom: item.y + ty * period + item.height,
          };
          if (rectsOverlap(tile, view)) urls.add(item.image);
        }
      }
    }
  }

  return [...urls];
}

/** Split pack URLs into viewport-first and remainder sets. */
export function splitDiscoverImageUrls(
  pack: CanvasPack,
  viewportW: number,
  viewportH: number,
) {
  const all = [...new Set(pack.items.map((item) => item.image).filter((url): url is string => Boolean(url)))];
  const visible = getViewportDiscoverImageUrls(pack, viewportW, viewportH);
  const visibleSet = new Set(visible);
  const rest = all.filter((url) => !visibleSet.has(url));
  return { all, visible, rest };
}
