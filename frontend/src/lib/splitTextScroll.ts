import { gsap, SplitText, prefersReducedMotion } from "./motion";

export interface SplitLinesScrollOptions {
  trigger?: Element | string;
  start?: string;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
}

/**
 * Applies responsive masked line reveals on scroll using GSAP SplitText (autoSplit + mask).
 * Matches the official GSAP demo: https://demos.gsap.com/demo/responsive-line-splits-on-scroll/
 *
 * Each line is wrapped in a clipping mask (`mask: "lines"`).
 * Lines wipe upward from within their individual overflow-clipped masks.
 * The outer container never shifts or jumps, giving a stable, luxurious editorial feel.
 * With `autoSplit: true`, line splits automatically recalculate on resize or font loading.
 */
export function splitLinesOnScroll(
  targets: gsap.DOMTarget,
  options: SplitLinesScrollOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};
  if (prefersReducedMotion()) return () => {};

  const elements = gsap.utils.toArray(targets) as HTMLElement[];
  if (!elements.length) return () => {};

  const instances: SplitText[] = [];
  let isCleanedUp = false;

  const init = () => {
    if (isCleanedUp) return;

    elements.forEach((el) => {
      if (!el || !el.textContent?.trim()) return;
      // Skip hidden / unmounted elements (e.g. collapsed drawers)
      if (el.offsetParent === null && el.getClientRects().length === 0) return;

      // Avoid double splitting on the same element
      if ((el as any)._splitTextActive) {
        try {
          (el as any)._splitTextActive.revert();
          (el as any)._splitTextActive.kill();
        } catch (_) {}
      }

      const triggerEl = options.trigger
        ? typeof options.trigger === "string"
          ? document.querySelector(options.trigger) || el
          : options.trigger
        : el;

      try {
        const split = SplitText.create(el, {
          type: "lines",
          linesClass: "split-line",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            if (!self.lines || !self.lines.length) return;
            return gsap.from(self.lines, {
              scrollTrigger: {
                trigger: triggerEl,
                start: options.start ?? "top 82%",
                once: true,
              },
              yPercent: 105,
              autoAlpha: 0,
              duration: options.duration ?? 0.88,
              stagger: options.stagger ?? 0.07,
              delay: options.delay ?? 0.08,
              ease: options.ease ?? "power3.out",
            });
          },
        });

        (el as any)._splitTextActive = split;
        instances.push(split);
      } catch (err) {
        console.warn("SplitText error:", err);
      }
    });
  };

  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready.then(init);
  } else {
    init();
  }

  return () => {
    isCleanedUp = true;
    instances.forEach((inst) => {
      try {
        inst.revert();
        inst.kill();
      } catch (_) {}
    });
    elements.forEach((el) => {
      delete (el as any)._splitTextActive;
    });
  };
}
