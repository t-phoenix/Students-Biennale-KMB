import type { HomeCover, HomeUpdateCard } from "../homeCms/types";
import {
  ensureLcpImagePreload,
  preloadUrl,
  preloadUrlsConcurrent,
  waitForDomImages,
} from "../preloadImages";

const HERO_SLIDE_SELECTOR = ".home-hero__slide";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Aggressively warm Home CMS media, then wait for the painted hero <img>
 * nodes to finish load + decode so splash handoff has no blank frames.
 */
export async function warmHomeAssetsForSplash(
  covers: readonly HomeCover[],
  cards: readonly HomeUpdateCard[] = [],
): Promise<void> {
  const coverUrls = covers.map((c) => c.image_url?.trim()).filter(Boolean) as string[];
  const cardUrls = cards
    .map((c) => c.image_url?.trim())
    .filter((url): url is string => Boolean(url));

  const [primary, ...restCovers] = coverUrls;
  if (primary) {
    ensureLcpImagePreload(primary);
    await preloadUrl(primary, "high");
  }

  if (restCovers.length) {
    await preloadUrlsConcurrent(restCovers, "low", 4);
  }
  if (cardUrls.length) {
    // Cards are below the fold — start but don't block splash exit on them.
    void preloadUrlsConcurrent(cardUrls, "low", 3);
  }

  await waitForHeroDomReady(coverUrls.length);

  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch {
    // ignore
  }
}

/** Poll until hero slides exist in the DOM, then fully decode them. */
async function waitForHeroDomReady(expectedCount: number): Promise<void> {
  if (typeof document === "undefined") return;
  if (expectedCount <= 0) return;

  const deadline = performance.now() + 25_000;
  let imgs: HTMLImageElement[] = [];

  while (performance.now() < deadline) {
    imgs = Array.from(
      document.querySelectorAll<HTMLImageElement>(HERO_SLIDE_SELECTOR),
    ).filter((img) => Boolean(img.currentSrc || img.getAttribute("src")));

    if (imgs.length >= expectedCount) break;
    await sleep(40);
  }

  // Ensure slides stay visibility:visible so decode isn't deferred.
  for (const img of imgs) {
    img.style.visibility = "visible";
  }

  await waitForDomImages(imgs);

  // Double-check every slide reports a decoded bitmap.
  const stillPending = imgs.filter((img) => !img.complete || img.naturalWidth === 0);
  if (stillPending.length) {
    await waitForDomImages(stillPending);
  }
}
