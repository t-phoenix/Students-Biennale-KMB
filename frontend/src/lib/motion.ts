import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText, useGSAP);

/**
 * Motion tokens — single source of truth for JS-driven motion.
 * Values mirror the --motion-* custom properties in styles/tokens.css.
 *
 * GSAP cannot parse CSS `cubic-bezier()` strings (it silently falls back to
 * power1.out), so every curve is registered as a named CustomEase instead.
 */
// Site motion rules, after Apple's (see the comment on --enter-ease in styles/tokens.css):
// entrances settle like a spring with no bounce, exits are quick and get out of the way.
const APPLE_SPRING = "0.32, 0.72, 0, 1"; // = --enter-ease
const APPLE_FADE = "0.28, 0.11, 0.32, 1"; // = --enter-ease-fade
const QUICK_EXIT = "0, 0, 0.2, 1"; // = --exit-ease
CustomEase.create("sbEnterSoft", APPLE_SPRING); // expressive entrances
CustomEase.create("sbEnter", APPLE_SPRING); // everyday entrances
CustomEase.create("sbStandard", APPLE_SPRING); // on-screen move or resize
CustomEase.create("sbAccordion", APPLE_SPRING); // drawers and accordions
CustomEase.create("sbReveal", APPLE_SPRING); // scroll reveals: quick to start moving, long soft settle
CustomEase.create("sbRevealOpen", APPLE_SPRING); // long downward reveals
CustomEase.create("sbAccordionOpen", APPLE_SPRING); // accordions opening
CustomEase.create("sbFade", APPLE_FADE); // crossfades: soft in and out, no sudden start
CustomEase.create("sbExitSoft", QUICK_EXIT); // exits
CustomEase.create("sbExit", QUICK_EXIT); // exits
CustomEase.create("sbAccordionEase", QUICK_EXIT); // accordions closing
CustomEase.create("sbExitQuick", QUICK_EXIT);

/** Exits are much quicker than entrances. Mirrors --exit-* in styles/tokens.css. Seconds. */
export const EXIT = {
  /** Panels, modals, drawers, cards, a tab leaving. */
  duration: 0.2,
  /** Hover-out, dropdowns, text swaps. */
  micro: 0.12,
  /** An image flying back to its place. */
  travel: 0.28,
  ease: "sbExitQuick",
} as const;

/** Reading-order sequencing. Mirrors --sequence-* in styles/tokens.css. */
export const SEQUENCE = {
  /** Seconds between one piece of content and the next. */
  step: 0.07,
  /** Seconds: a whole group never takes longer than this to start; long lists space tighter. */
  max: 0.7,
  /** Pixels: tops this close count as one row, read left to right. */
  rowTolerance: 12,
} as const;

/** Accordions and expanders: opens on a soft glide while the content fades in, closes quickly.
 *  Mirrors --reveal-* in styles/tokens.css. Seconds. */
export const REVEAL = {
  open: 0.48,
  // Lists: closing shrinks on the opening curve, so the section height never changes.
  close: 0.48,
  easeOpen: "sbAccordionOpen",
  easeClose: "sbAccordionOpen",
} as const;

export const EASE = {
  enterSoft: "sbEnterSoft",
  exitSoft: "sbExitSoft",
  enter: "sbEnter",
  exit: "sbExit",
  standard: "sbStandard",
  fade: "sbFade",
  accordion: "sbAccordion",
  reveal: "sbReveal",
  /** Scroll-linked scrubbing and constant-rate motion only. */
  linear: "none",
} as const;

/** Seconds. Exits use the next shorter step than their entrance. */
export const DUR = {
  instant: 0.08,
  fast: 0.12,
  base: 0.32,
  slow: 0.48,
  emphasis: 0.68,
  page: 0.9,
  cinematic: 1.2,
  /** Scroll reveals: long enough to read as a graceful arrival, never a pop. */
  reveal: 1.0,
} as const;

export const STAGGER = {
  /** Per-item offset for lists, grids and reveal groups. */
  step: 0.04,
  /** Per-item offset for small menu items. */
  tight: 0.02,
} as const;

/** Pixels. */
export const DISTANCE = {
  sm: 8,
  md: 16,
  /** How far a revealed item rises as it arrives. */
  rise: 22,
} as const;

// Configure ScrollTrigger performance defaults
ScrollTrigger.config({
  limitCallbacks: true,
  ignoreMobileResize: true,
});

// Prevent browser automatic scroll restoration from conflicting with SPA navigation
if (typeof window !== 'undefined') {
  ScrollTrigger.clearScrollMemory('manual');
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
}

/** Call once at app bootstrap if needed. */
export function initMotion() {
  gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText, useGSAP);
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Keep ScrollTrigger in sync with Lenis (or other custom scroll). */
export function syncScrollTrigger() {
  ScrollTrigger.update();
}

/**
 * Run tweens only when motion is allowed; under reduced-motion, call `onReduce`
 * (instant state / ≤150ms opacity) instead of spatial animation.
 */
export function withMotionPreference(options: {
  animate: () => void;
  onReduce?: () => void;
}) {
  if (prefersReducedMotion()) {
    options.onReduce?.();
    return;
  }
  options.animate();
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
