import { DUR, EASE, gsap, prefersReducedMotion } from "./motion";

/** Shared crossfade timing — matches Home / Edition hero carousels. */
export const SLIDER_CROSSFADE = {
  duration: 1.3,
  ease: EASE.fade,
} as const;

export const SLIDER_HOLD_SECONDS = 4;

/** Slides a drag is currently holding: the slideshow must leave them alone. */
const busySlides = new WeakSet<HTMLElement>();
/** A slide a drag has just landed on: it is already in place, so nothing should replay. */
const landedSlides = new WeakSet<HTMLElement>();

export function setSlidesBusy(slides: HTMLElement[], busy: boolean) {
  slides.forEach((el) => (busy ? busySlides.add(el) : busySlides.delete(el)));
}

export function markSlideLanded(slide: HTMLElement) {
  landedSlides.add(slide);
  window.setTimeout(() => landedSlides.delete(slide), 100);
}

const consumeLanded = (slide?: HTMLElement) => Boolean(slide && landedSlides.delete(slide));

/** Set one visible slide in a stacked carousel. */
export function initSlideStack(slides: HTMLElement[], index: number) {
  if (!slides.length) return;
  gsap.killTweensOf(slides);
  gsap.set(slides, { opacity: 0, visibility: "visible", clearProps: "scale,transform,zIndex" });
  gsap.set(slides[index], { opacity: 1 });
}

/** Crossfade between two slides in a stacked carousel. */
export function crossfadeSlides(slides: HTMLElement[], fromIndex: number, toIndex: number) {
  if (!slides.length || fromIndex === toIndex) return;

  gsap.killTweensOf(slides);
  gsap.set(slides, { visibility: "visible" });

  if (consumeLanded(slides[toIndex]) || prefersReducedMotion()) {
    initSlideStack(slides, toIndex);
    return;
  }

  // The new image fades in on top of the old one, which stays fully opaque beneath until
  // the new one has covered it. Fading both at once dips the picture and lets the
  // background flash through in the middle. If a fade is already under way, whatever is
  // showing now stays as it is, so there is never a jump.
  slides.forEach((el, i) => {
    gsap.set(el, { zIndex: i === toIndex ? 2 : 1 });
  });
  gsap.to(slides[toIndex], {
    opacity: 1,
    duration: SLIDER_CROSSFADE.duration,
    ease: SLIDER_CROSSFADE.ease,
    overwrite: true,
    onComplete: () => initSlideStack(slides, toIndex),
  });
}

/**
 * Person-driven change (arrow, dot or key): slides move in the direction of
 * travel. Only unattended slideshow changes crossfade.
 */
export function jumpToSlide(slides: HTMLElement[], fromIndex: number, toIndex: number) {
  if (!slides.length || fromIndex === toIndex) return;
  if (consumeLanded(slides[toIndex]) || prefersReducedMotion()) {
    initSlideStack(slides, toIndex);
    return;
  }

  gsap.killTweensOf(slides);
  const len = slides.length;
  const forward = (toIndex - fromIndex + len) % len <= len / 2;
  const travel = slides[toIndex].parentElement?.offsetWidth || slides[toIndex].offsetWidth;
  slides.forEach((el, i) => {
    gsap.set(el, {
      opacity: i === fromIndex || i === toIndex ? 1 : 0,
      visibility: "visible",
      clearProps: "transform",
    });
  });
  gsap.fromTo(
    slides[fromIndex],
    { x: 0 },
    { x: forward ? -travel : travel, duration: DUR.page, ease: EASE.enterSoft },
  );
  gsap.fromTo(
    slides[toIndex],
    { x: forward ? travel : -travel },
    {
      x: 0,
      duration: DUR.page,
      ease: EASE.enterSoft,
      onComplete: () => initSlideStack(slides, toIndex),
    },
  );
}

/** Looping auto-advance timeline with crossfade between stacked slides. */
export function buildAutoSlideTimeline(
  slides: HTMLElement[],
  startIndex: number,
  onSlideChange: (index: number) => void,
  tlRef: { current: gsap.core.Timeline | null },
  holdSeconds = SLIDER_HOLD_SECONDS,
) {
  // A hover ending mid-drag must not restart the slideshow underneath the finger.
  if (slides.some((el) => busySlides.has(el))) {
    tlRef.current?.pause();
    return tlRef.current ?? gsap.timeline({ paused: true });
  }
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
      // Never fade to a picture that has not arrived: wait for it instead of flashing.
      .call(() => {
        const img = next as HTMLImageElement;
        if (!("complete" in img) || (img.complete && img.naturalWidth > 0)) return;
        tl.pause();
        const resume = () => tl.resume();
        img.addEventListener("load", resume, { once: true });
        img.addEventListener("error", resume, { once: true });
      })
      // The next picture fades in over the current one, which stays opaque beneath it.
      .set(next, { zIndex: 2, visibility: "visible" })
      .set(el, { zIndex: 1 })
      // Announced as the crossfade begins, so captions, dots and arrows change together with
      // the picture. (Announced after it, they all switched in one frame once the picture had
      // already changed, which read as a flicker.)
      .call(() => onSlideChange(nextIdx))
      .to(next, { opacity: 1, duration: SLIDER_CROSSFADE.duration, ease: SLIDER_CROSSFADE.ease })
      .set(el, { opacity: 0 });
  }
  tlRef.current = tl;
  // Restarted while a mouse is still over the slider: stay paused until it leaves.
  const host = slides[0]?.parentElement?.parentElement;
  if (host?.matches(":hover") && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    tl.pause();
  }
  return tl;
}
