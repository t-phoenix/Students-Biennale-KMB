import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCanvasPack, getCanvasTier, type ArtworkCard, type CanvasItem } from "../../data/site";
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
/** Idle time before the canvas begins its organic zoom-out. */
const IDLE_ZOOM_DELAY = 1000;
const ZOOM_OUT_SCALE = 0.86;

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

  // Idle-gated organic zoom-out, with a fast smooth reset on any interaction.
  const zoomScale = useRef({ value: 1 });
  const zoomTween = useRef<gsap.core.Tween | null>(null);
  const zoomedOut = useRef(false);
  const lastInteractionAt = useRef(performance.now());

  const applyZoom = useCallback(() => {
    const el = zoomRef.current;
    if (el) el.style.transform = `scale(${zoomScale.current.value})`;
  }, []);

  const resetZoom = useCallback(() => {
    zoomedOut.current = false;
    zoomTween.current?.kill();
    zoomTween.current = gsap.to(zoomScale.current, {
      value: 1,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: applyZoom,
    });
  }, [applyZoom]);

  const startZoomOut = useCallback(() => {
    zoomedOut.current = true;
    zoomTween.current?.kill();
    zoomTween.current = gsap.to(zoomScale.current, {
      value: ZOOM_OUT_SCALE,
      duration: 3.5,
      ease: "sine.inOut",
      onUpdate: applyZoom,
    });
  }, [applyZoom]);

  /** Mark a real user interaction — resets the idle-zoom clock and, if the
   *  canvas is currently zoomed out (or mid-zoom), smoothly snaps it back. */
  const registerInteraction = useCallback(() => {
    lastInteractionAt.current = performance.now();
    if (zoomedOut.current || zoomScale.current.value !== 1) resetZoom();
  }, [resetZoom]);

  const q = query.trim().toLowerCase();
  const matches = useCallback(
    (item: CanvasItem) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.kind.toLowerCase().includes(q) ||
        item.meta.toLowerCase().includes(q) ||
        (item.tags?.includes(q) ?? false)
      );
    },
    [q]
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
  useEffect(() => {
    offset.current = { x: -40, y: -40 };
    vel.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform]);

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

        if (!zoomedOut.current && performance.now() - lastInteractionAt.current > IDLE_ZOOM_DELAY) {
          startZoomOut();
        }
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [applyTransform, paused, startZoomOut]);

  // Coming back from a paused state (e.g. closing the expand overlay)
  // shouldn't immediately trigger a zoom-out — give the user a fresh window.
  useEffect(() => {
    if (!paused) lastInteractionAt.current = performance.now();
  }, [paused]);

  useEffect(() => {
    if (!q) return;
    const hit = pool.find(matches);
    if (!hit) return;
    offset.current.x = -hit.x + window.innerWidth * 0.35;
    offset.current.y = -hit.y + window.innerHeight * 0.35;
    vel.current = { x: 0, y: 0 };
    applyTransform();
  }, [q, pool, matches, applyTransform]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      glideTween.current?.kill();
      registerInteraction();
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
      glideTween.current?.kill();
      registerInteraction();
      offset.current.x -= e.deltaX;
      offset.current.y -= e.deltaY;
      vel.current = { x: 0, y: 0 };
      applyTransform();
    };

    root.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    root.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      root.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      root.removeEventListener("wheel", onWheel);
    };
  }, [applyTransform, registerInteraction]);

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
    },
    { scope: rootRef, dependencies: [] }
  );

  const handleSelect = (item: CanvasItem, el: HTMLButtonElement) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
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
                        onSelect={handleSelect}
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
