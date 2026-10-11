import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export const EASE = {
  out: "power2.out",
  inOut: "power3.inOut",
  smooth: "power3.out",
  expo: "power4.out",
  spring: "back.out(1.8)",
  soft: "power1.out",
} as const;

/**
 * Calibrated Goodman Gallery Motion Design Tokens
 * For silky deceleration, micro-interactions, and staggered reveals.
 */
export const MOTION_TOKENS = {
  ease: {
    // Goodman Gallery signature exponential deceleration:
    editorialOut: "cubic-bezier(0.65, 0, 0.076, 1)",
    // Smooth interactive/hover micro-animations:
    fluid: "cubic-bezier(0.25, 1, 0.5, 1)",
    // Staggered list and card entrances:
    staggerIn: "cubic-bezier(0.16, 1, 0.3, 1)",
    // Accordion, drawer, and height morphing:
    morph: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  duration: {
    micro: 0.25,    // Arrow hovers, mark toggles
    hover: 0.35,    // Card hover lifts, link underlines
    enter: 0.65,    // Text reveals, section fades
    curtain: 0.95,  // Image mask reveals, hero slide transitions
    page: 0.55,     // Route exit and entry choreography
  },
  stagger: {
    textLines: 0.06,
    cardGrid: 0.05,
    navLinks: 0.035,
    metadataRows: 0.04,
  },
} as const;

// Configure ScrollTrigger performance defaults
ScrollTrigger.config({
  limitCallbacks: true,
  ignoreMobileResize: true,
});

/** Call once at app bootstrap if needed. */
export function initMotion() {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
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

export { gsap, ScrollTrigger, useGSAP };
