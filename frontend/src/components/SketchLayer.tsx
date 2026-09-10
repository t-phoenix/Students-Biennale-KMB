import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './SketchLayer.css';

type SketchMode = 'navigate' | 'nudge' | 'sketch' | 'drawing';

const WHITE = '#ffffff';
const RED = '#ec3b43';
const BLACK = '#000000';

const MIN_WIDTH = 1;
const MAX_WIDTH = 28;
const IDLE_MS = 2000;
const AUTO_EXIT_MS = 10000;

function clampWidth(w: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
}

// A point is stored as a fraction of its anchor element's live bounding box,
// not an absolute pixel. Position is recomputed from the element's current
// getBoundingClientRect() on every redraw, so it tracks scroll, resize, and
// layout reflow automatically - no scroll-offset bookkeeping needed at all.
interface AnchoredPoint {
  fx: number;
  fy: number;
}

interface ResolvedPoint {
  x: number;
  y: number;
}

interface Stroke {
  anchor: Element;
  anchorWidth: number; // anchor's rect.width at draw time, for proportional width scaling
  points: AnchoredPoint[];
  color: string;
  width: number;
}

// Desktop, laptop, and iPad only - matches production: width >= 768 AND (fine pointer OR iPad)
function isSketchSupported() {
  if (typeof window === 'undefined' || window.innerWidth < 768) return false;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const ua = navigator.userAgent;
  const isIpad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return hasFinePointer || isIpad;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isFormElement(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function rectContains(el: Element | null, x: number, y: number) {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function isOverHeaderOrFooter(x: number, y: number) {
  return (
    rectContains(document.querySelector('.site-header'), x, y) ||
    rectContains(document.querySelector('.site-footer'), x, y)
  );
}

// Finds the real page element under a point, temporarily disabling the
// canvas's own hit-testing so it doesn't just return itself.
function elementUnderPoint(canvas: HTMLCanvasElement, x: number, y: number): Element {
  const prev = canvas.style.pointerEvents;
  canvas.style.pointerEvents = 'none';
  const el = document.elementFromPoint(x, y);
  canvas.style.pointerEvents = prev;
  return el && el !== document.documentElement ? el : document.body;
}

function toAnchoredPoint(rect: DOMRect, clientX: number, clientY: number): AnchoredPoint {
  return {
    fx: rect.width > 0 ? (clientX - rect.left) / rect.width : 0,
    fy: rect.height > 0 ? (clientY - rect.top) / rect.height : 0,
  };
}

// Clean smoothed line: a solid quadratic-curve stroke through the captured
// points (rounded caps/joins), with no grain/texture overlay. Operates on
// already-resolved (absolute, viewport-space) points.
function drawResolvedStroke(ctx: CanvasRenderingContext2D, pts: ResolvedPoint[], color: string, width: number) {
  if (pts.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 1;

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  const last = pts[pts.length - 1];
  const secondLast = pts[pts.length - 2];
  ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
  ctx.stroke();

  ctx.restore();
}

function resolveStrokePoints(stroke: Stroke): { points: ResolvedPoint[]; width: number } | null {
  if (!stroke.anchor.isConnected) return null;
  const rect = stroke.anchor.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const scale = stroke.anchorWidth > 0 ? rect.width / stroke.anchorWidth : 1;
  return {
    points: stroke.points.map((p) => ({ x: rect.left + p.fx * rect.width, y: rect.top + p.fy * rect.height })),
    width: stroke.width * scale,
  };
}

export function SketchLayer() {
  const { pathname } = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [supported, setSupported] = useState(false);
  const [mode, setMode] = useState<SketchMode>('navigate');
  const [brushColor, setBrushColor] = useState<string>(BLACK);
  const [brushWidth, setBrushWidth] = useState(1);
  const [cursor, setCursor] = useState({ x: 0, y: 0, on: false });

  const modeRef = useRef<SketchMode>('navigate');
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dprRef = useRef(1);
  const reducedMotionRef = useRef(false);
  const brushColorRef = useRef(BLACK);
  const brushWidthRef = useRef(1);
  const redrawRef = useRef<() => void>(() => {});
  const prevPathRef = useRef(pathname);
  const redrawScheduledRef = useRef(false);

  brushColorRef.current = brushColor;
  brushWidthRef.current = brushWidth;

  const setModeBoth = useCallback((m: SketchMode) => {
    modeRef.current = m;
    setMode(m);
  }, []);

  // Every stroke's position is re-derived from its anchor element's live
  // rect, so this is correct no matter when it runs - it only needs to run
  // often enough to look smooth, not on any particular schedule.
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = dprRef.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const stroke of strokesRef.current) {
      const resolved = resolveStrokePoints(stroke);
      if (resolved) drawResolvedStroke(ctx, resolved.points, stroke.color, resolved.width);
    }
    if (currentStrokeRef.current) {
      const resolved = resolveStrokePoints(currentStrokeRef.current);
      if (resolved) drawResolvedStroke(ctx, resolved.points, currentStrokeRef.current.color, resolved.width);
    }
  }, []);
  redrawRef.current = redraw;

  // rAF-throttled: coalesces bursts of scroll/resize events into at most one
  // repaint per frame, and costs nothing at all when nothing is happening -
  // no polling loop running in the background.
  const scheduleRedraw = useCallback(() => {
    if (redrawScheduledRef.current) return;
    redrawScheduledRef.current = true;
    requestAnimationFrame(() => {
      redrawScheduledRef.current = false;
      redraw();
    });
  }, [redraw]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    redraw();
  }, [redraw]);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);
  const clearAutoExitTimer = useCallback(() => {
    if (autoExitTimerRef.current) clearTimeout(autoExitTimerRef.current);
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (!reducedMotionRef.current && modeRef.current === 'navigate') {
      idleTimerRef.current = setTimeout(() => {
        if (modeRef.current === 'navigate') setModeBoth('nudge');
      }, IDLE_MS);
    }
  }, [clearIdleTimer, setModeBoth]);

  const dismissNudge = useCallback(() => {
    if (modeRef.current === 'nudge') {
      setModeBoth('navigate');
      startIdleTimer();
    }
  }, [setModeBoth, startIdleTimer]);

  // Hard exit: clears all strokes (double-click, header/footer, route change, 10s inactivity)
  const hardExit = useCallback(() => {
    clearAutoExitTimer();
    currentStrokeRef.current = null;
    strokesRef.current = [];
    setModeBoth('navigate');
    setCursor((c) => ({ ...c, on: false }));
    redrawRef.current();
    startIdleTimer();
  }, [clearAutoExitTimer, setModeBoth, startIdleTimer]);

  const startAutoExitTimer = useCallback(() => {
    clearAutoExitTimer();
    if (modeRef.current === 'sketch' || modeRef.current === 'drawing') {
      autoExitTimerRef.current = setTimeout(() => {
        if (modeRef.current === 'sketch' || modeRef.current === 'drawing') hardExit();
      }, AUTO_EXIT_MS);
    }
  }, [clearAutoExitTimer, hardExit]);

  const enterSketch = useCallback(() => {
    clearIdleTimer();
    clearAutoExitTimer();
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setModeBoth('sketch');
    startAutoExitTimer();
  }, [clearIdleTimer, clearAutoExitTimer, setModeBoth, startAutoExitTimer]);

  // Soft exit: keeps strokes on the page (P toggle, Esc, wheel scroll)
  const softExit = useCallback(() => {
    clearAutoExitTimer();
    currentStrokeRef.current = null;
    setModeBoth('navigate');
    startIdleTimer();
  }, [clearAutoExitTimer, setModeBoth, startIdleTimer]);

  const exitOrDismiss = useCallback(() => {
    if (modeRef.current === 'nudge') {
      dismissNudge();
    } else if (modeRef.current === 'sketch' || modeRef.current === 'drawing') {
      hardExit();
    }
  }, [dismissNudge, hardExit]);

  // Route change -> hard exit (matches production: sketches clear on navigation)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      hardExit();
    }
  }, [pathname, hardExit]);

  useEffect(() => {
    const update = () => {
      reducedMotionRef.current = prefersReducedMotion();
      setSupported(isSketchSupported());
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    const hide = mode === 'nudge' || mode === 'sketch' || mode === 'drawing';
    el.classList.toggle('scribble-hide-cursor', hide);
    return () => el.classList.remove('scribble-hide-cursor');
  }, [mode]);

  useEffect(() => {
    if (!supported) {
      setModeBoth('navigate');
      return;
    }

    resizeCanvas();
    startIdleTimer();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', scheduleRedraw, { passive: true });
    // Lenis mounts asynchronously in Layout.tsx - poll briefly for it and hook its scroll event too
    let unhookLenis: (() => void) | undefined;
    const lenisCheck = window.setInterval(() => {
      const lenis = (window as unknown as { __lenis?: { on: (e: string, cb: () => void) => void; off: (e: string, cb: () => void) => void } }).__lenis;
      if (!lenis || unhookLenis) return;
      lenis.on('scroll', scheduleRedraw);
      unhookLenis = () => lenis.off('scroll', scheduleRedraw);
    }, 500);

    const tick = () => {
      const m = modeRef.current;
      if (m === 'navigate') startIdleTimer();
      else if (m === 'sketch') startAutoExitTimer();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const overHeaderFooter = isOverHeaderOrFooter(e.clientX, e.clientY);
      setCursor({ x: e.clientX, y: e.clientY, on: !overHeaderFooter });

      const m = modeRef.current;
      if ((m === 'nudge' || m === 'sketch' || m === 'drawing') && overHeaderFooter) {
        exitOrDismiss();
        return;
      }
      if (m === 'nudge') return;

      if (m === 'drawing' && currentStrokeRef.current) {
        const rect = currentStrokeRef.current.anchor.getBoundingClientRect();
        currentStrokeRef.current.points.push(toAnchoredPoint(rect, e.clientX, e.clientY));
        redraw();
        startAutoExitTimer();
        return;
      }
      tick();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (modeRef.current !== 'sketch' || e.button !== 0 || isFormElement(e.target)) return;

      if (e.detail >= 2) {
        exitOrDismiss();
        e.preventDefault();
        return;
      }
      if (isOverHeaderOrFooter(e.clientX, e.clientY)) {
        exitOrDismiss();
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      clearAutoExitTimer();
      const anchor = elementUnderPoint(canvas, e.clientX, e.clientY);
      const rect = anchor.getBoundingClientRect();
      currentStrokeRef.current = {
        anchor,
        anchorWidth: rect.width,
        points: [toAnchoredPoint(rect, e.clientX, e.clientY)],
        color: brushColorRef.current,
        width: brushWidthRef.current,
      };
      setModeBoth('drawing');
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
      redraw();
      e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (modeRef.current !== 'drawing' || !currentStrokeRef.current) return;
      if (e.button !== 0 && e.type !== 'pointercancel') return;

      strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
      currentStrokeRef.current = null;
      setModeBoth('sketch');
      startAutoExitTimer();
      redraw();
    };

    const handleDblClick = (e: MouseEvent) => {
      if (modeRef.current !== 'sketch' && modeRef.current !== 'drawing') return;
      exitOrDismiss();
      e.preventDefault();
    };

    const handleWheel = () => {
      const m = modeRef.current;
      if (m === 'nudge') {
        dismissNudge();
      } else if (m === 'sketch' || m === 'drawing') {
        currentStrokeRef.current = null;
        softExit();
        redraw();
      } else {
        tick();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFormElement(e.target)) return;
      const key = e.key;

      if (key === 'p' || key === 'P') {
        e.preventDefault();
        if (modeRef.current === 'sketch' || modeRef.current === 'drawing') {
          currentStrokeRef.current = null;
          softExit();
          redraw();
        } else {
          enterSketch();
        }
        return;
      }

      if (key === 'Escape') {
        if (modeRef.current !== 'navigate') {
          e.preventDefault();
          currentStrokeRef.current = null;
          softExit();
          redraw();
        }
        return;
      }

      if (modeRef.current !== 'sketch' && modeRef.current !== 'drawing') {
        tick();
        return;
      }

      if (key === '[') {
        e.preventDefault();
        setBrushWidth((w) => clampWidth(w - 2));
        startAutoExitTimer();
      } else if (key === ']') {
        e.preventDefault();
        setBrushWidth((w) => clampWidth(w + 2));
        startAutoExitTimer();
      } else if (key === '1') {
        e.preventDefault();
        setBrushColor(WHITE);
        startAutoExitTimer();
      } else if (key === '2') {
        e.preventDefault();
        setBrushColor(RED);
        startAutoExitTimer();
      } else if (key === '3') {
        e.preventDefault();
        setBrushColor(BLACK);
        startAutoExitTimer();
      } else {
        startAutoExitTimer();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('dblclick', handleDblClick);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', scheduleRedraw);
      window.clearInterval(lenisCheck);
      unhookLenis?.();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      clearIdleTimer();
      clearAutoExitTimer();
    };
  }, [
    supported,
    redraw,
    scheduleRedraw,
    resizeCanvas,
    startIdleTimer,
    startAutoExitTimer,
    clearIdleTimer,
    clearAutoExitTimer,
    setModeBoth,
    dismissNudge,
    exitOrDismiss,
    softExit,
    enterSketch,
  ]);

  if (!supported) return null;

  const isSketchActive = mode === 'sketch' || mode === 'drawing';
  const showBrush = (mode === 'nudge' || isSketchActive) && cursor.on;

  return (
    <div
      className={`scribble-layer ${mode === 'nudge' ? 'is-nudge' : ''} ${isSketchActive ? 'is-sketch' : ''}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="scribble-layer__canvas" />

      {showBrush && (
        <div
          className={`scribble-brush ${mode === 'nudge' ? 'is-nudge' : 'is-sketch'}`}
          style={{ left: cursor.x, top: cursor.y }}
        >
          <svg className="scribble-brush__icon" width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M22.5 2.5c.8-.8 2.1-.8 2.9 0l4.1 4.1c.8.8.8 2.1 0 2.9L12.2 26.8a2 2 0 0 1-.9.5l-5.6 1.4a1 1 0 0 1-1.2-1.2l1.4-5.6c.1-.3.3-.6.5-.9L22.5 2.5Z"
              fill="currentColor"
            />
            <path d="M6.2 25.8 10.4 21.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
          </svg>
          {mode === 'nudge' ? (
            <span className="scribble-brush__hint">press P</span>
          ) : (
            <span className="scribble-brush__ring" style={{ width: brushWidth, height: brushWidth, borderColor: 'currentColor' }} />
          )}
        </div>
      )}
    </div>
  );
}
