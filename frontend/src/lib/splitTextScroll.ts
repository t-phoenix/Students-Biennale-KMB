import { gsap, SplitText, prefersReducedMotion } from "./motion";

export interface SplitLinesScrollOptions {
  trigger?: Element | string;
  start?: string;
  duration?: number;
  stagger?: number;
  delay?: number;
  ease?: string;
  baseOpacity?: number;
  enableBlur?: boolean;
  blurStrength?: number;
}

/**
 * Applies unmasked ambient focus & illumination reveal on scroll (inspired by React Bits ScrollReveal).
 *
 * UNMASKED & SECTION-WISE:
 * - NO clipping masks (`mask` is not used; `overflow: hidden` is never added).
 * - Text paragraphs are split into words and smoothly transition from a soft ambient
 *   dimmed state (`baseOpacity: 0.12`, `blur: 3px`) into full sharp contrast (`opacity: 1`, `blur: 0px`).
 * - All paragraphs in a section flow together in a continuous, graceful cascade.
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
        // Split by words without ANY masks
        const split = SplitText.create(sectionElements, {
          type: "words",
          wordsClass: "scroll-reveal-piece",
          autoSplit: true,
          onSplit: (self) => {
            if (!self.words || !self.words.length) return;
            const baseOpacity = options.baseOpacity ?? 0.14;
            const enableBlur = options.enableBlur ?? true;
            const blur = enableBlur ? (options.blurStrength ?? 3) : 0;

            return gsap.fromTo(
              self.words,
              {
                opacity: baseOpacity,
                filter: blur ? `blur(${blur}px)` : "none",
              },
              {
                scrollTrigger: {
                  trigger: triggerSection,
                  start: options.start ?? "top 80%",
                  once: true,
                },
                opacity: 1,
                filter: "blur(0px)",
                duration: options.duration ?? 0.75,
                stagger: options.stagger ?? 0.02,
                delay: options.delay ?? 0.06,
                ease: options.ease ?? "power2.out",
              }
            );
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
