import { useEffect, useRef, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "./motion";
import { initSlideStack, markSlideLanded, setSlidesBusy } from "./imageSlider";
import { preloadUrl } from "./preloadImages";

/**
 * Shared physics for anything a person can drag or flick: finger, stylus, mouse
 * or trackpad. Position follows the input 1:1, the release speed carries over,
 * and a critically damped spring brings it to rest. The spring is solved
 * analytically from elapsed time, so it feels the same at 60 Hz and 120 Hz.
 */
export const GESTURE = {
  /** Movement before a gesture is treated as a drag and locked to one axis. */
  axisLockPx: 6,
  /** Release speed (px/ms) that counts as a flick. */
  flickPxPerMs: 0.35,
  /** Share of the width that changes slide on a phone, and on a wide screen. */
  commitNarrow: 0.28,
  commitWide: 0.18,
  /** Only the most recent movement counts towards release speed. */
  velocityWindowMs: 100,
  /** A finger that paused this long before lifting has no release speed. */
  stalePauseMs: 80,
  /** Spring stiffness: higher settles faster. Wide screens travel further, so they get longer. */
  springNarrow: 18,
  springWide: 12,
  springBack: 22,
  /** Movement allowed past the edge when there is nowhere to go. */
  rubberBand: 0.28,
  /** Share of the height that dismisses a dragged sheet or viewer. */
  dismissFraction: 0.22,
  /** Trackpad: quiet gap that ends a swipe, and that must pass before the next. */
  wheelIdleMs: 90,
  wheelQuietMs: 180,
} as const;

type SpringOptions = {
  from: number;
  to: number;
  /** px/ms */
  velocity: number;
  omega: number;
  onUpdate: (value: number) => void;
  onDone: () => void;
};

/** Critically damped spring. It never rings, and it stops at the target if flicked past it. */
export function runSpring({ from, to, velocity, omega, onUpdate, onDone }: SpringOptions) {
  const a = from - to;
  const b = velocity * 1000 + omega * a;
  const start = performance.now();
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    gsap.ticker.remove(tick);
  };

  function tick() {
    const t = (performance.now() - start) / 1000;
    const decay = Math.exp(-omega * t);
    const value = to + (a + b * t) * decay;
    const speed = (b - omega * (a + b * t)) * decay;
    const passedTarget = a !== 0 && a * (value - to) < 0;
    if (passedTarget || (Math.abs(value - to) < 0.5 && Math.abs(speed) < 30)) {
      stop();
      onUpdate(to);
      onDone();
      return;
    }
    onUpdate(value);
  }

  if (Math.abs(a) < 0.5 && Math.abs(velocity) < 0.03) {
    onUpdate(to);
    onDone();
    return stop;
  }
  gsap.ticker.add(tick);
  return stop;
}

/** Tracks recent movement so release speed reflects the end of the gesture only. */
export function createVelocityTracker() {
  let samples: { value: number; time: number }[] = [];
  return {
    reset() {
      samples = [];
    },
    add(value: number) {
      const time = performance.now();
      samples.push({ value, time });
      while (samples.length > 2 && time - samples[0].time > GESTURE.velocityWindowMs) samples.shift();
    },
    /** px/ms */
    read() {
      if (samples.length < 2) return 0;
      const last = samples[samples.length - 1];
      if (performance.now() - last.time > GESTURE.stalePauseMs) return 0;
      const first = samples[0];
      return (last.value - first.value) / Math.max(last.time - first.time, 1);
    },
  };
}

export type SlideGestureOptions = {
  count: number;
  getIndex: () => number;
  /** Stacked slides that are all in the DOM. */
  getSlides?: () => HTMLElement[];
  /** A single image element: the neighbour is created only for the gesture. */
  ghost?: { selector: string; getSrc: (index: number) => string };
  /** Distance a slide travels. Defaults to the surface width. */
  getTravel?: () => number;
  /** Elements that start their own interaction rather than a drag. */
  ignore?: string;
  /** Drag down to dismiss. */
  dismiss?: { getTarget: () => HTMLElement | null; getFades?: () => HTMLElement[]; onDismiss: () => void };
  /** The drag has begun: stop the slideshow. */
  onGrab?: () => void;
  /** The slide that would be shown now, for dots and captions during a drag. */
  onTargetChange?: (index: number) => void;
  /** The slide has landed on a new index. */
  onCommit: (index: number) => void;
  /** Everything is at rest, whether or not the index changed. */
  onSettle?: (index: number) => void;
  /** A hand drag (finger, mouse or trackpad) has started or come to rest. Not called for arrows or keys. */
  onDragChange?: (dragging: boolean) => void;
  /** While true, no new drag starts (e.g. a zoomed picture is being panned instead). */
  blocked?: () => boolean;
};

const DEFAULT_IGNORE = "button, a, input, textarea, select, label, .carousel-dots, .carousel-nav, [data-no-swipe]";

const wrapIndex = (index: number, count: number) => ((index % count) + count) % count;

function setDraggingCursor(on: boolean) {
  document.documentElement.classList.toggle("is-gesture-dragging", on);
  if (on) window.getSelection()?.removeAllRanges();
}

/** A drag must never also count as a click on what sits underneath. */
function suppressNextClick() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.removeEventListener("click", swallow, true);
  };
  window.addEventListener("click", swallow, true);
  window.setTimeout(() => window.removeEventListener("click", swallow, true), 350);
}

function bindSlideGesture(surface: HTMLElement, getOptions: () => SlideGestureOptions) {
  const velocity = createVelocityTracker();
  let phase: "idle" | "pending" | "x" | "y" | "settling-x" | "settling-y" = "idle";
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let position = 0;
  let index = 0;
  let travel = 1;
  let shownTarget = -1;
  let current: HTMLElement | null = null;
  let neighbour: HTMLElement | null = null;
  let neighbourIndex = -1;
  let ghostEl: HTMLImageElement | null = null;
  let lingeringGhost: HTMLImageElement | null = null;
  let lingerTimer = 0;
  let stopSpring: (() => void) | null = null;
  let wheelIdleTimer = 0;
  let wheelQuietUntil = 0;
  let isMouse = false;
  /** True from the moment a hand drag starts until everything is at rest again. */
  let handDrag = false;
  const setHandDrag = (o: SlideGestureOptions, on: boolean) => {
    if (handDrag === on) return;
    handDrag = on;
    o.onDragChange?.(on);
  };
  /** Set while an arrow, dot or key drives the slide rather than a drag. */
  let forcedTarget: number | null = null;
  let settlingFinal: number | null = null;

  const slidesFor = (o: SlideGestureOptions) => o.getSlides?.() ?? [];
  const reduced = () => prefersReducedMotion();

  const clearLingeringGhost = () => {
    window.clearTimeout(lingerTimer);
    lingeringGhost?.remove();
    lingeringGhost = null;
  };

  const makeGhost = (o: SlideGestureOptions, i: number) => {
    const parent = current?.parentElement;
    if (!parent || !o.ghost || !current) return null;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    const img = new Image();
    img.src = o.ghost.getSrc(i);
    img.alt = "";
    img.draggable = false;
    Object.assign(img.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      maxWidth: "none",
      objectFit: getComputedStyle(current).objectFit,
      zIndex: "2",
      pointerEvents: "none",
    });
    parent.appendChild(img);
    return img;
  };

  /** Moves the current slide to `x`, with its neighbour alongside it. */
  const render = (o: SlideGestureOptions, x: number) => {
    position = x;
    if (!current) return;
    gsap.set(current, { x, force3D: true });
    if (o.count <= 1) return;

    const direction = x < 0 ? 1 : -1;
    const wanted = x === 0 ? -1 : (forcedTarget ?? wrapIndex(index + direction, o.count));
    if (wanted !== neighbourIndex) {
      if (ghostEl) {
        ghostEl.remove();
        ghostEl = null;
      } else if (neighbour) {
        gsap.set(neighbour, { opacity: 0, clearProps: "transform" });
      }
      neighbour = null;
      neighbourIndex = wanted;
      if (wanted >= 0) {
        if (o.ghost) {
          ghostEl = makeGhost(o, wanted);
          neighbour = ghostEl;
        } else {
          neighbour = slidesFor(o)[wanted] ?? null;
          if (neighbour) gsap.set(neighbour, { opacity: 1, visibility: "visible" });
        }
      }
    }
    if (neighbour) gsap.set(neighbour, { x: x + (x < 0 ? travel : -travel), force3D: true });

    const target = Math.abs(x) > travel / 2 && wanted >= 0 ? wanted : index;
    if (target !== shownTarget) {
      shownTarget = target;
      o.onTargetChange?.(target);
    }
  };

  /** Hands the slides to the gesture, keeping whichever one is visibly on screen. */
  const prepare = (o: SlideGestureOptions) => {
    clearLingeringGhost();
    travel = o.getTravel?.() ?? (surface.offsetWidth || 1);
    index = o.getIndex();
    position = 0;
    neighbour = null;
    neighbourIndex = -1;
    if (o.ghost) {
      current = surface.querySelector<HTMLElement>(o.ghost.selector);
      if (current) {
        current.style.transition = "none";
        current.style.opacity = "1";
      }
    } else {
      const slides = slidesFor(o);
      gsap.killTweensOf(slides);
      let strongest = index;
      let strongestOpacity = -1;
      slides.forEach((slide, i) => {
        const opacity = Number(gsap.getProperty(slide, "opacity"));
        if (opacity > strongestOpacity) {
          strongestOpacity = opacity;
          strongest = i;
        }
      });
      index = strongest;
      slides.forEach((slide, i) => {
        gsap.set(slide, { opacity: i === index ? 1 : 0, visibility: "visible", clearProps: "transform" });
      });
      current = slides[index] ?? null;
      setSlidesBusy(slides, true);
    }
    shownTarget = index;
  };

  const finish = (o: SlideGestureOptions, finalIndex: number) => {
    phase = "idle";
    stopSpring = null;
    forcedTarget = null;
    settlingFinal = null;
    const previous = o.getIndex();

    if (o.ghost) {
      const landedGhost = ghostEl;
      ghostEl = null;
      if (finalIndex !== previous && landedGhost) {
        gsap.set(landedGhost, { clearProps: "transform" });
        lingeringGhost = landedGhost;
        const src = o.ghost.getSrc(finalIndex);
        const expire = () => {
          lingerTimer = window.setTimeout(clearLingeringGhost, 500);
        };
        void preloadUrl(src, "high").then(expire, expire);
      } else {
        landedGhost?.remove();
      }
      if (current) {
        gsap.set(current, { clearProps: "transform" });
        current.style.transition = "";
      }
    } else {
      const slides = slidesFor(o);
      setSlidesBusy(slides, false);
      initSlideStack(slides, finalIndex);
      if (finalIndex !== previous && slides[finalIndex]) markSlideLanded(slides[finalIndex]);
    }

    current = null;
    neighbour = null;
    neighbourIndex = -1;
    setHandDrag(o, false);
    if (finalIndex !== previous) o.onCommit(finalIndex);
    o.onSettle?.(finalIndex);
  };

  const releaseX = (o: SlideGestureOptions, cancelled = false) => {
    const speed = cancelled ? 0 : velocity.read();
    const wide = window.innerWidth >= 1024;
    const threshold = (wide ? GESTURE.commitWide : GESTURE.commitNarrow) * travel;
    const direction = position < 0 ? -1 : 1;
    const flicked = Math.abs(speed) > GESTURE.flickPxPerMs && Math.sign(speed) === direction;
    const reversed = Math.abs(speed) > GESTURE.flickPxPerMs && Math.sign(speed) === -direction;
    const commit = !cancelled && o.count > 1 && position !== 0 && !reversed && (Math.abs(position) > threshold || flicked);

    const finalIndex = commit ? wrapIndex(index - direction, o.count) : index;
    if (shownTarget !== finalIndex) {
      shownTarget = finalIndex;
      o.onTargetChange?.(finalIndex);
    }

    if (reduced()) {
      finish(o, finalIndex);
      return;
    }

    const span = Math.min(Math.max((travel - 375) / (1440 - 375), 0), 1);
    const omega = commit
      ? GESTURE.springNarrow + (GESTURE.springWide - GESTURE.springNarrow) * span
      : GESTURE.springBack;
    phase = "settling-x";
    settlingFinal = finalIndex;
    stopSpring = runSpring({
      from: position,
      to: commit ? direction * travel : 0,
      velocity: speed,
      omega,
      onUpdate: (value) => render(o, value),
      onDone: () => finish(o, finalIndex),
    });
  };

  const applyDismiss = (o: SlideGestureOptions, y: number) => {
    position = y;
    const target = o.dismiss?.getTarget();
    if (!target) return;
    const progress = Math.min(y / (window.innerHeight || 1), 1);
    gsap.set(target, { y, scale: 1 - progress * 0.12, force3D: true });
    o.dismiss?.getFades?.().forEach((el) => gsap.set(el, { opacity: 1 - progress * 1.4 }));
  };

  const clearDismiss = (o: SlideGestureOptions) => {
    const target = o.dismiss?.getTarget();
    if (target) gsap.set(target, { clearProps: "transform" });
    o.dismiss?.getFades?.().forEach((el) => gsap.set(el, { clearProps: "opacity" }));
  };

  const releaseY = (o: SlideGestureOptions, cancelled = false) => {
    const speed = cancelled ? 0 : velocity.read();
    const height = window.innerHeight || 1;
    const dismiss = !cancelled && speed > -GESTURE.flickPxPerMs &&
      (position > height * GESTURE.dismissFraction || speed > GESTURE.flickPxPerMs);

    if (reduced()) {
      phase = "idle";
      setHandDrag(o, false);
      clearDismiss(o);
      if (dismiss) o.dismiss?.onDismiss();
      return;
    }

    phase = "settling-y";
    stopSpring = runSpring({
      from: position,
      to: dismiss ? height * 0.8 : 0,
      velocity: speed,
      omega: dismiss ? GESTURE.springNarrow : GESTURE.springBack,
      onUpdate: (value) => applyDismiss(o, value),
      onDone: () => {
        phase = "idle";
        stopSpring = null;
        setHandDrag(o, false);
        if (dismiss) o.dismiss?.onDismiss();
        else clearDismiss(o);
      },
    });
  };

  const endListeners = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    pointerId = null;
  };

  const beginX = (o: SlideGestureOptions, x: number) => {
    if (!reduced() || o.count <= 1) prepare(o);
    else {
      travel = o.getTravel?.() ?? (surface.offsetWidth || 1);
      index = o.getIndex();
      position = 0;
      shownTarget = index;
      if (!o.ghost) setSlidesBusy(slidesFor(o), true);
    }
    o.onGrab?.();
    setHandDrag(o, true);
    originX = x;
    velocity.reset();
    velocity.add(0);
    phase = "x";
  };

  function onDown(event: PointerEvent) {
    const o = getOptions();
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pointerId !== null) {
      // A second finger means a pinch, not a swipe: let go of the swipe where it is.
      if (event.pointerType === "touch") cancelActive();
      return;
    }
    if (o.blocked?.()) return;
    const target = event.target as Element | null;

    if (phase === "settling-x" || phase === "settling-y") {
      // Touching something in flight catches it where it is.
      stopSpring?.();
      stopSpring = null;
      settlingFinal = null;
      forcedTarget = null;
      const resumingX = phase === "settling-x";
      phase = resumingX ? "x" : "y";
      originX = event.clientX - position;
      originY = event.clientY - position;
      velocity.reset();
      velocity.add(position);
      if (event.pointerType === "mouse") setDraggingCursor(true);
    } else {
      if (target?.closest(o.ignore ? `${DEFAULT_IGNORE}, ${o.ignore}` : DEFAULT_IGNORE)) return;
      phase = "pending";
      startX = event.clientX;
      startY = event.clientY;
    }

    isMouse = event.pointerType === "mouse";
    pointerId = event.pointerId;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  function onMove(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    const o = getOptions();
    // A pinch has begun (or the picture is zoomed): this is no longer a swipe.
    if (o.blocked?.()) {
      cancelActive();
      return;
    }

    if (phase === "pending") {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.hypot(dx, dy) < GESTURE.axisLockPx) return;
      if (Math.abs(dx) > Math.abs(dy) && (o.count > 1 || o.dismiss)) {
        // Measure from where the finger landed, so no movement is lost to the axis lock.
        beginX(o, startX);
        if (isMouse) setDraggingCursor(true);
      } else if (o.dismiss && dy > 0) {
        phase = "y";
        setHandDrag(o, true);
        originY = startY;
        velocity.reset();
        velocity.add(0);
        if (isMouse) setDraggingCursor(true);
      } else {
        phase = "idle";
        endListeners();
        return;
      }
    }

    if (phase === "x") {
      const raw = event.clientX - originX;
      const x = o.count <= 1 ? raw * GESTURE.rubberBand : raw;
      velocity.add(x);
      if (reduced() && o.count > 1) position = x;
      else render(o, x);
    } else if (phase === "y") {
      const y = Math.max(0, event.clientY - originY);
      velocity.add(y);
      if (reduced()) position = y;
      else applyDismiss(o, y);
    }
  }

  function onUp(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    const o = getOptions();
    const wasDragging = phase === "x" || phase === "y";
    const wasX = phase === "x";
    endListeners();
    setDraggingCursor(false);
    if (!wasDragging) {
      phase = "idle";
      return;
    }
    suppressNextClick();
    if (wasX) releaseX(o);
    else releaseY(o);
  }

  function onCancel(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    const o = getOptions();
    const wasX = phase === "x";
    const wasY = phase === "y";
    endListeners();
    setDraggingCursor(false);
    if (wasX) releaseX(o, true);
    else if (wasY) releaseY(o, true);
    else phase = "idle";
  }

  function cancelActive() {
    const o = getOptions();
    const wasX = phase === "x";
    const wasY = phase === "y";
    endListeners();
    setDraggingCursor(false);
    if (wasX) releaseX(o, true);
    else if (wasY) releaseY(o, true);
    else phase = "idle";
  }

  /** Two-finger trackpad swipes. Vertical wheel movement always scrolls the page. */
  function onWheel(event: WheelEvent) {
    const o = getOptions();
    if (event.ctrlKey || o.count <= 1 || pointerId !== null || o.blocked?.()) return;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();

    const now = performance.now();
    if (now < wheelQuietUntil) {
      // The tail of the trackpad's own momentum must not turn into a second swipe.
      wheelQuietUntil = now + GESTURE.wheelQuietMs;
      return;
    }
    if (phase === "idle") beginX(o, 0);
    else if (phase === "settling-x") {
      stopSpring?.();
      stopSpring = null;
      settlingFinal = null;
      forcedTarget = null;
      phase = "x";
      velocity.reset();
      velocity.add(position);
    } else if (phase !== "x") return;

    const x = position - event.deltaX;
    velocity.add(x);
    if (reduced()) position = x;
    else render(o, x);

    const endSwipe = () => {
      window.clearTimeout(wheelIdleTimer);
      if (phase !== "x") return;
      wheelQuietUntil = performance.now() + GESTURE.wheelQuietMs;
      releaseX(getOptions());
    };
    window.clearTimeout(wheelIdleTimer);
    if (Math.abs(position) > travel * GESTURE.commitWide) endSwipe();
    else wheelIdleTimer = window.setTimeout(endSwipe, GESTURE.wheelIdleMs);
  }

  /** Arrow, dot or key: the same physics with a small push, in the direction of travel. */
  const moveTo = (target: number, step: number) => {
    const o = getOptions();
    if (o.count <= 1 || pointerId !== null) return;
    const next = wrapIndex(target, o.count);
    if (next === o.getIndex() && phase === "idle") return;
    prepare(o);
    o.onGrab?.();
    forcedTarget = next;
    settlingFinal = next;
    shownTarget = next;
    o.onTargetChange?.(next);
    if (reduced()) {
      finish(o, next);
      return;
    }
    const span = Math.min(Math.max((travel - 375) / (1440 - 375), 0), 1);
    const omega = GESTURE.springNarrow + (GESTURE.springWide - GESTURE.springNarrow) * span;
    phase = "settling-x";
    stopSpring = runSpring({
      from: 0,
      to: -step * travel,
      velocity: -step * travel * 0.0035,
      omega,
      onUpdate: (value) => render(o, value),
      onDone: () => finish(o, next),
    });
  };

  /** A second press while one is landing finishes it at once, so input is never blocked. */
  const moveWhenFree = (getTarget: (base: number) => number, getStep: (base: number, target: number) => number) => {
    const o = getOptions();
    if (phase === "settling-x" && settlingFinal !== null) {
      const base = settlingFinal;
      stopSpring?.();
      finish(o, base);
      const target = getTarget(base);
      requestAnimationFrame(() => moveTo(target, getStep(base, target)));
      return;
    }
    if (phase !== "idle") return;
    const base = o.getIndex();
    const target = getTarget(base);
    moveTo(target, getStep(base, target));
  };

  const controls = {
    step(direction: 1 | -1) {
      moveWhenFree((base) => base + direction, () => direction);
    },
    goTo(target: number) {
      moveWhenFree(
        () => target,
        (base, t) => {
          const count = getOptions().count;
          return wrapIndex(t - base, count) <= count / 2 ? 1 : -1;
        },
      );
    },
  };

  const onDragStart = (event: DragEvent) => event.preventDefault();

  const previousTouchAction = surface.style.touchAction;
  const previousOverscroll = surface.style.overscrollBehaviorX;
  surface.style.touchAction = getOptions().dismiss ? "none" : "pan-y";
  surface.style.overscrollBehaviorX = "contain";
  surface.addEventListener("pointerdown", onDown);
  surface.addEventListener("wheel", onWheel, { passive: false });
  surface.addEventListener("dragstart", onDragStart);

  const destroy = () => {
    stopSpring?.();
    endListeners();
    setDraggingCursor(false);
    window.clearTimeout(wheelIdleTimer);
    clearLingeringGhost();
    ghostEl?.remove();
    const o = getOptions();
    if (!o.ghost) setSlidesBusy(slidesFor(o), false);
    surface.style.touchAction = previousTouchAction;
    surface.style.overscrollBehaviorX = previousOverscroll;
    surface.removeEventListener("pointerdown", onDown);
    surface.removeEventListener("wheel", onWheel);
    surface.removeEventListener("dragstart", onDragStart);
  };

  return { destroy, controls };
}

/** Binds drag, flick and trackpad swipes to a slider surface. */
export function useSlideGesture(
  surfaceRef: RefObject<HTMLElement | null>,
  options: SlideGestureOptions,
  enabled = true,
  /** Bind again when the surface element itself is replaced. */
  rebindKey?: string,
) {
  const latest = useRef(options);
  latest.current = options;
  const bound = useRef<ReturnType<typeof bindSlideGesture> | null>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || !enabled) return;
    const binding = bindSlideGesture(surface, () => latest.current);
    bound.current = binding;
    return () => {
      binding.destroy();
      bound.current = null;
    };
  }, [surfaceRef, enabled, rebindKey]);

  /** For arrows, dots and keys: moves with the same physics as a swipe. */
  return useRef({
    step: (direction: 1 | -1) => bound.current?.controls.step(direction),
    goTo: (index: number) => bound.current?.controls.goTo(index),
  }).current;
}

type PullDismissOptions = {
  /** The panel that gets dragged. */
  sheet: HTMLElement;
  backdrop?: HTMLElement | null;
  /** Which way closes it. A menu that opens downward closes by pulling up. */
  direction?: "down" | "up";
  onDismiss: () => void;
};

/** True when something under the finger can still scroll in the direction of the drag. */
function canScrollFurther(from: Element | null, stop: HTMLElement, sign: 1 | -1) {
  for (let el = from; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    // A few pixels of leftover overflow should not swallow the first pull.
    if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 8) {
      const scrollable = sign > 0
        ? el.scrollTop > 0
        : el.scrollTop + el.clientHeight < el.scrollHeight - 8;
      if (scrollable) return true;
    }
    if (el === stop) break;
  }
  return false;
}

/**
 * Touch only: pulling a panel that has nothing left to scroll drags it, and any
 * other movement stays normal scrolling. Mouse users keep Esc, ✕ and the scrim.
 */
export function bindPullToDismiss({ sheet, backdrop, direction = "down", onDismiss }: PullDismissOptions) {
  const sign: 1 | -1 = direction === "down" ? 1 : -1;
  const velocity = createVelocityTracker();
  let startX = 0;
  let startY = 0;
  let origin = 0;
  /** Distance dragged, always positive in the closing direction. */
  let position = 0;
  let state: "idle" | "armed" | "dragging" = "idle";
  let stopSpring: (() => void) | null = null;

  const apply = (distance: number) => {
    position = distance;
    gsap.set(sheet, { y: distance * sign, force3D: true });
    if (backdrop) gsap.set(backdrop, { autoAlpha: 1 - Math.min(distance / (window.innerHeight || 1), 1) * 0.7 });
  };

  const onStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      state = "idle";
      return;
    }
    const touch = event.touches[0];
    if (stopSpring) {
      stopSpring();
      stopSpring = null;
      state = "dragging";
      origin = touch.clientY - position * sign;
      velocity.reset();
      velocity.add(position);
      return;
    }
    if (canScrollFurther(event.target as Element, sheet, sign)) {
      state = "idle";
      return;
    }
    state = "armed";
    startX = touch.clientX;
    startY = touch.clientY;
  };

  const onMove = (event: TouchEvent) => {
    if (state === "idle" || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (state === "armed") {
      const dx = touch.clientX - startX;
      const dy = (touch.clientY - startY) * sign;
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        if (Math.hypot(dx, dy) >= GESTURE.axisLockPx) state = "idle";
        return;
      }
      // Claim the first movement, or the browser starts its own overscroll.
      if (event.cancelable) event.preventDefault();
      if (Math.hypot(dx, dy) < GESTURE.axisLockPx) return;
      state = "dragging";
      origin = startY;
      gsap.killTweensOf(sheet, "y");
      if (backdrop) gsap.killTweensOf(backdrop);
      velocity.reset();
      velocity.add(0);
    }
    if (event.cancelable) event.preventDefault();
    const distance = Math.max(0, (touch.clientY - origin) * sign);
    velocity.add(distance);
    if (!prefersReducedMotion()) apply(distance);
    else position = distance;
  };

  const onEnd = () => {
    if (state !== "dragging") {
      state = "idle";
      return;
    }
    state = "idle";
    const speed = velocity.read();
    const height = window.innerHeight || 1;
    const dismiss = speed > -GESTURE.flickPxPerMs &&
      (position > height * GESTURE.dismissFraction || speed > GESTURE.flickPxPerMs);
    if (dismiss) {
      position = 0;
      onDismiss();
      return;
    }
    if (prefersReducedMotion()) {
      apply(0);
      return;
    }
    stopSpring = runSpring({
      from: position,
      to: 0,
      velocity: speed,
      omega: GESTURE.springBack,
      onUpdate: apply,
      onDone: () => {
        stopSpring = null;
        gsap.set(sheet, { y: 0 });
      },
    });
  };

  const previousOverscroll = sheet.style.overscrollBehaviorY;
  sheet.style.overscrollBehaviorY = "contain";
  sheet.addEventListener("touchstart", onStart, { passive: true });
  sheet.addEventListener("touchmove", onMove, { passive: false });
  sheet.addEventListener("touchend", onEnd, { passive: true });
  sheet.addEventListener("touchcancel", onEnd, { passive: true });

  return () => {
    stopSpring?.();
    sheet.style.overscrollBehaviorY = previousOverscroll;
    sheet.removeEventListener("touchstart", onStart);
    sheet.removeEventListener("touchmove", onMove);
    sheet.removeEventListener("touchend", onEnd);
    sheet.removeEventListener("touchcancel", onEnd);
  };
}

type SwipeAwayOptions = {
  /** Which items inside the host can be flicked away. */
  selector: string;
  ignore?: string;
  onDismiss: (item: HTMLElement) => void;
  onDragChange?: (dragging: boolean) => void;
};

/** Sideways drag or flick that throws an item off, for finger, stylus and mouse. */
export function bindSwipeAway(host: HTMLElement, { selector, ignore, onDismiss, onDragChange }: SwipeAwayOptions) {
  const velocity = createVelocityTracker();
  let item: HTMLElement | null = null;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let position = 0;
  let isMouse = false;
  let stopSpring: (() => void) | null = null;

  const render = (x: number) => {
    if (!item) return;
    position = x;
    gsap.set(item, { x, opacity: 1 - Math.min(Math.abs(x) / (item.offsetWidth || 1), 1) * 0.85 });
  };

  const end = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    pointerId = null;
    if (isMouse) setDraggingCursor(false);
  };

  const settle = (cancelled: boolean) => {
    const el = item;
    if (!el) return;
    const speed = cancelled ? 0 : velocity.read();
    const width = el.offsetWidth || 1;
    const direction = position < 0 ? -1 : 1;
    const thrown = Math.abs(speed) > GESTURE.flickPxPerMs && Math.sign(speed) === direction;
    const reversed = Math.abs(speed) > GESTURE.flickPxPerMs && Math.sign(speed) === -direction;
    const dismiss = !cancelled && !reversed && (Math.abs(position) > width * 0.35 || thrown);

    const done = () => {
      stopSpring = null;
      item = null;
      el.style.transition = "";
      onDragChange?.(false);
      if (dismiss) {
        gsap.set(el, { autoAlpha: 0 });
        onDismiss(el);
      }
      gsap.set(el, { clearProps: "transform,opacity,visibility" });
    };

    if (prefersReducedMotion()) {
      done();
      return;
    }
    stopSpring = runSpring({
      from: position,
      to: dismiss ? direction * (width + 24) : 0,
      velocity: speed,
      omega: dismiss ? GESTURE.springNarrow : GESTURE.springBack,
      onUpdate: render,
      onDone: done,
    });
  };

  function onDown(event: PointerEvent) {
    if ((event.pointerType === "mouse" && event.button !== 0) || pointerId !== null || stopSpring) return;
    const target = event.target as Element | null;
    const found = target?.closest<HTMLElement>(selector);
    if (!found || (ignore && target?.closest(ignore))) return;
    item = found;
    isMouse = event.pointerType === "mouse";
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragging = false;
    position = 0;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  function onMove(event: PointerEvent) {
    if (event.pointerId !== pointerId || !item) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!dragging) {
      if (Math.hypot(dx, dy) < GESTURE.axisLockPx) return;
      if (Math.abs(dx) <= Math.abs(dy)) {
        item = null;
        end();
        return;
      }
      dragging = true;
      item.style.transition = "none";
      onDragChange?.(true);
      velocity.reset();
      velocity.add(0);
      if (isMouse) setDraggingCursor(true);
    }
    velocity.add(dx);
    if (prefersReducedMotion()) position = dx;
    else render(dx);
  }

  function onUp(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    const wasDragging = dragging;
    end();
    if (!wasDragging) {
      item = null;
      return;
    }
    suppressNextClick();
    settle(false);
  }

  function onCancel(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    const wasDragging = dragging;
    end();
    if (wasDragging) settle(true);
    else item = null;
  }

  const previousTouchAction = host.style.touchAction;
  if (!previousTouchAction) host.style.touchAction = "pan-y";
  host.addEventListener("pointerdown", onDown);

  return () => {
    stopSpring?.();
    end();
    if (!previousTouchAction) host.style.touchAction = "";
    host.removeEventListener("pointerdown", onDown);
  };
}
