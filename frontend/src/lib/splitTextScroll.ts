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
}

/**
 * Option 2: Cascading Forward Wave / The Editorial Waterfall
 *
 * KEY BEHAVIORS:
 * 1. AUTO-COMPLETES & STAYS SHARP (`once: true`):
 *    - Once triggered as the reader scrolls into view, the animation completes forward
 *      to 100% opacity and stays permanently razor-sharp.
 *    - Never pauses halfway when scrolling stops. Never reverses on scroll-up.
 * 2. NATURAL TOP-TO-BOTTOM WATERFALL:
 *    - When no global trigger is passed, each element triggers in scroll order as it
 *      reaches the active reading zone (`top 82%` desktop / `top 78%` mobile).
 *    - Eliminates coarse section-level stop-and-go chunks.
 * 3. ZERO BLUR, PURE GPU TRANSFORM:
 *    - Pure `opacity` and micro `translateY` (6px desktop / 4px mobile).
 *    - No `filter: blur()`: preserves vector font crispness, prevents GPU rasterization load,
 *      and guarantees locked 60/120fps performance on mobile and desktop.
 * 4. MOBILE COMFORT:
 *    - Calibrated start line (`top 78%`) with a comfortable 0.12s settling delay and
 *      higher base opacity (0.35) so text is immediately legible as the thumb scrolls.
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
  const triggers: ScrollTrigger[] = [];
  let isCleanedUp = false;

  const init = () => {
    if (isCleanedUp) return;

    // Filter valid visible elements
    const validElements = elements.filter((el) => {
      if (!el || !el.textContent?.trim()) return false;
      if (el.offsetParent === null && el.getClientRects().length === 0) return false;
      return true;
    });

    if (!validElements.length) return;

    const isMobile = window.innerWidth <= 899;
    const baseOpacity = isMobile ? 0.35 : (options.baseOpacity ?? 0.2);
    const baseOffset = isMobile ? 4 : (options.baseOffset ?? 6);
    const duration = isMobile ? 0.42 : (options.duration ?? 0.58);
    const stagger = isMobile ? 0.025 : (options.stagger ?? 0.035);
    const delay = isMobile ? (options.delay ?? 0.12) : (options.delay ?? 0.05);
    const ease = options.ease ?? "power3.out";
    const start = options.start ?? (isMobile ? "top 78%" : "top 82%");

    // If an explicit trigger is provided, animate all elements together under that trigger.
    // Otherwise, each element triggers individually in natural top-to-bottom scroll order!
    if (options.trigger) {
      const triggerEl =
        typeof options.trigger === "string"
          ? document.querySelector(options.trigger) || validElements[0]
          : options.trigger;

      validElements.forEach((el) => {
        cleanSplitOnElement(el);
      });

      try {
        const split = SplitText.create(validElements, {
          type: "lines",
          linesClass: "scroll-reveal-line",
          autoSplit: true,
          onSplit: (self) => {
            if (!self.lines || !self.lines.length) return;
            const tween = gsap.fromTo(
              self.lines,
              { opacity: baseOpacity, y: baseOffset },
              {
                scrollTrigger: {
                  trigger: triggerEl,
                  start,
                  once: true,
                },
                opacity: 1,
                y: 0,
                duration,
                stagger,
                delay,
                ease,
              }
            );
            if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
            return tween;
          },
        });

        validElements.forEach((el) => {
          (el as any)._splitTextActive = split;
        });
        instances.push(split);
      } catch (err) {
        console.warn("splitLinesOnScroll error:", err);
      }
    } else {
      // Natural Waterfall: Each element gets its own trigger in reading order!
      validElements.forEach((el) => {
        cleanSplitOnElement(el);

        try {
          const split = SplitText.create(el, {
            type: "lines",
            linesClass: "scroll-reveal-line",
            autoSplit: true,
            onSplit: (self) => {
              if (!self.lines || !self.lines.length) return;
              const tween = gsap.fromTo(
                self.lines,
                { opacity: baseOpacity, y: baseOffset },
                {
                  scrollTrigger: {
                    trigger: el,
                    start,
                    once: true,
                  },
                  opacity: 1,
                  y: 0,
                  duration,
                  stagger,
                  delay,
                  ease,
                }
              );
              if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
              return tween;
            },
          });

          (el as any)._splitTextActive = split;
          instances.push(split);
        } catch (err) {
          console.warn("splitLinesOnScroll error:", err);
        }
      });
    }
  };

  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready.then(init);
  } else {
    init();
  }

  return () => {
    isCleanedUp = true;
    triggers.forEach((st) => {
      try {
        st.kill();
      } catch (_) {}
    });
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

function cleanSplitOnElement(el: HTMLElement) {
  if ((el as any)._splitTextActive) {
    try {
      (el as any)._splitTextActive.revert();
      (el as any)._splitTextActive.kill();
    } catch (_) {}
    delete (el as any)._splitTextActive;
  }
}

/**
 * Editorial Waterfall for card-based grids (e.g. Curator Bio cards).
 * Cascades each card smoothly in vertical scroll order as the user scrolls.
 */
export function cascadeCardsOnScroll(
  cardTargets: gsap.DOMTarget,
  options: {
    start?: string;
    cardSelector?: string;
    headingSelector?: string;
    bodySelector?: string;
  } = {}
): () => void {
  if (typeof window === "undefined") return () => {};
  if (prefersReducedMotion()) return () => {};

  const cards = gsap.utils.toArray(cardTargets) as HTMLElement[];
  if (!cards.length) return () => {};

  const isMobile = window.innerWidth <= 899;
  const start = options.start ?? (isMobile ? "top 80%" : "top 84%");
  const cleanups: (() => void)[] = [];

  cards.forEach((card) => {
    const heading = options.headingSelector ? card.querySelector(options.headingSelector) : null;
    const bodyParas = options.bodySelector
      ? (card.querySelectorAll(options.bodySelector) as NodeListOf<HTMLElement>)
      : null;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start,
        once: true,
      },
    });

    if (heading) {
      tl.fromTo(
        heading,
        { opacity: 0.2, y: isMobile ? 3 : 5 },
        {
          opacity: 1,
          y: 0,
          duration: isMobile ? 0.38 : 0.5,
          ease: "power3.out",
        },
        0
      );
    }

    if (bodyParas && bodyParas.length > 0) {
      const cleanupSplit = splitLinesOnScroll(bodyParas, {
        trigger: card,
        start,
        delay: isMobile ? 0.08 : 0.04,
      });
      cleanups.push(cleanupSplit);
    }
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}
