import { DUR, EASE, gsap, prefersReducedMotion } from "./motion";

/**
 * Gentle settle, shared by every page. The first time a framed picture comes into view it eases from 104% down to
 * its resting size inside its frame, on the same spring as everything else arriving. Pictures
 * in a closed drawer settle when the drawer opens. Uses the independent CSS `scale` property,
 * so it never fights the scroll parallax or the hover zoom (both use transform).
 */

/** Never touched: things with their own motion, or not content pictures. */
const SKIP = [
  "[data-motion-skip]",
  ".site-header",
  ".site-footer",
  ".scribble-layer",
  "[class*='splash']",
  "[class*='canvas']",
  "[class*='slider']",
  "[class*='carousel']",
  "[class*='lightbox']",
  "[class*='hero']",
  "[class*='loader']",
].join(", ");

const SETTLE_FROM = 1.04;

const isFramed = (img: HTMLElement) => {
  const parent = img.parentElement;
  if (!parent) return false;
  const o = getComputedStyle(parent).overflow;
  return o.includes("hidden") || o.includes("clip");
};

export function observeImageSettle(root: HTMLElement): () => void {
  if (typeof window === "undefined" || prefersReducedMotion()) return () => {};
  const seen = new WeakSet<Element>();
  const running = new Set<HTMLElement>();

  const settle = (img: HTMLElement) => {
    running.add(img);
    img.style.setProperty("--settle-scale", String(SETTLE_FROM));
    img.style.setProperty("scale", "var(--settle-scale)");
    gsap.to(img, {
      "--settle-scale": 1,
      duration: DUR.reveal * 1.15,
      ease: EASE.reveal,
      onComplete: () => done(img),
    });
  };
  const done = (img: HTMLElement) => {
    running.delete(img);
    gsap.killTweensOf(img, "--settle-scale");
    img.style.removeProperty("scale");
    img.style.removeProperty("--settle-scale");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target as HTMLElement;
        observer.unobserve(img);
        settle(img);
      });
    },
    { rootMargin: "0px 0px -4% 0px" },
  );

  const scan = () => {
    root.querySelectorAll<HTMLElement>("img").forEach((img) => {
      if (seen.has(img)) return;
      seen.add(img);
      if (img.closest(SKIP) || !isFramed(img)) return;
      // Logos and small marks keep their edges.
      if (img.getBoundingClientRect().width < 120) return;
      // Already passed (a restored scroll position): nothing to settle.
      if (img.getBoundingClientRect().bottom < 0) return;
      observer.observe(img);
    });
  };
  const mutations = new MutationObserver(scan);
  mutations.observe(root, { childList: true, subtree: true });
  scan();

  return () => {
    mutations.disconnect();
    observer.disconnect();
    running.forEach(done);
  };
}
