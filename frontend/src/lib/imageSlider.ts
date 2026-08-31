import { gsap, prefersReducedMotion } from "./motion";

/** Shared crossfade timing — matches Home / Edition hero carousels. */
export const SLIDER_CROSSFADE = {
  duration: 0.6,
  ease: "power2.out" as const,
} as const;

export const SLIDER_HOLD_SECONDS = 4;

/** Set one visible slide in a stacked carousel. */
export function initSlideStack(slides: HTMLElement[], index: number) {
  if (!slides.length) return;
  gsap.killTweensOf(slides);
  gsap.set(slides, { opacity: 0, visibility: "visible" });
  gsap.set(slides[index], { opacity: 1 });
}

/** Crossfade between two slides in a stacked carousel. */
export function crossfadeSlides(slides: HTMLElement[], fromIndex: number, toIndex: number) {
  if (!slides.length || fromIndex === toIndex) return;

  gsap.killTweensOf(slides);
  gsap.set(slides, { visibility: "visible" });

  if (prefersReducedMotion()) {
    initSlideStack(slides, toIndex);
    return;
  }

  slides.forEach((el, i) => {
    if (i !== fromIndex && i !== toIndex) gsap.set(el, { opacity: 0 });
  });
  gsap.set(slides[fromIndex], { opacity: 1 });
  gsap.set(slides[toIndex], { opacity: 0 });
  gsap.to(slides[fromIndex], {
    opacity: 0,
    duration: SLIDER_CROSSFADE.duration,
    ease: SLIDER_CROSSFADE.ease,
    overwrite: true,
  });
  gsap.to(slides[toIndex], {
    opacity: 1,
    duration: SLIDER_CROSSFADE.duration,
    ease: SLIDER_CROSSFADE.ease,
    overwrite: true,
  });
}

/** Manual jump while auto-advance is paused — same crossfade as Home hero. */
export function jumpToSlide(slides: HTMLElement[], fromIndex: number, toIndex: number) {
  crossfadeSlides(slides, fromIndex, toIndex);
}

/** Looping auto-advance timeline with crossfade between stacked slides. */
export function buildAutoSlideTimeline(
  slides: HTMLElement[],
  startIndex: number,
  onSlideChange: (index: number) => void,
  tlRef: { current: gsap.core.Timeline | null },
  holdSeconds = SLIDER_HOLD_SECONDS,
) {
  tlRef.current?.kill();
  gsap.killTweensOf(slides);
  initSlideStack(slides, startIndex);
  onSlideChange(startIndex);

  const tl = gsap.timeline({ repeat: -1 });
  const len = slides.length;
  for (let step = 0; step < len; step++) {
    const i = (startIndex + step) % len;
    const el = slides[i];
    const next = slides[(i + 1) % len];
    const nextIdx = (i + 1) % len;
    tl.to({}, { duration: holdSeconds })
      .to(el, { opacity: 0, duration: SLIDER_CROSSFADE.duration, ease: SLIDER_CROSSFADE.ease }, ">")
      .to(next, { opacity: 1, duration: SLIDER_CROSSFADE.duration, ease: SLIDER_CROSSFADE.ease }, "<")
      .call(() => onSlideChange(nextIdx));
  }
  tlRef.current = tl;
  return tl;
}
