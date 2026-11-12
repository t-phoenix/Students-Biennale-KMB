import { useEffect, useRef, type RefObject } from "react";
import { EASE, gsap, prefersReducedMotion } from "./motion";

/** Touch zoom for a full-screen picture: pinch with two fingers, double-tap to zoom in or out,
 *  and drag with one finger to look around while zoomed. Mouse input is left alone. */
const ZOOM = {
  max: 5,
  /** Allowed while pinching, springs back to 1 on release. */
  minWhilePinching: 0.8,
  doubleTap: 2.5,
  doubleTapMs: 300,
  doubleTapPx: 30,
  settle: 0.35,
} as const;

type Point = { x: number; y: number };

export function usePinchZoom(
  hostRef: RefObject<HTMLElement | null>,
  getImage: () => HTMLElement | null,
  /** Zoom resets whenever this changes (a different picture). */
  resetKey: unknown,
) {
  const state = useRef({ scale: 1, x: 0, y: 0, pinching: false });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const s = state.current;
    const pointers = new Map<number, Point>();
    let pinchStart: { scale: number; dist: number; local: Point } | null = null;
    let panStart: { x: number; y: number; px: number; py: number } | null = null;
    let lastTap: { t: number; x: number; y: number } | null = null;
    let tapCandidate: { x: number; y: number; t: number } | null = null;

    /** Centre of the picture on screen with no zoom applied. */
    const baseCentre = (img: HTMLElement): Point => {
      const r = img.getBoundingClientRect();
      return { x: r.left + r.width / 2 - s.x, y: r.top + r.height / 2 - s.y };
    };

    const apply = (img: HTMLElement) => {
      gsap.set(img, { x: s.x, y: s.y, scale: s.scale, transformOrigin: "50% 50%", force3D: true });
    };

    /** Keeps the picture covering the screen edges it is larger than, and centred where it is smaller. */
    const clamped = (img: HTMLElement, scale: number, x: number, y: number): Point => {
      const c = baseCentre(img);
      const w = img.offsetWidth * scale;
      const h = img.offsetHeight * scale;
      const fit = (t: number, centre: number, size: number, view: number) => {
        if (size <= view) return scale <= 1 ? 0 : view / 2 - centre;
        return Math.min(size / 2 - centre, Math.max(view - centre - size / 2, t));
      };
      return { x: fit(x, c.x, w, window.innerWidth), y: fit(y, c.y, h, window.innerHeight) };
    };

    const settleTo = (img: HTMLElement, scale: number, x: number, y: number) => {
      const target = scale <= 1 ? { x: 0, y: 0 } : clamped(img, scale, x, y);
      const done = () => {
        s.scale = scale;
        s.x = target.x;
        s.y = target.y;
        if (scale <= 1) gsap.set(img, { clearProps: "transform" });
      };
      if (prefersReducedMotion()) {
        s.scale = scale;
        s.x = target.x;
        s.y = target.y;
        apply(img);
        done();
        return;
      }
      const proxy = { scale: s.scale, x: s.x, y: s.y };
      gsap.to(proxy, {
        scale,
        x: target.x,
        y: target.y,
        duration: ZOOM.settle,
        ease: EASE.enterSoft,
        overwrite: true,
        onUpdate: () => {
          s.scale = proxy.scale;
          s.x = proxy.x;
          s.y = proxy.y;
          apply(img);
        },
        onComplete: done,
      });
    };

    const isTouch = (e: PointerEvent) => e.pointerType === "touch" || e.pointerType === "pen";

    const startPinch = (img: HTMLElement) => {
      const [a, b] = [...pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const c = baseCentre(img);
      pinchStart = {
        scale: s.scale,
        dist: Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1),
        local: { x: (mid.x - c.x - s.x) / s.scale, y: (mid.y - c.y - s.y) / s.scale },
      };
      s.pinching = true;
      panStart = null;
      tapCandidate = null;
    };

    const onDown = (e: PointerEvent) => {
      if (!isTouch(e)) return;
      const img = getImage();
      if (!img) return;
      gsap.killTweensOf(img);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && e.pointerType === "touch") {
        startPinch(img);
      } else if (pointers.size === 1) {
        tapCandidate = { x: e.clientX, y: e.clientY, t: performance.now() };
        if (s.scale > 1) panStart = { x: s.x, y: s.y, px: e.clientX, py: e.clientY };
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const img = getImage();
      if (!img) return;
      if (tapCandidate && Math.hypot(e.clientX - tapCandidate.x, e.clientY - tapCandidate.y) > ZOOM.doubleTapPx) {
        tapCandidate = null;
      }
      if (pinchStart && pointers.size >= 2) {
        e.preventDefault();
        const [a, b] = [...pointers.values()];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const scale = Math.min(ZOOM.max, Math.max(ZOOM.minWhilePinching, (pinchStart.scale * dist) / pinchStart.dist));
        const c = baseCentre(img);
        s.scale = scale;
        s.x = mid.x - c.x - scale * pinchStart.local.x;
        s.y = mid.y - c.y - scale * pinchStart.local.y;
        apply(img);
      } else if (panStart && s.scale > 1) {
        e.preventDefault();
        s.x = panStart.x + (e.clientX - panStart.px);
        s.y = panStart.y + (e.clientY - panStart.py);
        apply(img);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId)) return;
      const img = getImage();
      if (!img) return;

      if (pinchStart) {
        if (pointers.size >= 2) {
          startPinch(img);
          return;
        }
        pinchStart = null;
        // One finger stays down: carry on as a pan from here.
        const rest = [...pointers.values()][0];
        panStart = rest && s.scale > 1 ? { x: s.x, y: s.y, px: rest.x, py: rest.y } : null;
        if (pointers.size === 0) {
          s.pinching = false;
          settleTo(img, s.scale < 1 ? 1 : s.scale, s.x, s.y);
        }
        return;
      }

      if (pointers.size > 0) return;
      s.pinching = false;
      panStart = null;

      // Double tap: zoom in where tapped, or back out.
      const tap = tapCandidate;
      tapCandidate = null;
      if (tap && performance.now() - tap.t < 250) {
        const now = performance.now();
        if (lastTap && now - lastTap.t < ZOOM.doubleTapMs && Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) < ZOOM.doubleTapPx) {
          lastTap = null;
          if (s.scale > 1) settleTo(img, 1, 0, 0);
          else {
            const c = baseCentre(img);
            const k = ZOOM.doubleTap;
            settleTo(img, k, (1 - k) * (tap.x - c.x), (1 - k) * (tap.y - c.y));
          }
          return;
        }
        lastTap = { t: now, x: tap.x, y: tap.y };
      }
      if (s.scale > 1) settleTo(img, s.scale, s.x, s.y);
    };

    host.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("pointermove", onMove, { capture: true, passive: false });
    window.addEventListener("pointerup", onUp, { capture: true });
    window.addEventListener("pointercancel", onUp, { capture: true });
    return () => {
      host.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointermove", onMove, { capture: true });
      window.removeEventListener("pointerup", onUp, { capture: true });
      window.removeEventListener("pointercancel", onUp, { capture: true });
    };
  }, [hostRef, getImage]);

  // A different picture always starts unzoomed.
  useEffect(() => {
    const s = state.current;
    s.scale = 1;
    s.x = 0;
    s.y = 0;
    s.pinching = false;
  }, [resetKey]);

  return {
    /** True while the picture is zoomed in or a pinch is under way: swiping is paused. */
    isActive: () => state.current.scale > 1.01 || state.current.pinching,
  };
}
