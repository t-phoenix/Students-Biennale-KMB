import { useCallback, useEffect, useMemo, useRef } from "react";
import { getCanvasPool, getCanvasSeedSize, type CanvasItem } from "../../data/discover";
import { CanvasTile } from "./CanvasTile";
import "./InfiniteCanvas.css";

type Props = {
  query: string;
  onSelect: (item: CanvasItem, el: HTMLButtonElement) => void;
};

const REPEAT = 3;
const DRAG_THRESHOLD = 5;

function wrap(n: number, size: number) {
  return ((n % size) + size) % size;
}

export function InfiniteCanvas({ query, onSelect }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const pool = useMemo(() => getCanvasPool(), []);
  const { width: seedW, height: seedH } = useMemo(() => getCanvasSeedSize(), []);

  const offset = useRef({ x: -seedW * 0.2, y: -seedH * 0.15 });
  const vel = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const suppressClick = useRef(false);
  const pointerId = useRef<number | null>(null);
  const last = useRef({ x: 0, y: 0, t: 0 });
  const origin = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  const q = query.trim().toLowerCase();
  const matches = useCallback(
    (item: CanvasItem) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.kind.toLowerCase().includes(q) ||
        item.meta.toLowerCase().includes(q)
      );
    },
    [q]
  );

  const applyTransform = useCallback(() => {
    const el = worldRef.current;
    if (!el) return;
    const x = -wrap(-offset.current.x, seedW) - seedW;
    const y = -wrap(-offset.current.y, seedH) - seedH;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, [seedW, seedH]);

  useEffect(() => {
    applyTransform();
  }, [applyTransform]);

  useEffect(() => {
    const step = () => {
      if (!dragging.current) {
        const vx = vel.current.x;
        const vy = vel.current.y;
        if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
          offset.current.x += vx;
          offset.current.y += vy;
          vel.current.x *= 0.94;
          vel.current.y *= 0.94;
          applyTransform();
        }
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [applyTransform]);

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
        const totalX = e.clientX - origin.current.x;
        const totalY = e.clientY - origin.current.y;
        if (Math.hypot(totalX, totalY) < DRAG_THRESHOLD) return;
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
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
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
  }, [applyTransform]);

  const handleSelect = (item: CanvasItem, el: HTMLButtonElement) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onSelect(item, el);
  };

  const seeds = useMemo(() => {
    const out: Array<{ key: string; ox: number; oy: number }> = [];
    for (let ty = 0; ty < REPEAT; ty++) {
      for (let tx = 0; tx < REPEAT; tx++) {
        out.push({ key: `${tx}-${ty}`, ox: tx * seedW, oy: ty * seedH });
      }
    }
    return out;
  }, [seedW, seedH]);

  return (
    <div ref={rootRef} className="infinite-canvas" aria-label="Discover Artworks canvas">
      <div
        ref={worldRef}
        className="infinite-canvas__world"
        style={{ width: seedW * REPEAT, height: seedH * REPEAT }}
      >
        {seeds.map(({ key, ox, oy }) => (
          <div
            key={key}
            className="infinite-canvas__seed"
            style={{ width: seedW, height: seedH, transform: `translate(${ox}px, ${oy}px)` }}
          >
            {pool.map((item) => (
              <CanvasTile
                key={`${key}-${item.id}`}
                item={item}
                dimmed={Boolean(q) && !matches(item)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
