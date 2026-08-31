/** Deduplicated image preload + decode — shared across CMS, catalogue, and UI. */

const preloaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();

export type PreloadPriority = "high" | "low";

function attachPriority(img: HTMLImageElement, priority: PreloadPriority) {
  if (priority === "high" && "fetchPriority" in img) {
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
  }
}

/** Preload and decode a single URL. Safe to call repeatedly — deduped globally. */
export function preloadUrl(url: string, priority: PreloadPriority = "low"): Promise<void> {
  if (!url || typeof Image === "undefined") return Promise.resolve();

  const existing = inflight.get(url);
  if (existing) return existing;
  if (preloaded.has(url)) return Promise.resolve();

  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    attachPriority(img, priority);
    const finish = () => {
      preloaded.add(url);
      resolve();
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = url;
    void img.decode?.().then(finish).catch(finish);
  }).finally(() => {
    inflight.delete(url);
  });

  inflight.set(url, promise);
  return promise;
}

/** Preload many URLs — current index first when provided. */
export function preloadUrls(
  urls: readonly string[],
  priority: PreloadPriority = "low",
  focusIndex?: number,
): Promise<void[]> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (focusIndex != null && focusIndex >= 0 && focusIndex < unique.length) {
    const focused = unique[focusIndex];
    const rest = unique.filter((_, i) => i !== focusIndex);
    return Promise.all([
      preloadUrl(focused, priority),
      ...rest.map((url) => preloadUrl(url, "low")),
    ]);
  }
  return Promise.all(unique.map((url) => preloadUrl(url, priority)));
}

/** Preload slides around a carousel index (inclusive radius). */
export function preloadAdjacent(
  urls: readonly string[],
  index: number,
  radius = 1,
  priority: PreloadPriority = "low",
) {
  if (!urls.length) return Promise.resolve();
  const clamped = Math.min(Math.max(index, 0), urls.length - 1);
  const picked: string[] = [];
  for (let i = Math.max(0, clamped - radius); i <= Math.min(urls.length - 1, clamped + radius); i++) {
    if (urls[i]) picked.push(urls[i]);
  }
  return preloadUrls(picked, priority, picked.indexOf(urls[clamped]));
}

/** Run work when the browser is idle — falls back to a short timeout. */
export function whenIdle(task: () => void, timeoutMs = 1800) {
  if (typeof window === "undefined") return;
  const win = window as Window &
    typeof globalThis & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
  if (win.requestIdleCallback) {
    win.requestIdleCallback(() => task(), { timeout: timeoutMs });
    return;
  }
  globalThis.setTimeout(task, 120);
}
