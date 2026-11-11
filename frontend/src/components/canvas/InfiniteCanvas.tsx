import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { getCanvasPack, getCanvasTier, type ArtworkCard, type CanvasItem } from "../../data/site";
import { alignPackToPixels } from "../../lib/discoverCanvas";
import { findCard } from "../../lib/catalogue";
import {
  getDiscoverEagerImageUrls,
  prefetchArtworkGallery,
} from "../../lib/predictivePrefetch";
import { EASE, gsap, prefersReducedMotion } from "../../lib/motion";
import { CanvasTile } from "./CanvasTile";
import "./InfiniteCanvas.css";

type Props = {
  query: string;
  onSelect: (item: CanvasItem, el: HTMLButtonElement) => void;
  /** True while something (e.g. the expand overlay) covers the canvas —
   *  ambient drift and idle zoom pause so the space isn't drifting/zoomed
   *  out from under the user when they come back to it. */
  paused?: boolean;
  artworks?: ArtworkCard[];
  sourceKey?: string;
};

/** Vertical repeat count *per column* — each column has its own period. Two copies cover the
 *  screen at every wrap position because a column's period is several screens tall. */
const REPEAT_Y = 2;
/** How far the pointer must travel before a press becomes a drag (a shorter press is a click). */
const DRAG_THRESHOLD = 6;
/** Friction after a throw: velocity falls by e^(-FRICTION) each second, so a throw glides
 *  velocity / FRICTION pixels and settles smoothly, with no fixed end point. */
const FRICTION = 3.4;
/** Only the last stretch of a drag sets the throw: lifting after a pause places the field. */
const THROW_WINDOW_MS = 60;
const MAX_THROW = 4200; // px per second
/** How quickly the slow drift takes over again once a throw has died down (per second). */
const DRIFT_BLEND = 0.7;
/** User-controlled zoom range — Ctrl+wheel/trackpad-pinch on desktop, real
 *  two-finger pinch on touch. */
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
/** Where the canvas rests: 10% closer than the layout's own size (see CANVAS_DENSITY). */
const REST_ZOOM = 1.1;
/** Wheel-delta-to-zoom sensitivity for Ctrl+scroll / trackpad pinch. */
const WHEEL_ZOOM_SPEED = 0.012;

function wrap(n: number, size: number) {
  return ((n % size) + size) % size;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Re-tier on real viewport-width crossings only, not every pixel of resize. */
function useCanvasTier() {
  const [tier, setTier] = useState(() =>
    getCanvasTier(typeof window === "undefined" ? 1440 : window.innerWidth)
  );
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = getCanvasTier(window.innerWidth);
        setTier((prev) => (prev === next ? prev : next));
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);
  return tier;
}

export function InfiniteCanvas({ query, onSelect, paused = false, artworks, sourceKey }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  // Column-wrapper elements, keyed "tx-col" — every X-copy has its own set of
  // column wrappers, but wrappers sharing the same col index always get the
  // same Y-transform (a column's period doesn't depend on which X-copy it's in).
  const columnEls = useRef(new Map<string, HTMLDivElement>());

  const tier = useCanvasTier();
  const [dpr, setDpr] = useState(() => (typeof window === "undefined" ? 1 : window.devicePixelRatio || 1));
  const dprRef = useRef(dpr);
  dprRef.current = dpr;
  useEffect(() => {
    const onResize = () => setDpr((prev) => (prev === (window.devicePixelRatio || 1) ? prev : window.devicePixelRatio || 1));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const pack = useMemo(
    () => alignPackToPixels(getCanvasPack(tier, artworks, sourceKey), dpr),
    [tier, sourceKey, artworks, dpr],
  );
  const { items: pool, seedW, colWidths, colPeriods } = pack;
  // Enough copies side by side to cover the screen even when zoomed all the way out: a
  // narrow phone needs two, a wide monitor more. (The old fixed three left a gap at the
  // right of very wide screens once the world was made narrower.)
  const repeatX = useMemo(() => {
    const viewportW = typeof window === "undefined" ? 1440 : window.innerWidth;
    return Math.max(2, Math.min(6, Math.ceil((seedW + viewportW / MIN_ZOOM) / seedW)));
  }, [seedW, tier]);
  const columns = colWidths.length;
  const tileKey = `masonry-${tier}`;

  const eagerImageUrls = useMemo(() => {
    const viewportW = rootRef.current?.getBoundingClientRect().width || window.innerWidth;
    const viewportH = rootRef.current?.getBoundingClientRect().height || window.innerHeight;
    // A little beyond the screen, so the edge tiles are ready too.
    return getDiscoverEagerImageUrls(artworks, viewportW * 1.1, viewportH * 1.1, sourceKey);
  }, [artworks, sourceKey, tier, seedW]);

  const itemsByCol = useMemo(() => {
    const groups: CanvasItem[][] = Array.from({ length: columns }, () => []);
    for (const item of pool) groups[item.col]?.push(item);
    return groups;
  }, [pool, columns]);

  const offset = useRef({ x: -40, y: -40 });
  /** The field's velocity in px per second: set by a throw, decays with friction, and blends
   *  into the slow drift. One velocity for everything, so a throw hands over to the drift
   *  seamlessly instead of stopping and starting again. */
  const vel = useRef({ x: 0, y: 0 });
  const samples = useRef<{ x: number; y: number; t: number }[]>([]);
  /** A tile under a resting mouse: the drift eases to a stop so it doesn't slide away. */
  const hoveringTile = useRef(false);
  const lastInteract = useRef(0);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const suppressClick = useRef(false);
  const pointerId = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0, t: 0 });
  const origin = useRef({ x: 0, y: 0 });

  // Buttery release glide — a GSAP-authored ease replaces per-frame friction
  // decay, so momentum reads as a deliberately-curved deceleration rather
  // than a mechanical multiply-by-0.94 stop.
  const glideTween = useRef<gsap.core.Tween | null>(null);

  // Ambient auto-pan — the canvas never sits fully still. Direction/speed
  // itself glides to a new slow target every 10-16s, so the drift reads as
  // alive rather than a constant conveyor-belt vector.
  const ambient = useRef({ vx: 0, vy: 0 });
  const ambientWanderTimeout = useRef<number | undefined>(undefined);

  // User-controlled zoom — Ctrl+wheel/trackpad-pinch (desktop) or a real
  // two-finger pinch (touch). Persists at whatever level the user sets it to;
  // panning/dragging no longer resets it.
  const zoomScale = useRef({ value: REST_ZOOM });
  const targetZoomRef = useRef(REST_ZOOM);
  const zoomTween = useRef<gsap.core.Tween | null>(null);
  const zoomFocalRef = useRef({ x: 0, y: 0 });

  const applyZoom = useCallback(() => {
    const el = zoomRef.current;
    if (el) el.style.transform = `scale(${zoomScale.current.value})`;
  }, []);

  const pinch = useRef<{
    startDist: number;
    startZoom: number;
    midX: number;
    midY: number;
  } | null>(null);

  const q = query.trim().toLowerCase();
  const queryTokens = useMemo(() => q.split(/\s+/).filter(Boolean), [q]);

  const matches = useCallback(
    (item: CanvasItem) => {
      if (queryTokens.length === 0) return true;
      const haystack = [
        item.name,
        item.kind,
        item.meta,
        item.tags,
        item.bio,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return queryTokens.every((token) => haystack.includes(token));
    },
    [queryTokens]
  );

  // Direct DOM class toggling (not React state) so hovering doesn't re-render
  // every tile on the canvas — this can be a large tile count and re-rendering
  // all of them per mouse move would be the kind of jank GSAP everywhere else
  // in this component is specifically built to avoid.
  const handleTileHover = useCallback(
    (id: string | null) => {
      // Only a real hovering mouse pauses the drift (a tap also fires mouseenter on touch).
      if (window.matchMedia("(hover: hover)").matches) hoveringTile.current = Boolean(id);
      // Tiles passing under the pointer during a drag are not being looked at: no prefetching.
      if (dragging.current) return;
      if (!id || !artworks?.length || !id.startsWith("aw-")) return;
      const artworkId = id.slice(3).replace(/__c\d+-\d+$/, "");
      const artwork = findCard(artworks, artworkId);
      prefetchArtworkGallery(artwork);
    },
    [artworks],
  );

  const applyTransform = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    // Positions are NOT rounded to whole pixels: the drift is only a few pixels a second,
    // so rounding turns it into a step every dozen frames, which reads as stutter. The
    // GPU moves layers smoothly at sub-pixel positions on its own.
    // World handles X only — all columns share the same horizontal period.
    const x = -wrap(-offset.current.x, seedW);
    world.style.transform = `translate3d(${x}px, 0, 0)`;

    // Each column wraps on its own vertical period, so different columns'
    // "reset" points land at different Y — no shared seam across the canvas.
    for (let col = 0; col < columns; col++) {
      const period = colPeriods[col] || 1;
      const y = -wrap(-offset.current.y, period);
      const transform = `translate3d(0, ${y}px, 0)`;
      for (let tx = 0; tx < repeatX; tx++) {
        const el = columnEls.current.get(`${tx}-${col}`);
        if (el) el.style.transform = transform;
      }
    }
  }, [seedW, columns, colPeriods, repeatX]);

  const zoomTo = useCallback(
    (
      targetScale: number,
      focalX: number,
      focalY: number,
      options?: { duration?: number; ease?: string }
    ) => {
      const next = clamp(targetScale, MIN_ZOOM, MAX_ZOOM);
      targetZoomRef.current = next;
      zoomFocalRef.current = { x: focalX, y: focalY };

      zoomTween.current?.kill();

      if (prefersReducedMotion()) {
        const prev = zoomScale.current.value;
        zoomScale.current.value = next;
        offset.current.x += focalX * (1 / next - 1 / prev);
        offset.current.y += focalY * (1 / next - 1 / prev);
        applyZoom();
        applyTransform();
        return;
      }

      let lastScale = zoomScale.current.value;
      zoomTween.current = gsap.to(zoomScale.current, {
        value: next,
        duration: options?.duration ?? 0.65,
        ease: options?.ease ?? "power3.out",
        overwrite: "auto",
        onUpdate: () => {
          const currentScale = zoomScale.current.value;
          const fx = zoomFocalRef.current.x;
          const fy = zoomFocalRef.current.y;
          if (currentScale > 0 && lastScale > 0) {
            offset.current.x += fx * (1 / currentScale - 1 / lastScale);
            offset.current.y += fy * (1 / currentScale - 1 / lastScale);
          }
          lastScale = currentScale;
          applyZoom();
          applyTransform();
        },
      });
    },
    [applyZoom, applyTransform]
  );

  // The pan offset is only meaningful relative to the current seed size —
  // re-centre when a resize crosses a tier boundary (seedW/colPeriods change).
  // Centered horizontally so the viewport opens on the middle of one repeat
  // period (equal random-jittered field on both sides) rather than an
  // arbitrary small pan from the period's edge.
  useEffect(() => {
    const viewportW = rootRef.current?.getBoundingClientRect().width || window.innerWidth;
    offset.current = { x: -(seedW - viewportW) / 2, y: -40 };
    vel.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform, seedW]);

  // Ambient wander: pick a new slow drift target on a randomized cadence,
  // easing to it rather than snapping — that's what reads as "living" rather
  // than mechanical. Runs once for the component's lifetime.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const wander = () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      gsap.to(ambient.current, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        duration: 4 + Math.random() * 2,
        ease: "sine.inOut",
      });
      ambientWanderTimeout.current = window.setTimeout(wander, 10000 + Math.random() * 6000);
    };
    // Start drifting almost immediately rather than waiting out the first
    // full idle cycle.
    ambientWanderTimeout.current = window.setTimeout(wander, 600);

    return () => window.clearTimeout(ambientWanderTimeout.current);
  }, []);

  // The drift runs on GSAP's ticker, the same frame loop as every other animation, and
  // moves by elapsed time, so its speed is identical at 60 Hz and 120 Hz.
  const ready = useRef(false);
  const dirty = useRef(false);
  const glidingRef = useRef(false);
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const step = (_time: number, deltaTime: number) => {
      // While dragging, the field follows the finger: moves are applied here, once per frame.
      if (dragging.current) {
        if (dirty.current) {
          dirty.current = false;
          applyTransform();
        }
        return;
      }
      if (paused || !ready.current) return;
      // A search glide is in charge of the position while it runs.
      if (glideTween.current?.isActive()) {
        vel.current = { x: 0, y: 0 };
        return;
      }
      const seconds = Math.min(deltaTime, 50) / 1000;
      const v = vel.current;
      // The throw slows with friction...
      const decay = Math.exp(-seconds * FRICTION);
      v.x *= decay;
      v.y *= decay;
      // ...and the slow drift gradually takes over (none while the mouse rests on a tile).
      if (!reduced) {
        const tx = hoveringTile.current ? 0 : ambient.current.vx;
        const ty = hoveringTile.current ? 0 : ambient.current.vy;
        const k = Math.min(1, seconds * DRIFT_BLEND);
        v.x += (tx - v.x) * k;
        v.y += (ty - v.y) * k;
      }
      // While the field glides fast, tiles slide past a still mouse: their hover lift is held
      // back until it settles, or each tile would pop up and drop as it passes.
      const gliding = Math.hypot(v.x, v.y) > 60;
      if (gliding !== glidingRef.current) {
        glidingRef.current = gliding;
        rootRef.current?.classList.toggle("is-gliding", gliding);
      }
      if (Math.abs(v.x) < 0.001 && Math.abs(v.y) < 0.001 && !dirty.current) return;
      dirty.current = false;
      offset.current.x += v.x * seconds;
      offset.current.y += v.y * seconds;
      applyTransform();
    };
    gsap.ticker.add(step);
    return () => {
      gsap.ticker.remove(step);
    };
  }, [applyTransform, paused]);

  useEffect(() => {
    if (!q) return;
    const hit = pool.find(matches);
    if (!hit) return;
    const viewportW = rootRef.current?.getBoundingClientRect().width || window.innerWidth;
    const viewportH = rootRef.current?.getBoundingClientRect().height || window.innerHeight;
    const targetX = -hit.x + viewportW * 0.35;
    const targetY = -hit.y + viewportH * 0.35;
    glideTween.current?.kill();
    if (!prefersReducedMotion()) {
      glideTween.current = gsap.to(offset.current, {
        x: targetX,
        y: targetY,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: applyTransform,
      });
    } else {
      offset.current.x = targetX;
      offset.current.y = targetY;
      applyTransform();
    }
  }, [q, pool, matches, applyTransform]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      glideTween.current?.kill();
      dragging.current = true;
      didDrag.current = false;
      suppressClick.current = false;
      pointerId.current = e.pointerId;
      // Pressing catches a moving field, like a hand landing on a sliding print.
      vel.current = { x: 0, y: 0 };
      origin.current = { x: e.clientX, y: e.clientY };
      last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
      samples.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    };

    // The page hides its header while the canvas is in use. Telling it a few times a second is
    // enough; telling it on every pointer event restarted the header's animation constantly.
    const interacting = () => {
      const now = performance.now();
      if (now - lastInteract.current < 250) return;
      lastInteract.current = now;
      window.dispatchEvent(new CustomEvent("canvas:interacting"));
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current || e.pointerId !== pointerId.current) return;
      if (!didDrag.current) {
        if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) < DRAG_THRESHOLD)
          return;
        didDrag.current = true;
        suppressClick.current = true;
        root.classList.add("is-grabbing");
        try {
          root.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        // No early return: the field catches up with the pointer from where the press began,
        // so it stays locked under the finger instead of trailing it by the threshold.
      }
      const now = performance.now();
      offset.current.x += e.clientX - last.current.x;
      offset.current.y += e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY, t: now };
      const list = samples.current;
      list.push({ x: e.clientX, y: e.clientY, t: now });
      while (list.length > 2 && now - list[0].t > THROW_WINDOW_MS * 2) list.shift();
      dirty.current = true;
      interacting();
    };

    const onPointerUp = (e: PointerEvent) => {
      root.classList.remove("is-grabbing");
      if (e.pointerId !== pointerId.current && dragging.current) {
        // If an unexpected pointer up occurred while dragging, still clean up
        dragging.current = false;
        pointerId.current = null;
      }
      if (e.pointerId === pointerId.current) {
        dragging.current = false;
        pointerId.current = null;
        try {
          if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }

        // The throw: the pointer's velocity over the last moment of the drag, measured over
        // real time (correct at 60 Hz and 120 Hz alike). Lifting after a pause gives none.
        const now = performance.now();
        const list = samples.current.filter((pt) => now - pt.t <= THROW_WINDOW_MS);
        let vx = 0;
        let vy = 0;
        if (didDrag.current && list.length >= 2 && !prefersReducedMotion()) {
          const a = list[0];
          const z = list[list.length - 1];
          const span = Math.max(8, z.t - a.t) / 1000;
          vx = (z.x - a.x) / span;
          vy = (z.y - a.y) / span;
          const speed = Math.hypot(vx, vy);
          if (speed > MAX_THROW) {
            vx *= MAX_THROW / speed;
            vy *= MAX_THROW / speed;
          }
          if (speed < 60) vx = vy = 0;
        }
        vel.current = { x: vx, y: vy };
        samples.current = [];
        dirty.current = true;
      }

      // Allow click events on tiles fired synchronously in this tick, but reset suppression immediately after
      setTimeout(() => {
        suppressClick.current = false;
      }, 50);
    };

    const onWheel = (e: WheelEvent) => {
      // An opened artwork, image viewer or any other overlay scrolls on its own: the
      // canvas underneath must neither move nor swallow the wheel.
      if ((e.target as Element | null)?.closest?.(".canvas-expand, .gallery-lightbox, [role='dialog']")) return;
      e.preventDefault();
      interacting();

      const rect = root.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (e.ctrlKey) {
        // Trackpad pinch or Ctrl + mouse wheel zoom
        const sensitivity = WHEEL_ZOOM_SPEED;
        const currentTarget = targetZoomRef.current || zoomScale.current.value;
        const delta = -e.deltaY * sensitivity;
        const nextTarget = clamp(currentTarget + delta, MIN_ZOOM, MAX_ZOOM);

        zoomTo(nextTarget, clientX, clientY, {
          duration: 0.6,
          ease: "power3.out",
        });
        return;
      }

      // Normal wheel: pan with momentum glide
      // Trackpads bring their own momentum and wheels move in steps: the field takes the
      // movement as it comes, applied on the next frame; the drift eases back in afterwards.
      glideTween.current?.kill();
      offset.current.x -= e.deltaX;
      offset.current.y -= e.deltaY;
      vel.current = { x: 0, y: 0 };
      dirty.current = true;
    };

    const onDblClick = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const current = zoomScale.current.value;
      // Double-click zooms in close; double-click again returns to the resting view.
      const nextTarget = current < REST_ZOOM + 0.05 ? REST_ZOOM * 1.25 : REST_ZOOM;
      zoomTo(nextTarget, clientX, clientY, {
        duration: 0.75,
        ease: "power3.out",
      });
    };

    // Two-finger touch pinch. Touch events fire alongside Pointer Events for
    // the same gesture, so a second finger touching down cancels any
    // single-pointer drag already in progress to avoid the two paths fighting
    // over `offset`.
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      dragging.current = false;
      pointerId.current = null;
      root.classList.remove("is-grabbing");
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const rect = root.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
      pinch.current = {
        startDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
        startZoom: zoomScale.current.value,
        midX,
        midY,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinch.current) return;
      e.preventDefault();
      interacting();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / (pinch.current.startDist || 1);
      const target = clamp(pinch.current.startZoom * ratio, MIN_ZOOM, MAX_ZOOM);
      const rect = root.getBoundingClientRect();
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
      zoomTo(target, midX, midY, { duration: 0.15, ease: "power2.out" });
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        if (pinch.current) {
          zoomTo(targetZoomRef.current, pinch.current.midX, pinch.current.midY, {
            duration: 0.6,
            ease: "power3.out",
          });
          pinch.current = null;
        }
      }
    };

    root.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("wheel", onWheel, { passive: false });
    const onGesture = (e: Event) => e.preventDefault();
    window.addEventListener("gesturestart", onGesture, { passive: false } as any);
    window.addEventListener("gesturechange", onGesture, { passive: false } as any);
    root.addEventListener("dblclick", onDblClick);
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      root.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("gesturestart", onGesture as any);
      window.removeEventListener("gesturechange", onGesture as any);
      root.removeEventListener("dblclick", onDblClick);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [applyTransform, zoomTo]);

  // Opening: the field stays hidden until every picture on the opening screen has been
  // fetched and decoded, then all of it is revealed together in one GSAP timeline. That
  // is what keeps tiles from popping in one by one in whatever order they happen to load.
  const [isReady, setIsReady] = useState(false);
  const tilesInView = useCallback(() => {
    const root = rootRef.current;
    if (!root) return [] as HTMLElement[];
    const view = root.getBoundingClientRect();
    return Array.from(root.querySelectorAll<HTMLElement>(".canvas-tile")).filter((tile) => {
      const b = tile.getBoundingClientRect();
      return b.right > view.left && b.left < view.right && b.bottom > view.top && b.top < view.bottom;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    ready.current = false;
    setIsReady(false);
    const open = async () => {
      // Two frames: the opening position has been applied and tiles have been laid out.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (cancelled) return;
      const pictures = tilesInView()
        .map((tile) => tile.querySelector<HTMLImageElement>("img"))
        .filter((img): img is HTMLImageElement => Boolean(img));
      const decoded = Promise.all(
        pictures.map((img) => (typeof img.decode === "function" ? img.decode().catch(() => undefined) : Promise.resolve())),
      );
      // Never leave someone staring at a blank screen if a picture is slow or missing.
      await Promise.race([decoded, new Promise<void>((resolve) => window.setTimeout(resolve, 6000))]);
      if (cancelled) return;
      ready.current = true;
      setIsReady(true);
    };
    void open();
    return () => {
      cancelled = true;
    };
  }, [tileKey, tilesInView]);

  useLayoutEffect(() => {
    if (!isReady) return;
    const root = rootRef.current;
    if (!root) return;
    const tiles = tilesInView();
    const view = root.getBoundingClientRect();
    if (prefersReducedMotion() || !tiles.length) return;

    // Ripple outward from the centre of the screen, finishing within about a second.
    const cx = view.left + view.width / 2;
    const cy = view.top + view.height / 2;
    const distance = tiles.map((tile) => {
      const b = tile.getBoundingClientRect();
      return Math.hypot(b.left + b.width / 2 - cx, b.top + b.height / 2 - cy);
    });
    const farthest = Math.max(...distance, 1);
    gsap.set(tiles, { autoAlpha: 0 });
    const reveal = gsap.to(tiles, {
      autoAlpha: 1,
      duration: 0.9,
      ease: EASE.reveal,
      delay: (index: number) => (distance[index] / farthest) * 0.55,
      clearProps: "opacity,visibility",
    });
    // A very slight settle of the whole field as it appears.
    zoomScale.current.value = REST_ZOOM * 0.97;
    applyZoom();
    zoomTo(REST_ZOOM, view.width / 2, view.height / 2, { duration: 1.6, ease: "power2.out" });
    return () => {
      reveal.kill();
      gsap.set(tiles, { clearProps: "opacity,visibility" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const handleSelect = useCallback(
    (item: CanvasItem, el: HTMLButtonElement) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      if (item.id.startsWith("aw-") && artworks?.length) {
        const artworkId = item.id.slice(3).replace(/__c\d+-\d+$/, "");
        prefetchArtworkGallery(findCard(artworks, artworkId));
      }
      onSelect(item, el);
    },
    [artworks, onSelect],
  );

  const tileCopies = useMemo(
    () =>
      itemsByCol.map((items, col) => {
        const colPeriod = colPeriods[col] || 1;
        return Array.from({ length: REPEAT_Y }, (_, ty) =>
          items.map((item) => ({ source: item, placed: ty === 0 ? item : { ...item, y: item.y + ty * colPeriod }, ty })),
        ).flat();
      }),
    [itemsByCol, colPeriods],
  );
  const xCopies = useMemo(() => Array.from({ length: repeatX }, (_, tx) => tx), [repeatX]);
  const colIndexes = useMemo(() => Array.from({ length: columns }, (_, i) => i), [columns]);

  return (
    <div
      ref={rootRef}
      className={`infinite-canvas${isReady ? "" : " is-loading"}`}
      aria-label="Discover Artworks canvas"
      aria-busy={!isReady}
    >
      {isReady ? null : (
        <div className="infinite-canvas__loading" aria-hidden>
          <img src="/logo-sb-mark.svg" alt="" />
        </div>
      )}
      <div ref={zoomRef} className="infinite-canvas__zoom">
        <div
          ref={worldRef}
          className="infinite-canvas__world"
          style={{ width: seedW * repeatX, height: "100%" }}
        >
          {xCopies.map((tx) => (
            <div
              key={`${tileKey}-x${tx}`}
              className="infinite-canvas__xcopy"
              style={{ left: tx * seedW, width: seedW }}
            >
              {colIndexes.map((col) => (
                <div
                  key={`${tileKey}-x${tx}-c${col}`}
                  ref={(el) => {
                    const key = `${tx}-${col}`;
                    if (el) columnEls.current.set(key, el);
                    else columnEls.current.delete(key);
                  }}
                  className="infinite-canvas__column"
                >
                  {tileCopies[col].map(({ source, placed, ty }) => (
                    <CanvasTile
                      key={`${tileKey}-x${tx}-c${col}-y${ty}-${source.id}`}
                      item={placed}
                      dimmed={Boolean(q) && !matches(source)}
                      highlighted={Boolean(q) && matches(source)}
                      eager={Boolean(source.image && eagerImageUrls.has(source.image))}
                      onSelect={handleSelect}
                      onHoverChange={handleTileHover}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
