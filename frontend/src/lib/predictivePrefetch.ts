import {
  artworkImages,
  getCanvasTier,
  LATEST_EDITION,
  type ArtworkCard,
  type CanvasTier,
} from "../data/site";
import {
  getDiscoverCanvasImageUrls,
  getDiscoverCanvasPack,
  getViewportDiscoverImageUrls,
  splitDiscoverImageUrls,
} from "./discoverCanvas";
import type { MappedCatalogue } from "./catalogue/types";
import {
  preloadUrl,
  preloadUrls,
  preloadUrlsConcurrent,
  whenIdle,
} from "./preloadImages";
import {
  peekHomeProgrammesBannerUrl,
  peekProgrammesHeroCovers,
} from "./programmesCms";

const IDLE_PREFETCH_MS = 3500;
const PREFETCH_CONCURRENCY = 2;

/** Likely next destinations from the home page — fetched during idle time. */
export function prefetchHomeDestinations(catalogue?: MappedCatalogue | null) {
  whenIdle(() => {
    const programmesHeroUrls = peekProgrammesHeroCovers().map((cover) => cover.image_url);
    const programmesBannerUrl = peekHomeProgrammesBannerUrl();
    const warm = [
      ...programmesHeroUrls,
      ...(programmesBannerUrl ? [programmesBannerUrl] : []),
    ];
    if (warm.length) {
      void preloadUrlsConcurrent(warm, "low", PREFETCH_CONCURRENCY);
    }

    if (catalogue?.heroUrls.length) {
      void preloadUrlsConcurrent(catalogue.heroUrls, "low", PREFETCH_CONCURRENCY);
    } else if (catalogue?.heroUrl) {
      void preloadUrl(catalogue.heroUrl);
    }

    if (catalogue?.artworks.length) {
      const covers = catalogue.artworks
        .slice(0, 18)
        .map((row) => row.image)
        .filter((url): url is string => Boolean(url));
      void preloadUrlsConcurrent(covers, "low", PREFETCH_CONCURRENCY);
    }
  }, IDLE_PREFETCH_MS);
}

/** All unique Discover canvas tile images — intent-based, concurrency-capped. */
export function prefetchDiscoverCanvas(
  artworks: readonly ArtworkCard[] | undefined,
  tier: CanvasTier = getCanvasTier(typeof window === "undefined" ? 1440 : window.innerWidth),
  sourceKey = "static",
) {
  const urls = getDiscoverCanvasImageUrls(artworks, tier, sourceKey);
  if (!urls.length) return;
  void preloadUrlsConcurrent(urls, "low", 4);
}

/** Viewport-first on Discover page mount, then idle-preload the rest. */
export function prefetchDiscoverViewport(
  artworks: readonly ArtworkCard[] | undefined,
  viewportW: number,
  viewportH: number,
  sourceKey = "static",
) {
  const tier = getCanvasTier(viewportW);
  const pack = getDiscoverCanvasPack(artworks, tier, sourceKey);
  const { visible, rest } = splitDiscoverImageUrls(pack, viewportW, viewportH);

  if (visible.length) {
    void preloadUrlsConcurrent(visible, "high", 4);
  }

  whenIdle(() => {
    if (rest.length) void preloadUrlsConcurrent(rest, "low", 4);
  }, IDLE_PREFETCH_MS);
}

/** Export viewport URL set for tile eager-loading. */
export function getDiscoverEagerImageUrls(
  artworks: readonly ArtworkCard[] | undefined,
  viewportW: number,
  viewportH: number,
  sourceKey = "static",
): ReadonlySet<string> {
  const tier = getCanvasTier(viewportW);
  const pack = getDiscoverCanvasPack(artworks, tier, sourceKey);
  return new Set(getViewportDiscoverImageUrls(pack, viewportW, viewportH));
}

/** Full gallery for an artwork — call on tile hover or detail open. */
export function prefetchArtworkGallery(artwork: ArtworkCard | undefined) {
  if (!artwork) return;
  const slides = artworkImages(artwork);
  void preloadUrls(slides, "high", 0);
}

/** Neighbouring artwork in catalogue sequence — for NEXT navigation. */
export function prefetchNextArtwork(
  artworks: readonly ArtworkCard[],
  currentId: string,
) {
  const idx = artworks.findIndex((row) => row.id === currentId);
  if (idx < 0 || !artworks.length) return;
  const next = artworks[(idx + 1) % artworks.length];
  prefetchArtworkGallery(next);
}

/** Hero images for a primary nav destination. */
export function prefetchRouteHero(
  to: string,
  catalogues: readonly MappedCatalogue[],
  artworks?: readonly ArtworkCard[],
  sourceKey?: string,
) {
  if (to.startsWith("/programmes")) {
    const heroCovers = peekProgrammesHeroCovers();
    if (heroCovers.length) {
      void preloadUrlsConcurrent(
        heroCovers.map((cover) => cover.image_url),
        "high",
        PREFETCH_CONCURRENCY,
      );
    }
    const programmesBannerUrl = peekHomeProgrammesBannerUrl();
    if (programmesBannerUrl) void preloadUrl(programmesBannerUrl, "high");
    return;
  }
  if (to.startsWith("/press")) {
    return;
  }
  if (to === "/artworks") {
    prefetchDiscoverCanvas(artworks, undefined, sourceKey);
    return;
  }

  const editionMatch = to.match(/^\/editions\/([^/]+)/);
  if (editionMatch) {
    const edition = catalogues.find((row) => row.years === editionMatch[1]);
    if (edition?.heroUrls.length) {
      void preloadUrlsConcurrent(edition.heroUrls, "high", PREFETCH_CONCURRENCY);
    } else if (edition?.heroUrl) {
      void preloadUrl(edition.heroUrl, "high");
    }
  }
}

/** After catalogue data resolves — warm current edition heroes and grid covers. */
export function prefetchCatalogueImages(catalogues: readonly MappedCatalogue[]) {
  whenIdle(() => {
    const current =
      catalogues.find((row) => row.isCurrent) ??
      catalogues.find((row) => row.years === LATEST_EDITION.id);
    if (!current) return;

    if (current.heroUrls.length) {
      void preloadUrlsConcurrent(current.heroUrls, "low", PREFETCH_CONCURRENCY);
    } else if (current.heroUrl) {
      void preloadUrl(current.heroUrl);
    }

    void preloadUrlsConcurrent(
      current.artworks
        .slice(0, 20)
        .map((row) => row.image)
        .filter((url): url is string => Boolean(url)),
      "low",
      PREFETCH_CONCURRENCY,
    );
  }, IDLE_PREFETCH_MS);
}
