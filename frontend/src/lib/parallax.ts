import { useLayoutEffect } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";

export interface ParallaxOptions {
  /** Parallax intensity scale: 'subtle' (±5%), 'standard' (±8%), 'hero' (±12%) */
  variant?: "subtle" | "standard" | "hero";
  /** Scrub lag in seconds (default 0.6 for buttery smooth tracking with Lenis) */
  scrub?: number | boolean;
}

/**
 * Checks whether an image or its container is eligible for parallax.
 * Ignores logos, UI icons, arrows, modal overlays, sketch canvas, and admin tools.
 */
function isEligibleImage(img: HTMLImageElement): boolean {
  if (img.dataset.noParallax === "true") return false;
  if (img.classList.contains("has-parallax-img")) return false;

  // Check if image or any ancestor requested no parallax
  const parentNoParallax = img.closest(
    "[data-no-parallax='true'], .detail__hero, .detail__portrait, .detail__venue-hero, .home-hero__slides, .home-programmes__banner, .programmes__hero, .programmes__hero-slides, .home-sensing, .home-sensing__scroll, .home-sensing__scroll-track, .home-sensing__scroll-item, .home-edition"
  );
  if (parentNoParallax) return false;

  // Skip tiny UI icons, non-content graphics, and graphic banners
  const src = img.getAttribute("src") || "";
  if (
    src.includes("/icons/") ||
    src.includes("favicon") ||
    src.includes("logo") ||
    src.includes("programmes-banner") ||
    src.includes("hero.jpg") ||
    src.includes("sensing-side") ||
    src.includes("sensing-") ||
    src.endsWith(".svg")
  ) {
    return false;
  }

  // Check ancestors
  const parent = img.parentElement;
  if (!parent) return false;

  // The Discover canvas moves as one field: a parallax on each of its ~1000 tiles made every
  // tile its own GPU layer with its own scroll trigger, which is what made swiping stutter
  // and flicker. The artwork sheet opened from it has no parallax either. Checked before the
  // size below, so its tiles don't each force a layout measurement either.
  const closestIgnored = img.closest(
    ".infinite-canvas, .canvas-expand, .site-header, .site-footer, .scribble-layer, .type-inspector, .adm-, [role='dialog'], .lightbox, .modal, .carousel-nav, .brand-arrow, .catalogue-list__thumb, .catalogue-list__preview-media, .catalogue-preview"
  );
  if (closestIgnored) return false;

  // Check element dimensions (skip tiny avatars/icons < 48px)
  const rect = img.getBoundingClientRect();
  if (rect.width > 0 && rect.width < 48) return false;
  if (rect.height > 0 && rect.height < 48) return false;

  return true;
}

/**
 * Finds the best bounding container for an image to clip parallax overflow.
 */
function findParallaxContainer(img: HTMLImageElement): HTMLElement {
  const customContainer = img.closest<HTMLElement>("[data-parallax-container]");
  if (customContainer) return customContainer;

  // Check direct parent or immediate media wrapper
  const parent = img.parentElement;
  if (!parent) return img;

  // If image is inside a figure, card media, frame, or slide wrapper
  const mediaWrapper = img.closest<HTMLElement>(
    "figure, .image-crossfade, [class*='__media'], [class*='__frame'], [class*='__thumb'], [class*='__cover'], [class*='__slide'], [class*='__banner'], [class*='__portrait'], [class*='__figure']"
  );

  if (mediaWrapper && mediaWrapper !== document.body && !mediaWrapper.classList.contains("site-layout__main")) {
    return mediaWrapper;
  }

  return parent;
}

/**
 * Initializes noticeable, high-end parallax across all eligible images within a root element.
 */
export function initImageParallax(root: HTMLElement = document.body): () => void {
  if (prefersReducedMotion() || typeof window === "undefined") {
    return () => {};
  }

  const triggers = new Map<HTMLImageElement, ScrollTrigger>();
  const processedImages = new Set<HTMLImageElement>();
  // Pictures further down the page, set up a few at a time while the browser is idle.
  const pending = new Set<HTMLImageElement>();
  let stopped = false;

  interface Plan {
    img: HTMLImageElement;
    container: HTMLElement;
    travelPercent: number;
    scaleFactor: number;
    scrubVal: number;
  }

  // Only reads the page. Every picture of a batch is measured first and changed after, so the
  // browser lays the page out once per batch instead of once per picture.
  const plan = (img: HTMLImageElement): Plan | null => {
    if (processedImages.has(img) || !isEligibleImage(img)) return null;

    const container = findParallaxContainer(img);
    if (!container) return null;

    // Determine variant based on container size and classes
    const isHero =
      container.classList.contains("home-hero") ||
      container.classList.contains("detail__hero") ||
      container.classList.contains("programmes__feature") ||
      container.classList.contains("press__feature") ||
      container.classList.contains("residencies__feature") ||
      container.dataset.parallax === "hero" ||
      img.dataset.parallax === "hero" ||
      (container.offsetWidth > window.innerWidth * 0.8 && container.offsetHeight > 500);

    const isCurator =
      container.classList.contains("edition-card__frame") ||
      container.classList.contains("curator-panel__portrait") ||
      container.classList.contains("detail__portrait") ||
      Boolean(container.closest(".edition-card--curator, .curator-panel, .detail__portrait")) ||
      img.src.includes("/curators/");

    const isMobile = window.innerWidth < 768;
    // Calibrated travel & scale: subtle & rock-solid on mobile to prevent clipping/stutter, editorial on desktop
    const travelPercent = isHero ? (isMobile ? 8 : 10) : (isMobile ? 6 : 8);
    // Curator images scaled up by 2% from old value (All Devices) to absorb vertical parallax travel without ever exposing grey container borders
    const baseScaleFactor = isHero ? (isMobile ? 1.14 : 1.18) : (isMobile ? 1.12 : 1.14);
    const scaleFactor = isCurator ? baseScaleFactor + 0.02 : baseScaleFactor;
    const scrubVal = isMobile ? 0.4 : 0.6; // Snappier finger tracking on touch devices
    return { img, container, travelPercent, scaleFactor, scrubVal };
  };

  // Only writes to the page.
  const apply = ({ img, container, travelPercent, scaleFactor, scrubVal }: Plan) => {
    if (processedImages.has(img)) return;
    processedImages.add(img);
    pending.delete(img);

    // Ensure container hides overflow
    container.classList.add("has-parallax-container");
    img.classList.add("has-parallax-img");

    // Apply hardware-accelerated transform
    gsap.set(img, {
      scale: scaleFactor,
      transformOrigin: "50% 50%",
      force3D: true,
      willChange: "transform",
    });

    const tween = gsap.fromTo(
      img,
      { yPercent: -travelPercent },
      {
        yPercent: travelPercent,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top bottom",
          end: "bottom top",
          scrub: scrubVal,
          invalidateOnRefresh: true,
        },
      }
    );

    if (tween.scrollTrigger) {
      triggers.set(img, tween.scrollTrigger);
    }
  };

  const release = (img: HTMLImageElement) => {
    triggers.get(img)?.kill();
    triggers.delete(img);
    processedImages.delete(img);
    pending.delete(img);
  };

  const run = (imgs: HTMLImageElement[]) => {
    const plans = imgs.map(plan).filter((p): p is Plan => p !== null);
    plans.forEach(apply);
    return plans.length;
  };

  // New content usually moves what is below it: re-measure every scroll-linked animation once,
  // after the content has settled and every picture has its parallax.
  let refreshTimer = 0;
  let addedSinceRefresh = false;
  const scheduleRefresh = () => {
    window.clearTimeout(refreshTimer);
    if (!addedSinceRefresh || pending.size) return;
    refreshTimer = window.setTimeout(() => {
      addedSinceRefresh = false;
      ScrollTrigger.refresh();
    }, 250);
  };

  // A whole grid arriving at once (the 85 cards of the Editions Artworks tab) used to have every
  // picture set up before the new view could appear, which held the tab switch up for a third
  // of a second on a phone. Pictures on or near the screen are still set up before the browser
  // paints, so none is ever seen without its parallax scale and then jumps. The rest follow in
  // small slices between frames, nearest first, long before they can be scrolled to.
  const SLICE = 4;
  let idleHandle = 0;
  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const cancelDrain = () => {
    if (!idleHandle) return;
    if (win.cancelIdleCallback) win.cancelIdleCallback(idleHandle);
    else window.clearTimeout(idleHandle);
    idleHandle = 0;
  };
  const drain = () => {
    idleHandle = 0;
    if (stopped) return;
    const vh = window.innerHeight;
    const list: { img: HTMLImageElement; d: number }[] = [];
    pending.forEach((img) => {
      if (!img.isConnected || processedImages.has(img)) {
        pending.delete(img);
        return;
      }
      const r = img.getBoundingClientRect();
      list.push({ img, d: r.top > vh ? r.top - vh : r.bottom < 0 ? -r.bottom : 0 });
    });
    list.sort((a, b) => a.d - b.d);
    const slice = list.slice(0, SLICE).map((x) => x.img);
    slice.forEach((img) => pending.delete(img));
    if (run(slice)) addedSinceRefresh = true;
    if (pending.size) scheduleDrain();
    else scheduleRefresh();
  };
  const scheduleDrain = () => {
    if (idleHandle || stopped) return;
    idleHandle = win.requestIdleCallback
      ? win.requestIdleCallback(drain, { timeout: 250 })
      : window.setTimeout(drain, 32);
  };

  const enqueue = (imgs: Iterable<HTMLImageElement>) => {
    const vh = window.innerHeight;
    const now: HTMLImageElement[] = [];
    let later = false;
    for (const img of imgs) {
      if (processedImages.has(img) || pending.has(img)) continue;
      const r = img.getBoundingClientRect();
      if (r.bottom > -vh * 0.5 && r.top < vh * 1.5) now.push(img);
      else {
        pending.add(img);
        later = true;
      }
    }
    if (run(now)) addedSinceRefresh = true;
    if (later) scheduleDrain();
    scheduleRefresh();
  };

  enqueue(root.querySelectorAll<HTMLImageElement>("img"));

  // Pages fill in after the route changes - the code for the page, then its content from the
  // CMS, then its images. Scanning once at the route change found nothing on a direct load or a
  // refresh, so the parallax never started there. Images are now set up as they arrive. The
  // observer runs before the browser paints, so an image near the screen never shows first
  // without its parallax scale and then jumps.
  const observer = new MutationObserver((records) => {
    const added = new Set<HTMLImageElement>();
    for (const record of records) {
      record.removedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        const imgs = node instanceof HTMLImageElement ? [node] : Array.from(node.querySelectorAll<HTMLImageElement>("img"));
        imgs.forEach((img) => {
          if (!img.isConnected) release(img);
        });
      });
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node instanceof HTMLImageElement) added.add(node);
        else node.querySelectorAll<HTMLImageElement>("img").forEach((img) => added.add(img));
      });
    }
    if (added.size) enqueue([...added].filter((img) => img.isConnected));
  });
  observer.observe(root, { childList: true, subtree: true });

  // Return teardown function
  return () => {
    stopped = true;
    observer.disconnect();
    cancelDrain();
    pending.clear();
    window.clearTimeout(refreshTimer);
    // Pictures of the page just left are already gone: putting each one back as it was only
    // measured the page again and again, between the tap and the new page appearing.
    triggers.forEach((st, img) => (img.isConnected ? st.kill() : st.kill(false)));
    processedImages.forEach((img) => {
      if (!img.isConnected) return;
      gsap.set(img, { clearProps: "transform,scale,yPercent,willChange" });
      img.classList.remove("has-parallax-img");
    });
  };
}

/**
 * React hook to automatically bind image parallax to the current page/component scope.
 */
export function useImageParallax(
  scopeRef?: React.RefObject<HTMLElement | null>,
  deps: React.DependencyList = []
) {
  // Before paint: applied any later, an image already on screen visibly jumps in size.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const root = scopeRef?.current || document.body;
    const cleanup = initImageParallax(root);

    return () => {
      cleanup();
    };
  }, deps);
}
