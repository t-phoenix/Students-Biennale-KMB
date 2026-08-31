import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCanvasPack, getCanvasTier, type ArtworkCard, type CanvasItem } from "../../data/site";
import { findCard } from "../../lib/catalogue";
import {
  getDiscoverEagerImageUrls,
  prefetchArtworkGallery,
} from "../../lib/predictivePrefetch";
import { gsap, prefersReducedMotion, useGSAP } from "../../lib/motion";
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

/** Horizontal repeat count — all columns share one X period (seedW). */
const REPEAT_X = 3;
/** Vertical repeat count *per column* — each column has its own period. */
const REPEAT_Y = 3;
const DRAG_THRESHOLD = 5;

/** How far a released flick glides, as a multiplier on its exit velocity. */
const THROW_DISTANCE_MULT = 14;
/** User-controlled zoom range — Ctrl+wheel/trackpad-pinch on desktop, real
 *  two-finger pinch on touch. */
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
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
  const pack = useMemo(
    () => getCanvasPack(tier, artworks, sourceKey),
    [tier, sourceKey, artworks],
  );
  const { items: pool, seedW, colWidths, colPeriods } = pack;
  const columns = colWidths.length;
  const tileKey = `masonry-${tier}`;

  const eagerImageUrls = useMemo(() => {
    const viewportW = rootRef.current?.getBoundingClientRect().width || window.innerWidth;
    const viewportH = rootRef.current?.getBoundingClientRect().height || window.innerHeight;
    return getDiscoverEagerImageUrls(artworks, viewportW, viewportH, sourceKey);
  }, [artworks, sourceKey, tier, seedW]);

  const itemsByCol = useMemo(() => {
    const groups: CanvasItem[][] = Array.from({ length: columns }, () => []);
    for (const item of pool) groups[item.col]?.push(item);
    return groups;
  }, [pool, columns]);

  const offset = useRef({ x: -40, y: -40 });
  const vel = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const suppressClick = useRef(false);
  const pointerId = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0, t: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

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
  // panning/dragging no longer resets it (that was specific to the old
  // idle-triggered auto zoom, which this replaces).
  const zoomScale = useRef({ value: 1 });
  const zoomTween = useRef<gsap.core.Tween | null>(null);

  const applyZoom = useCallback(() => {
    const el = zoomRef.current;
    if (el) el.style.transform = `scale(${zoomScale.current.value})`;
  }, []);

  const setZoom = useCallback(
    (value: number, animate = false) => {
      const next = clamp(value, MIN_ZOOM, MAX_ZOOM);
      zoomTween.current?.kill();
      if (animate && !prefersReducedMotion()) {
        zoomTween.current = gsap.to(zoomScale.current, {
          value: next,
          duration: 0.3,
          ease: "power2.out",
          onUpdate: applyZoom,
        });
      } else {
        zoomScale.current.value = next;
        applyZoom();
      }
    },
    [applyZoom]
  );

  const pinch = useRef<{ startDist: number; startZoom: number } | null>(null);

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
      const root = rootRef.current;
      if (!root) return;
      root.querySelectorAll<HTMLElement>(".canvas-tile").forEach((tile) => {
        tile.classList.toggle("is-hover-dimmed", id !== null && tile.dataset.id !== id);
      });

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
    // World handles X only — all columns share the same horizontal period.
    const x = -wrap(-offset.current.x, seedW) - seedW;
    world.style.transform = `translate3d(${x}px, 0, 0)`;

    // Each column wraps on its own vertical period, so different columns'
    // "reset" points land at different Y — no shared seam across the canvas.
    for (let col = 0; col < columns; col++) {
      const period = colPeriods[col] || 1;
      const y = -wrap(-offset.current.y, period) - period;
      const transform = `translate3d(0, ${y}px, 0)`;
      for (let tx = 0; tx < REPEAT_X; tx++) {
        const el = columnEls.current.get(`${tx}-${col}`);
        if (el) el.style.transform = transform;
      }
    }
  }, [seedW, columns, colPeriods]);

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

  useEffect(() => {
    const step = () => {
      if (!dragging.current && !paused) {
        offset.current.x += ambient.current.vx / 60;
        offset.current.y += ambient.current.vy / 60;
        applyTransform();
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
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
      vel.current = { x: 0, y: 0 };
      origin.current = { x: e.clientX, y: e.clientY };
      last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
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
        last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
        return;
      }
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      const now = performance.now();
      const dt = Math.max(16, now - last.current.t);
      offset.current.x += dx;
      offset.current.y += dy;
      vel.current.x = (dx / dt) * 16;
      vel.current.y = (dy / dt) * 16;
      last.current = { x: e.clientX, y: e.clientY, t: now };
      applyTransform();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId.current) return;
      dragging.current = false;
      pointerId.current = null;
      root.classList.remove("is-grabbing");
      try {
        if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      const speed = Math.hypot(vel.current.x, vel.current.y);
      if (speed > 0.4 && !prefersReducedMotion()) {
        const targetX = offset.current.x + vel.current.x * THROW_DISTANCE_MULT;
        const targetY = offset.current.y + vel.current.y * THROW_DISTANCE_MULT;
        const duration = clamp(0.5 + speed * 0.03, 0.5, 1.4);
        glideTween.current?.kill();
        glideTween.current = gsap.to(offset.current, {
          x: targetX,
          y: targetY,
          duration,
          ease: "power3.out",
          onUpdate: applyTransform,
        });
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Browsers report trackpad pinch as wheel events with ctrlKey set —
      // this one branch covers desktop Ctrl+scroll and trackpad pinch alike.
      if (e.ctrlKey) {
        setZoom(zoomScale.current.value - e.deltaY * WHEEL_ZOOM_SPEED);
        return;
      }
      glideTween.current?.kill();
      offset.current.x -= e.deltaX;
      offset.current.y -= e.deltaY;
      vel.current = { x: 0, y: 0 };
      applyTransform();
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
      pinch.current = {
        startDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
        startZoom: zoomScale.current.value,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinch.current) return;
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / pinch.current.startDist;
      setZoom(pinch.current.startZoom * ratio);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch.current = null;
    };

    root.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      root.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [applyTransform, setZoom]);

  // Entrance "whoa" moment — tiles stagger into place from a random order
  // (not a mechanical sweep) while the whole field gently arrives from a
  // slight zoom-out. Runs once; skipped under reduced motion.
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        zoomScale.current.value = 1;
        applyZoom();
        return;
      }
      zoomScale.current.value = 0.92;
      applyZoom();
      gsap.to(zoomScale.current, {
        value: 1,
        duration: 1.3,
        ease: "power2.out",
        onUpdate: applyZoom,
      });
      gsap.from(".canvas-tile", {
        opacity: 0,
        scale: 0.9,
        duration: 0.9,
        ease: "power2.out",
        stagger: { each: 0.015, from: "random", amount: 1.1 },
      });

      // Safety net: this tween sets tiles to opacity:0 immediately and
      // relies on the animation ticking them back up. If anything interrupts
      // that (a killed/reverted context, a tab that's backgrounded when the
      // tween would start, etc.) tiles are left permanently invisible — the
      // whole canvas silently breaks. Force the true end state well after
      // the animation could possibly still be running, regardless of
      // whether it actually completed normally.
      const safety = setTimeout(() => {
        gsap.set(".canvas-tile", { opacity: 1, scale: 1 });
      }, 2500);
      return () => clearTimeout(safety);
    },
    { scope: rootRef, dependencies: [] }
  );

  const handleSelect = (item: CanvasItem, el: HTMLButtonElement) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (item.id.startsWith("aw-") && artworks?.length) {
      const artworkId = item.id.slice(3).replace(/__c\d+-\d+$/, "");
      prefetchArtworkGallery(findCard(artworks, artworkId));
    }
    onSelect(item, el);
  };

  const xCopies = useMemo(() => Array.from({ length: REPEAT_X }, (_, tx) => tx), []);
  const colIndexes = useMemo(() => Array.from({ length: columns }, (_, i) => i), [columns]);
  const yCopies = useMemo(() => Array.from({ length: REPEAT_Y }, (_, ty) => ty), []);

  return (
    <div ref={rootRef} className="infinite-canvas" aria-label="Discover Artworks canvas">
      <div ref={zoomRef} className="infinite-canvas__zoom">
        <div
          ref={worldRef}
          className="infinite-canvas__world"
          style={{ width: seedW * REPEAT_X, height: "100%" }}
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
                  {yCopies.map((ty) =>
                    itemsByCol[col].map((item) => (
                      <CanvasTile
                        key={`${tileKey}-x${tx}-c${col}-y${ty}-${item.id}`}
                        item={ty === 0 ? item : { ...item, y: item.y + ty * colPeriods[col] }}
                        dimmed={Boolean(q) && !matches(item)}
                        highlighted={Boolean(q) && matches(item)}
                        eager={Boolean(item.image && eagerImageUrls.has(item.image))}
                        onSelect={handleSelect}
                        onHoverChange={handleTileHover}
                      />
                    ))
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
