import { artworkImages, LATEST_EDITION, type ArtworkCard } from "../data/site";
import type { MappedCatalogue } from "./catalogue/types";
import { preloadUrl, preloadUrls, whenIdle } from "./preloadImages";

const STATIC_ROUTE_HEROES = [
  "/programmes/hero.jpg",
  "/home/programmes-banner.jpg",
  "/home/press-featured.jpg",
] as const;

const HOME_SENSING_STRIP = [
  "/home/sensing-wide.jpg",
  "/home/sensing-side.jpg",
] as const;

/** Likely next destinations from the home page — fetched during idle time. */
export function prefetchHomeDestinations(catalogue?: MappedCatalogue | null) {
  whenIdle(() => {
    void preloadUrls(STATIC_ROUTE_HEROES);
    void preloadUrls(HOME_SENSING_STRIP);

    if (catalogue?.heroUrls.length) {
      void preloadUrls(catalogue.heroUrls);
    } else if (catalogue?.heroUrl) {
      void preloadUrl(catalogue.heroUrl);
    }

    if (catalogue?.artworks.length) {
      const covers = catalogue.artworks
        .slice(0, 18)
        .map((row) => row.image)
        .filter((url): url is string => Boolean(url));
      void preloadUrls(covers);
    }
  });
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
export function prefetchRouteHero(to: string, catalogues: readonly MappedCatalogue[]) {
  if (to.startsWith("/programmes")) {
    void preloadUrl("/programmes/hero.jpg", "high");
    return;
  }
  if (to.startsWith("/press")) {
    void preloadUrl("/home/press-featured.jpg", "high");
    return;
  }
  if (to === "/artworks") {
    const current =
      catalogues.find((row) => row.isCurrent) ??
      catalogues.find((row) => row.years === LATEST_EDITION.id);
    if (current?.artworks.length) {
      void preloadUrls(
        current.artworks
          .slice(0, 12)
          .map((row) => row.image)
          .filter((url): url is string => Boolean(url)),
      );
    }
    return;
  }

  const editionMatch = to.match(/^\/editions\/([^/]+)/);
  if (editionMatch) {
    const edition = catalogues.find((row) => row.years === editionMatch[1]);
    if (edition?.heroUrls.length) void preloadUrls(edition.heroUrls, "high");
    else if (edition?.heroUrl) void preloadUrl(edition.heroUrl, "high");
  }
}

/** After catalogue data resolves — warm current edition heroes and grid covers. */
export function prefetchCatalogueImages(catalogues: readonly MappedCatalogue[]) {
  whenIdle(() => {
    const current =
      catalogues.find((row) => row.isCurrent) ??
      catalogues.find((row) => row.years === LATEST_EDITION.id);
    if (!current) return;

    if (current.heroUrls.length) void preloadUrls(current.heroUrls);
    else if (current.heroUrl) void preloadUrl(current.heroUrl);

    void preloadUrls(
      current.artworks
        .slice(0, 20)
        .map((row) => row.image)
        .filter((url): url is string => Boolean(url)),
    );
  });
}
