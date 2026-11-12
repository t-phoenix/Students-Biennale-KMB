/** Deduplicated image preload + decode — shared across CMS, catalogue, and UI. */

const preloaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();
/** Pictures someone is waiting for right now (the one just opened). */
const urgent = new Set<Promise<void>>();
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
  if (priority === "high") {
    urgent.add(promise);
    yieldBackground(url);
    void promise.catch(() => undefined).finally(() => urgent.delete(promise));
  }
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

/**
 * Pictures that are only needed later (other slides, the next artwork): fetched one after
 * another, starting once the page has shown, so they never compete with what is on screen.
 */
const turnQueue: string[] = [];
let turnCurrent: { img: HTMLImageElement; url: string; stopped: boolean } | null = null;

/** Someone is now waiting for a picture: a background download in progress steps aside (it is
 *  stopped and put back at the front of the queue) so the wanted picture has the connection. */
function yieldBackground(wanted: string) {
  const current = turnCurrent;
  if (!current || current.stopped || current.url === wanted) return;
  current.stopped = true;
  current.img.removeAttribute("src");
  turnQueue.unshift(current.url);
}
let turnRunning = false;
export function preloadInTurn(urls: readonly string[]) {
  for (const url of urls) {
    if (url && !preloaded.has(url) && !inflight.has(url) && !turnQueue.includes(url)) turnQueue.push(url);
  }
  if (turnRunning || !turnQueue.length) return;
  turnRunning = true;
  whenIdle(async () => {
    while (turnQueue.length) {
      // Never alongside a picture someone is waiting for: it gets the whole connection first.
      while (urgent.size) await Promise.allSettled([...urgent]);
      const next = turnQueue.shift()!;
      if (preloaded.has(next)) continue;
      const pending = inflight.get(next);
      if (pending) {
        await pending.catch(() => undefined);
        continue;
      }
      const img = new Image();
      img.decoding = "async";
      attachPriority(img, "low");
      const current = { img, url: next, stopped: false };
      turnCurrent = current;
      img.src = next;
      await loadAndDecode(img);
      turnCurrent = null;
      if (!current.stopped && img.naturalWidth > 0) {
        preloaded.add(next);
        writeWarmManifest(next);
      }
    }
    turnRunning = false;
  }, 1200);
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
