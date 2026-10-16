import { gsap, SplitText, prefersReducedMotion } from "./motion";

export interface SplitLinesScrollOptions {
  trigger?: Element | string;
  start?: string;
  end?: string;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
  baseOpacity?: number;
  enableBlur?: boolean;
  blurStrength?: number;
  mode?: "scrub" | "enter";
}

/**
 * Applies unmasked ambient focus & illumination reveal, sequenced in scroll order.
 *
 * SCROLL-SEQUENCED & UNMASKED:
 * - NO clipping masks (no overflow:hidden or clipping rectangles).
 * - Tied directly to scroll position (`scrub` mode by default): as the user scrolls,
 *   sections illuminate sequentially in natural reading order down the page.
 * - Mobile-calibrated:
 *   - Mobile (≤899px): High resting opacity (0.42), 0 blur for 60/120fps GPU performance,
 *     responsive 0.1s scrub catchup, triggers early at top 90%.
 *   - Desktop (>899px): 0.20 resting opacity, subtle 2px blur, silky 0.35s scrub damping.
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

    // Filter valid visible elements
    const validElements = elements.filter((el) => {
      if (!el || !el.textContent?.trim()) return false;
      // Skip hidden / unmounted elements (e.g. collapsed drawers)
      if (el.offsetParent === null && el.getClientRects().length === 0) return false;
      return true;
    });

    if (!validElements.length) return;

    const isMobile = window.innerWidth <= 899;

    // Group elements by section so all paragraphs in a particular section
    // sequence together across that section rather than paragraph-wise.
    const groups: Map<Element, HTMLElement[]> = new Map();

    if (options.trigger) {
      const triggerEl =
        typeof options.trigger === "string"
          ? document.querySelector(options.trigger) || validElements[0]
          : options.trigger;
      groups.set(triggerEl, validElements);
    } else {
      validElements.forEach((el) => {
        const section =
          el.closest<HTMLElement>(
            "section, .detail__section, .detail__section--tight, .edition-overview__section, .home-section, .home-about__block, .fig-grid"
          ) || el.parentElement || el;
        const list = groups.get(section) || [];
        list.push(el);
        groups.set(section, list);
      });
    }

    groups.forEach((sectionElements, triggerSection) => {
      // Revert previous instance on these elements if any
      sectionElements.forEach((el) => {
        if ((el as any)._splitTextActive) {
          try {
            (el as any)._splitTextActive.revert();
            (el as any)._splitTextActive.kill();
          } catch (_) {}
          delete (el as any)._splitTextActive;
        }
      });

      try {
        const split = SplitText.create(sectionElements, {
          type: "words",
          wordsClass: "scroll-reveal-piece",
          autoSplit: true,
          onSplit: (self) => {
            if (!self.words || !self.words.length) return;

            // Responsive mobile vs desktop calibration
            const baseOpacity = isMobile ? 0.42 : (options.baseOpacity ?? 0.2);
            const enableBlur = !isMobile && (options.enableBlur ?? true);
            const blur = enableBlur ? (options.blurStrength ?? 2) : 0;
            const useScrub = options.mode !== "enter";

            if (useScrub) {
              // Scroll-sequenced reveal: words illuminate in direct lockstep with scroll progress
              return gsap.fromTo(
                self.words,
                {
                  opacity: baseOpacity,
                  filter: blur ? `blur(${blur}px)` : "none",
                },
                {
                  scrollTrigger: {
                    trigger: triggerSection,
                    start: isMobile ? "top 90%" : (options.start ?? "top 84%"),
                    end: isMobile ? "bottom 65%" : (options.end ?? "bottom 55%"),
                    scrub: isMobile ? 0.1 : 0.35,
                  },
                  opacity: 1,
                  filter: "blur(0px)",
                  stagger: isMobile ? 0.008 : 0.018,
                  ease: "none",
                }
              );
            } else {
              // Enter mode: smooth editorial wave when entering view
              return gsap.fromTo(
                self.words,
                {
                  opacity: baseOpacity,
                  filter: blur ? `blur(${blur}px)` : "none",
                },
                {
                  scrollTrigger: {
                    trigger: triggerSection,
                    start: isMobile ? "top 90%" : (options.start ?? "top 82%"),
                    once: true,
                  },
                  opacity: 1,
                  filter: "blur(0px)",
                  duration: isMobile ? 0.42 : (options.duration ?? 0.7),
                  stagger: isMobile ? 0.008 : (options.stagger ?? 0.018),
                  delay: options.delay ?? 0.04,
                  ease: "power2.out",
                }
              );
            }
          },
        });

        sectionElements.forEach((el) => {
          (el as any)._splitTextActive = split;
        });
        instances.push(split);
      } catch (err) {
        console.warn("ScrollReveal section error:", err);
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
