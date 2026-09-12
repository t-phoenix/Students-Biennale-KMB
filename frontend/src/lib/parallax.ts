import { useEffect } from "react";
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

  // Check if image or any ancestor requested no parallax
  const parentNoParallax = img.closest(
    "[data-no-parallax='true'], .home-programmes__banner, .programmes__hero, .programmes__hero-slides"
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
    src.endsWith(".svg")
  ) {
    return false;
  }

  // Check element dimensions (skip tiny avatars/icons < 48px)
  const rect = img.getBoundingClientRect();
  if (rect.width > 0 && rect.width < 48) return false;
  if (rect.height > 0 && rect.height < 48) return false;

  // Check ancestors
  const parent = img.parentElement;
  if (!parent) return false;

  const closestIgnored = img.closest(
    ".site-header, .site-footer, .scribble-layer, .type-inspector, .adm-, [role='dialog'], .lightbox, .modal, .carousel-nav, .brand-arrow"
  );
  if (closestIgnored) return false;

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

  const triggers: ScrollTrigger[] = [];
  const processedImages = new Set<HTMLImageElement>();

  // Query all content images
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));

  images.forEach((img) => {
    if (!isEligibleImage(img) || processedImages.has(img)) return;
    processedImages.add(img);

    const container = findParallaxContainer(img);
    if (!container) return;

    // Determine variant based on container size and classes
    const isHero =
      container.classList.contains("home-hero") ||
      container.classList.contains("detail__hero") ||
      container.classList.contains("programmes__feature") ||
      container.classList.contains("press__feature") ||
      container.classList.contains("residencies__feature") ||
      container.dataset.parallax === "hero" ||
      (container.offsetWidth > window.innerWidth * 0.8 && container.offsetHeight > 500);

    const travelPercent = isHero ? 10 : 8; // Noticeable, premium travel without distorting composition
    const scaleFactor = isHero ? 1.18 : 1.14; // Headroom to prevent blank edges during vertical travel

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
          scrub: 0.6, // Smooth organic lag aligned with Lenis scroll
          invalidateOnRefresh: true,
        },
      }
    );

    if (tween.scrollTrigger) {
      triggers.push(tween.scrollTrigger);
    }
  });

  // Return teardown function
  return () => {
    triggers.forEach((st) => st.kill());
    processedImages.forEach((img) => {
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
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let cleanup: (() => void) | undefined;

    // Small raf delay to ensure DOM and images are in place after route mount
    const rafId = requestAnimationFrame(() => {
      const root = scopeRef?.current || document.body;
      cleanup = initImageParallax(root);
      ScrollTrigger.refresh();
    });

    return () => {
      cancelAnimationFrame(rafId);
      cleanup?.();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}
