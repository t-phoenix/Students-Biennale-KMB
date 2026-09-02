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
