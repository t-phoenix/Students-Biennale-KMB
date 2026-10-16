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
 * SECTION-WISE ANIMATION:
 * Rather than animating paragraph-by-paragraph (which creates disjointed isolated chunks),
 * all text paragraphs belonging to a particular section are unified into a single SplitText
 * animation. All lines across the entire section flow in one unified, cascading stagger
 * from top to bottom, triggered by the section.
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
        // Pass ALL section paragraphs to SplitText.create at once so `self.lines`
        // contains the unified lines across the entire section in DOM order.
        const split = SplitText.create(sectionElements, {
          type: "lines",
          linesClass: "split-line",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            if (!self.lines || !self.lines.length) return;
            return gsap.from(self.lines, {
              scrollTrigger: {
                trigger: triggerSection,
                start: options.start ?? "top 80%",
                once: true,
              },
              yPercent: 105,
              autoAlpha: 0,
              duration: options.duration ?? 0.85,
              stagger: options.stagger ?? 0.05,
              delay: options.delay ?? 0.08,
              ease: options.ease ?? "power3.out",
            });
          },
        });

        sectionElements.forEach((el) => {
          (el as any)._splitTextActive = split;
        });
        instances.push(split);
      } catch (err) {
        console.warn("SplitText section error:", err);
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
