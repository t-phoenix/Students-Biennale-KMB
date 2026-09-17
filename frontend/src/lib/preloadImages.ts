/** Deduplicated image preload + decode — shared across CMS, catalogue, and UI. */

const preloaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();
const WARM_STORAGE_KEY = "sb-img-warm-v1";

export type PreloadPriority = "high" | "low";

function readWarmManifest(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(WARM_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeWarmManifest(url: string) {
  if (typeof sessionStorage === "undefined") return;
  try {
    const warm = readWarmManifest();
    warm.add(url);
    sessionStorage.setItem(WARM_STORAGE_KEY, JSON.stringify([...warm]));
  } catch {
    // Quota or private mode — in-memory cache still applies.
  }
}

function attachPriority(img: HTMLImageElement, priority: PreloadPriority) {
  if (priority === "high" && "fetchPriority" in img) {
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
  }
}

/** Resolve only after the image has loaded and decoded into a paintable bitmap. */
async function loadAndDecode(img: HTMLImageElement): Promise<void> {
  if (!img.complete || img.naturalWidth === 0) {
    await new Promise<void>((resolve) => {
      const done = () => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
        resolve();
      };
      img.addEventListener("load", done);
      img.addEventListener("error", done);
    });
  }
  try {
    if (typeof img.decode === "function") {
      await img.decode();
    }
  } catch {
    // Decode can reject for broken images — treat as settled.
  }
}

/** Preload and decode a single URL. Safe to call repeatedly — deduped globally. */
export function preloadUrl(url: string, priority: PreloadPriority = "low"): Promise<void> {
  if (!url || typeof Image === "undefined") return Promise.resolve();

  const existing = inflight.get(url);
  if (existing) return existing;
  if (preloaded.has(url)) return Promise.resolve();

  const promise = (async () => {
    const img = new Image();
    img.decoding = "async";
    attachPriority(img, priority);
    img.src = url;
    await loadAndDecode(img);
    preloaded.add(url);
    writeWarmManifest(url);
  })().finally(() => {
    inflight.delete(url);
  });

  inflight.set(url, promise);
  return promise;
}

/**
 * Wait until matching DOM <img> elements are fully loaded + decoded.
 * Prefer this over detached Image() when the painted nodes already exist.
 */
export async function waitForDomImages(
  imgs: ArrayLike<HTMLImageElement> | HTMLImageElement[],
): Promise<void> {
  const list = Array.from(imgs);
  if (!list.length) return;
  await Promise.all(
    list.map(async (img) => {
      if (!img.getAttribute("src") && !img.currentSrc) return;
      await loadAndDecode(img);
    }),
  );
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

/** Preload URLs with a concurrency cap — avoids saturating the network on Discover. */
export function preloadUrlsConcurrent(
  urls: readonly string[],
  priority: PreloadPriority = "low",
  concurrency = 4,
): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (!unique.length) return Promise.resolve();

  let index = 0;
  const worker = async () => {
    while (index < unique.length) {
      const url = unique[index];
      index += 1;
      await preloadUrl(url, priority);
    }
  };

  const workers = Math.min(concurrency, unique.length);
  return Promise.all(Array.from({ length: workers }, worker)).then(() => undefined);
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

/** Whether a URL was preloaded this session (memory or session manifest). */
export function isImageWarm(url: string): boolean {
  return preloaded.has(url) || readWarmManifest().has(url);
}

const LCP_PRELOAD_ID = "sb-lcp-hero-preload";

/** Keep a single high-priority image preload hint in <head> for LCP. */
export function ensureLcpImagePreload(url: string) {
  if (!url || typeof document === "undefined") return;
  let link = document.getElementById(LCP_PRELOAD_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = LCP_PRELOAD_ID;
    link.rel = "preload";
    link.as = "image";
    document.head.appendChild(link);
  }
  if (link.href !== new URL(url, document.baseURI).href) {
    link.href = url;
  }
}
