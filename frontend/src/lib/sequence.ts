import { useLayoutEffect, type RefObject } from "react";
import { DISTANCE, DUR, EASE, SEQUENCE, SplitText, gsap, prefersReducedMotion } from "./motion";

/**
 * Reading-order reveal, shared by every page.
 *
 * Each piece of content (paragraph, list row, card, image, button, small heading) fades and rises
 * in on its own as it reaches the screen. Pieces that arrive together are ordered by where they
 * actually sit: top to bottom, and left to right within a row, a SEQUENCE.step apart, with the
 * whole group capped at SEQUENCE.max so long lists never make anyone wait. Plays once, never
 * reverses. Large titles are left to their own line-by-line reveal (lib/headlineReveal.ts).
 *
 * Content added later (data arriving, a tab switching) is picked up before it is painted, so it
 * is never seen in place first.
 */

/** The pieces content is broken into. The outermost match wins, so a card or row that contains
 *  paragraphs arrives as one piece, while loose paragraphs arrive one by one. */
const UNITS = [
  "p",
  "li",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "figure",
  "picture",
  "img",
  "video",
  "table",
  "dl",
  "button",
  "a[href]",
  ".fig-label",
  ".fig-subheading",
  ".fig-rail",
  "[data-seq]",
].join(", ");

/** Large titles reveal themselves, line by line. */
const HEADLINES = "h1, .fig-heading, .detail__title";

/** Never sequenced: things with their own motion or that are not on screen as content. */
const ALWAYS_SKIP = [
  "[data-seq-skip]",
  "[aria-hidden='true']",
  "[inert]",
  "[role='dialog']",
  "[class*='drawer']",
  "[class*='accordion']",
  "[class*='carousel']",
  "[class*='lightbox']",
  "[class*='spotlight']",
  "[class*='slider']",
  "[class*='hero']",
  ".edition-content-leaving",
].join(", ");

const MEDIA = "img, picture, video";

export type SequenceOptions = {
  /** Extra selectors to treat as single pieces (cards, rows). */
  units?: string;
  /** Extra selectors to leave alone. */
  skip?: string;
  /** Seconds each piece takes to arrive. Defaults to the scroll-reveal duration. */
  duration?: number;
  /** Seconds before the first piece of the first group. */
  delay?: number;
  /** Only sequence pieces that are below the screen when it arms (already-visible ones stay). */
  belowFoldOnly?: boolean;
};

/** Sorts pieces top to bottom, and left to right within a row. */
export function readingOrder<T extends Element>(els: T[]): T[] {
  // A picture is placed by its frame: the picture itself may be scaled and shifted by the scroll
  // parallax, which would misplace it in the order.
  const placed = els.map((el) => {
    const box = el.matches("img, picture, video") && el.parentElement ? el.parentElement : el;
    return { el, r: box.getBoundingClientRect() };
  });
  placed.sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left);
  const rows: (typeof placed)[] = [];
  for (const p of placed) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(p.r.top - row[0].r.top) <= SEQUENCE.rowTolerance) row.push(p);
    else rows.push([p]);
  }
  return rows.flatMap((row) => row.sort((a, b) => a.r.left - b.r.left).map((p) => p.el));
}

export function revealInReadingOrder(root: HTMLElement, options: SequenceOptions = {}): () => void {
  if (typeof window === "undefined" || prefersReducedMotion()) return () => {};
  const unitSel = options.units ? `${options.units}, ${UNITS}` : UNITS;
  const skipSel = options.skip ? `${options.skip}, ${ALWAYS_SKIP}` : ALWAYS_SKIP;
  const duration = options.duration ?? DUR.reveal;
  let firstDelay = options.delay ?? 0;

  const seen = new WeakSet<Element>();
  const pending = new Set<HTMLElement>();
  const running = new Set<gsap.core.Tween>();
  let batch: HTMLElement[] = [];
  let frame = 0;
  let stopped = false;

  const isUnit = (el: HTMLElement) => {
    if (el.matches(HEADLINES) || el.closest(HEADLINES)) return false;
    if (el.closest(skipSel)) return false;
    // A component that drives its own opacity (an image fading in once loaded) keeps it.
    if (el.style.opacity !== "" || el.style.visibility !== "") return false;
    // The outermost piece wins.
    const outer = el.parentElement?.closest(unitSel);
    if (outer && root.contains(outer)) return false;
    // Not laid out: nothing to reveal.
    if (el.getClientRects().length === 0) return false;
    return true;
  };

  // While a piece is held back or arriving, its own CSS transitions are paused, so they never
  // drag behind the reveal (or fade it out visibly when it is first held back).
  const show = (el: HTMLElement) => {
    pending.delete(el);
    observer.unobserve(el);
    gsap.set(el, { clearProps: "opacity,visibility,transition" });
  };

  const waiting = new Map<HTMLElement, gsap.core.Tween>();
  const finishers = new Set<() => void>();

  const isTextBlock = (el: HTMLElement) =>
    el.tagName === "P" && !!el.textContent?.trim() && !el.querySelector(MEDIA);

  /**
   * A paragraph's lines rise and fade in one after another. React's own text nodes sit aside
   * during the animation and are put back exactly as they were afterwards, so later text
   * updates still apply (the same approach as the headline reveal).
   */
  const revealLines = (el: HTMLElement) => {
    if (!el.isConnected) return;
    const originals = Array.from(el.childNodes);
    const copy = el.cloneNode(true) as HTMLElement;
    let split: SplitText | null = null;
    let tween: gsap.core.Tween | null = null;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      finishers.delete(finish);
      tween?.kill();
      split?.revert();
      el.replaceChildren(...originals);
      gsap.set(el, { clearProps: "opacity,visibility,transition" });
    };
    finishers.add(finish);
    try {
      el.replaceChildren(...Array.from(copy.childNodes));
      split = SplitText.create(el, { type: "lines" });
      const lines = split.lines;
      tween = gsap.fromTo(
        lines,
        { autoAlpha: 0, y: DISTANCE.sm },
        {
          autoAlpha: 1,
          y: 0,
          duration,
          ease: EASE.reveal,
          stagger: Math.min(SEQUENCE.step, SEQUENCE.max / Math.max(1, lines.length - 1)),
          onComplete: finish,
        },
      );
      // The lines are held back now, so the paragraph itself can show.
      gsap.set(el, { autoAlpha: 1 });
    } catch {
      finish();
    }
  };

  const flush = () => {
    frame = 0;
    if (stopped) return;
    const vh = window.innerHeight;
    const fresh: HTMLElement[] = [];
    batch.forEach((el) => {
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0) show(el);
      // Content above arrived and pushed it off the screen: it waits for its turn again.
      else if (r.top >= vh) {
        pending.add(el);
        observer.observe(el);
      } else fresh.push(el);
    });
    batch = [];
    if (!fresh.length) return;
    // Pieces queued earlier that have not started yet join this group, so the whole screen
    // arrives in one reading order even when its content landed in two steps.
    waiting.forEach((tween, el) => {
      if (tween.progress() === 0 && !tween.isActive()) {
        tween.kill();
        gsap.set(el, { autoAlpha: 0 });
        running.delete(tween);
        fresh.push(el);
      }
    });
    waiting.clear();
    const els = readingOrder(fresh);
    const step = els.length > 1 ? Math.min(SEQUENCE.step, SEQUENCE.max / (els.length - 1)) : 0;
    const start = firstDelay;
    firstDelay = 0;
    els.forEach((el, i) => {
      // Paragraphs arrive line by line, in their turn in the reading order.
      if (isTextBlock(el)) {
        const call = gsap.delayedCall(start + i * step, () => {
          waiting.delete(el);
          running.delete(call);
          revealLines(el);
        });
        running.add(call);
        waiting.set(el, call);
        return;
      }
      const media = el.matches(MEDIA);
      // Images only fade, so they never fight the scroll parallax that moves them.
      const tween = gsap.fromTo(
        el,
        media ? { autoAlpha: 0, transition: "none" } : { autoAlpha: 0, y: DISTANCE.rise, transition: "none" },
        {
          autoAlpha: 1,
          ...(media ? {} : { y: 0 }),
          duration,
          delay: start + i * step,
          ease: EASE.reveal,
          clearProps: media ? "opacity,visibility,transition" : "opacity,visibility,transform,transition",
          onStart: () => {
            waiting.delete(el);
          },
          onComplete: () => {
            running.delete(tween);
          },
        },
      );
      running.add(tween);
      waiting.set(el, tween);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (!pending.has(el)) return;
        if (entry.isIntersecting) {
          pending.delete(el);
          observer.unobserve(el);
          batch.push(el);
        } else if (entry.boundingClientRect.bottom < 0) {
          // Jumped straight past it: nothing to animate, just show it.
          show(el);
        }
      });
      if (batch.length && !frame) frame = requestAnimationFrame(flush);
    },
    { rootMargin: "0px 0px -6% 0px" },
  );

  const scan = () => {
    if (stopped) return;
    root.querySelectorAll<HTMLElement>(unitSel).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      if (!isUnit(el)) return;
      if (options.belowFoldOnly && el.getBoundingClientRect().top < window.innerHeight) return;
      pending.add(el);
      gsap.set(el, { autoAlpha: 0, transition: "none" });
      observer.observe(el);
    });
  };

  // Runs before the browser paints, so new content is never seen in place first.
  const mutations = new MutationObserver(scan);
  mutations.observe(root, { childList: true, subtree: true });
  scan();

  // At the very end of the page, pieces in the last strip of the screen can never cross the
  // reveal line, so they arrive once the page can scroll no further.
  let endCheck = 0;
  const onScroll = () => {
    if (endCheck) return;
    endCheck = requestAnimationFrame(() => {
      endCheck = 0;
      const atEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (!atEnd || !pending.size) return;
      pending.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          pending.delete(el);
          observer.unobserve(el);
          batch.push(el);
        }
      });
      if (batch.length && !frame) frame = requestAnimationFrame(flush);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  return () => {
    stopped = true;
    if (frame) cancelAnimationFrame(frame);
    if (endCheck) cancelAnimationFrame(endCheck);
    window.removeEventListener("scroll", onScroll);
    mutations.disconnect();
    observer.disconnect();
    // Anything mid-arrival lands in its final state, never half-faded.
    running.forEach((t) => {
      t.kill();
      (t.targets() as unknown[]).filter((el): el is HTMLElement => el instanceof HTMLElement).forEach((el) =>
        gsap.set(el, {
          clearProps: el.matches(MEDIA)
            ? "opacity,visibility,transition"
            : "opacity,visibility,transform,transition",
        }),
      );
    });
    running.clear();
    waiting.forEach((_, el) => gsap.set(el, { clearProps: "opacity,visibility,transform,transition" }));
    waiting.clear();
    finishers.forEach((finish) => finish());
    pending.forEach((el) => gsap.set(el, { clearProps: "opacity,visibility,transition" }));
    batch.forEach((el) => gsap.set(el, { clearProps: "opacity,visibility,transition" }));
    pending.clear();
  };
}

/** Reveals `ref`'s content in reading order while it is mounted. Re-arms when `key` changes. */
export function useReadingOrderReveal(
  ref: RefObject<HTMLElement | null>,
  options: SequenceOptions & { key?: string | number; enabled?: boolean } = {},
) {
  const { key, enabled = true, units, skip, duration, delay, belowFoldOnly } = options;
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;
    return revealInReadingOrder(root, { units, skip, duration, delay, belowFoldOnly });
  }, [ref, key, enabled, units, skip, duration, delay, belowFoldOnly]);
}
