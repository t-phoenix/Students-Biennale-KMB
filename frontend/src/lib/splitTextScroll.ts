import { gsap, SplitText, prefersReducedMotion } from "./motion";

export interface SplitLinesScrollOptions {
  trigger?: Element | string;
  start?: string;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
  baseOpacity?: number;
  baseOffset?: number;
  enableBlur?: boolean;
  blurStrength?: number;
}

/**
 * Applies unmasked ambient line-settling and illumination reveal on scroll.
 *
 * KEY BEHAVIORS:
 * 1. AUTO-COMPLETES & STAYS SHARP:
 *    - Once triggered by scrolling into view, it animates forward to 100% completion
 *      and stays permanently sharp (never pauses halfway, never reverses on scroll-up).
 * 2. MOBILE READABILITY & DELAY:
 *    - Triggers at the active reading zone (`top 78%`) with a deliberate 0.16s delay,
 *      so mobile readers see the text settle in cleanly before their eyes.
 *    - Zero blur on mobile for smooth 60/120fps GPU performance.
 * 3. LINE SETTLING MOTION ("Each line settles in as you scroll"):
 *    - Splits by natural lines (NO clipping masks, no overflow:hidden).
 *    - Each line gently settles vertically (`y: 7px → 0px` on GPU compositor)
 *      with soft staggered illumination, simulating line-height breathing
 *      without causing destructive document reflow.
 * 4. SECTION-WISE UNIFIED STAGGER:
 *    - All paragraphs across a particular section are unified into a single
 *      continuous top-to-bottom sequence.
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
    // animate together across that section rather than paragraph-wise.
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
        // Split by lines without ANY clipping mask wrappers
        const split = SplitText.create(sectionElements, {
          type: "lines",
          linesClass: "scroll-reveal-line",
          autoSplit: true,
          onSplit: (self) => {
            if (!self.lines || !self.lines.length) return;

            // Responsive mobile vs desktop calibration
            const baseOpacity = isMobile ? 0.35 : (options.baseOpacity ?? 0.18);
            const enableBlur = !isMobile && (options.enableBlur ?? true);
            const blur = enableBlur ? (options.blurStrength ?? 2) : 0;
            const yOffset = isMobile ? 6 : (options.baseOffset ?? 7);

            return gsap.fromTo(
              self.lines,
              {
                opacity: baseOpacity,
                y: yOffset,
                filter: blur ? `blur(${blur}px)` : "none",
              },
              {
                scrollTrigger: {
                  trigger: triggerSection,
                  start: isMobile ? "top 78%" : (options.start ?? "top 80%"),
                  once: true, // Auto-completes cleanly forward and stays permanently sharp!
                },
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: isMobile ? 0.48 : (options.duration ?? 0.65),
                stagger: isMobile ? 0.035 : (options.stagger ?? 0.045),
                delay: isMobile ? 0.16 : (options.delay ?? 0.08),
                ease: options.ease ?? "power3.out",
              }
            );
          },
        });

        sectionElements.forEach((el) => {
          (el as any)._splitTextActive = split;
        });
        instances.push(split);
      } catch (err) {
        console.warn("ScrollReveal line-settle error:", err);
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
