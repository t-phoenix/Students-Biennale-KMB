import { DISTANCE, EASE, gsap, SplitText, ScrollTrigger, prefersReducedMotion } from "./motion";

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
 *      reaches the active reading zone (`top 82%` desktop / as soon as it enters on mobile).
 *    - Eliminates coarse section-level stop-and-go chunks.
 * 3. ZERO BLUR, PURE GPU TRANSFORM:
 *    - Pure `opacity` and micro `translateY` (6px desktop / 4px mobile).
 *    - No `filter: blur()`: preserves vector font crispness, prevents GPU rasterization load,
 *      and guarantees locked 60/120fps performance on mobile and desktop.
 * 4. MOBILE COMFORT:
 *    - Starts as soon as the text enters the screen (`top 98%`), with no settling delay and a
 *      shorter rise, so it keeps pace with the images beside it as the thumb scrolls.
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
  const hidden = new Set<HTMLElement>();
  let observer: IntersectionObserver | null = null;
  let isCleanedUp = false;

  // Splitting a paragraph into lines measures every word, which is slow. Doing every paragraph
  // on the page at once froze the phone for a moment after a tap. So each paragraph is split only
  // as it comes within a screen of view, a little per frame (see splitQueue). Until then it waits
  // invisible, exactly as it would after splitting, so nothing shows unrevealed.
  elements.forEach((el) => {
    if (!el || !el.textContent?.trim() || (el as any)._splitTextActive) return;
    el.style.opacity = "0";
    hidden.add(el);
  });
  const unhide = (el: HTMLElement) => {
    if (!hidden.delete(el)) return;
    el.style.opacity = "";
  };

  const init = () => {
    if (isCleanedUp) return;

    // Filter valid visible elements
    const validElements = elements.filter((el) => {
      if (!el || !el.textContent?.trim()) return false;
      if (el.offsetParent === null && el.getClientRects().length === 0) return false;
      return true;
    });
    elements.forEach((el) => !validElements.includes(el) && unhide(el));

    if (!validElements.length) return;

    const isMobile = window.innerWidth <= 899;
    // Lines arrive from nothing, rising gently and one after another. A long paragraph
    // spreads its stagger over a fixed total so the last line is never far behind.
    const baseOpacity = options.baseOpacity ?? 0;
    const baseOffset = options.baseOffset ?? (isMobile ? 14 : DISTANCE.rise - 2);
    // Phones: text starts the moment it enters the screen, with no wait, so it arrives together
    // with the images beside it instead of lagging behind them as the reader scrolls.
    const duration = options.duration ?? (isMobile ? 0.85 : 1.2);
    const stagger = options.stagger ?? (isMobile ? 0.05 : 0.09);
    const delay = isMobile ? 0 : (options.delay ?? 0.05);
    const ease = options.ease ?? EASE.reveal;
    const spread = isMobile ? 0.5 : 0.9;
    const staggerFor = (lines: number) => Math.min(stagger, spread / Math.max(lines - 1, 1));
    const start = options.start ?? (isMobile ? "top 98%" : "top 82%");

    // With a shared trigger, all paragraphs arrive together under it, one after another in
    // reading order. Otherwise each paragraph triggers on its own as it scrolls in.
    const triggerEl = options.trigger
      ? typeof options.trigger === "string"
        ? document.querySelector(options.trigger) || validElements[0]
        : options.trigger
      : null;
    const paragraphGap = Math.min(stagger * 2, spread / Math.max(validElements.length, 1));

    const splitOne = (el: HTMLElement, order: number) => {
      if (isCleanedUp) return;
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
                  trigger: triggerEl ?? el,
                  start,
                  once: true,
                },
                opacity: 1,
                y: 0,
                duration,
                stagger: staggerFor(self.lines.length),
                delay: delay + (triggerEl ? order * paragraphGap : 0),
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
      // The lines now hold the paragraph hidden themselves.
      unhide(el);
    };

    // Within a screen of view: split now (in turn). Further down: when it gets that close.
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          observer?.unobserve(el);
          splitQueue.add(el, () => splitOne(el, validElements.indexOf(el)));
        });
      },
      { rootMargin: "0px 0px 100% 0px" },
    );
    validElements.forEach((el) => observer?.observe(el));
  };

  if (typeof document !== "undefined" && document.fonts?.ready) {
    document.fonts.ready.then(init);
  } else {
    init();
  }

  return () => {
    isCleanedUp = true;
    observer?.disconnect();
    elements.forEach((el) => splitQueue.remove(el));
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
      unhide(el);
    });
  };
}

/** Paragraphs waiting to be split, done in reading order a few at a time per frame so the page
 *  never freezes while it is being prepared. */
const splitQueue = (() => {
  const jobs: { el: HTMLElement; run: () => void }[] = [];
  let scheduled = false;
  const BUDGET_MS = 8;
  const order = (a: HTMLElement, b: HTMLElement) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  const tick = () => {
    scheduled = false;
    const startAt = performance.now();
    // Always at least one per frame, then as many as fit in the budget.
    do {
      const job = jobs.shift();
      if (!job) break;
      job.run();
    } while (jobs.length && performance.now() - startAt < BUDGET_MS);
    if (jobs.length) schedule();
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(tick);
  };
  return {
    add(el: HTMLElement, run: () => void) {
      jobs.push({ el, run });
      jobs.sort((a, b) => order(a.el, b.el));
      schedule();
    },
    remove(el: HTMLElement) {
      const i = jobs.findIndex((j) => j.el === el);
      if (i >= 0) jobs.splice(i, 1);
    },
  };
})();

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
        { opacity: 0, y: isMobile ? 14 : DISTANCE.rise },
        {
          opacity: 1,
          y: 0,
          duration: isMobile ? 1.05 : 1.2,
          ease: EASE.reveal,
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
