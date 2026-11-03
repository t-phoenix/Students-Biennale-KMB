import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeLenis } from '../lib/lenisSingleton';
import './SketchLayer.css';

type SketchMode = 'navigate' | 'nudge' | 'sketch' | 'drawing';

interface RGB {
  r: number;
  g: number;
  b: number;
}

// 3 brand colors cycling continuously in 10s stages:
// 1st Green (#b4cf45) -> 2nd Cyan Blue (#7bc8c0) -> 3rd Red (#e83239)
const CYCLE_COLORS: RGB[] = [
  { r: 180, g: 207, b: 69 },  // 0: Green (#b4cf45)
  { r: 123, g: 200, b: 192 }, // 1: Cyan blue (#7bc8c0)
  { r: 232, g: 50, b: 57 },   // 2: Red (#e83239)
];

// 4th color: Black (#1b171c), only appears via shortcut and then cycles back to the other colors
const BLACK_COLOR: RGB = { r: 27, g: 23, b: 28 };

const CYCLE_STAGE_MS = 10000; // 10 seconds per transition
const MAIN_CYCLE_TOTAL_MS = CYCLE_COLORS.length * CYCLE_STAGE_MS; // 30 seconds total cycle

interface CycleState {
  fromBlackTime: number | null; // active when shortcut 4 (Black) was pressed
  baseWallTime: number;
  baseCycleStage: number; // 0: Green, 1: Cyan Blue, 2: Red
}

function lerpRGB(c1: RGB, c2: RGB, progress: number): string {
  const p = Math.max(0, Math.min(1, progress));
  const r = Math.round(c1.r + (c2.r - c1.r) * p);
  const g = Math.round(c1.g + (c2.g - c1.g) * p);
  const b = Math.round(c1.b + (c2.b - c1.b) * p);
  return `rgb(${r}, ${g}, ${b})`;
}

function getCycleColor(timestamp: number, state: CycleState): string {
  // If Black was selected via shortcut 4:
  if (state.fromBlackTime !== null) {
    const elapsedSinceBlack = timestamp - state.fromBlackTime;
    if (elapsedSinceBlack < CYCLE_STAGE_MS) {
      // Transitions smoothly from Black -> Green over 10 seconds
      const progress = elapsedSinceBlack / CYCLE_STAGE_MS;
      return lerpRGB(BLACK_COLOR, CYCLE_COLORS[0], progress);
    }
    // After 10s, smoothly merges into the normal cycle starting from Green
    const elapsedAfterGreen = elapsedSinceBlack - CYCLE_STAGE_MS;
    const t = elapsedAfterGreen % MAIN_CYCLE_TOTAL_MS;
    const stage = Math.floor(t / CYCLE_STAGE_MS);
    const nextStage = (stage + 1) % CYCLE_COLORS.length;
    const progress = (t % CYCLE_STAGE_MS) / CYCLE_STAGE_MS;
    return lerpRGB(CYCLE_COLORS[stage], CYCLE_COLORS[nextStage], progress);
  }

  // Normal 3-color brand cycle (Green -> Cyan Blue -> Red -> Green...)
  const elapsed = timestamp - state.baseWallTime;
  const initialOffset = state.baseCycleStage * CYCLE_STAGE_MS;
  const t = (((initialOffset + elapsed) % MAIN_CYCLE_TOTAL_MS) + MAIN_CYCLE_TOTAL_MS) % MAIN_CYCLE_TOTAL_MS;
  const stage = Math.floor(t / CYCLE_STAGE_MS);
  const nextStage = (stage + 1) % CYCLE_COLORS.length;
  const progress = (t % CYCLE_STAGE_MS) / CYCLE_STAGE_MS;

  return lerpRGB(CYCLE_COLORS[stage], CYCLE_COLORS[nextStage], progress);
}

const DEFAULT_WIDTH = 10;
const DEFAULT_OPACITY = 0.65;

const MIN_WIDTH = 1;
const MAX_WIDTH = 28;
const IDLE_MS = 3000;
const BURST_MAX = 2; // Up to 2 nudges before quiet period
const RESET_COOLDOWN_MS = 30000; // 30 seconds quiet window after 2 nudges, then resets count

function clampWidth(w: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
}

// A point is stored as a pixel offset from its anchor element's top-left
// corner, measured at draw time. On redraw it's re-placed at
// anchor.getBoundingClientRect().left/top (tracking scroll, resize, and
// reflow automatically) and scaled by a single uniform factor - so the
// whole stroke grows/shrinks together with the element like a sticker,
// never stretched or squeezed independently in x vs y.
interface AnchoredPoint {
  ox: number;
  oy: number;
  color: string;
}

interface ResolvedPoint {
  x: number;
  y: number;
  color: string;
}

interface Stroke {
  anchor: Element;
  anchorWidth: number; // anchor's rect.width at draw time, for proportional width scaling
  points: AnchoredPoint[];
  color: string;
  width: number;
  opacity?: number;
}

// Desktop, laptop, and iPad/tablets - supports fine pointer, iPad, or any touch tablet with width >= 600
function isSketchSupported() {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth < 600) return false;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const ua = navigator.userAgent;
  const isIpad = /iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isTablet = navigator.maxTouchPoints > 0;
  return hasFinePointer || isIpad || isTablet;
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

const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'option',
  'label',
  'summary',
  '[role="button"]',
  '[role="tab"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '.cta-link',
  '.cta-button',
  '.edition-search__clear',
  '.edition-view-toggle',
  '.carousel-nav',
  '.carousel-dots',
  '.gallery-lightbox',
].join(', ');

const HERO_OR_COVER_SELECTORS = [
  '.home-hero',
  '.edition-overview__hero',
  '.programmes__hero',
  '.detail__hero',
  '.detail__venue-hero',
  '.past-workshop-detail__feature-media',
  '.residencies__feature-media',
  '[data-hero]',
  '[data-cover]',
  '[data-no-sketch]',
  '[class*="--cover"]',
].join(', ');

function getInteractiveOrHero(
  canvas: HTMLCanvasElement | null,
  x: number,
  y: number
): {
  isInteractive: boolean;
  isDisallowed: boolean;
  target: HTMLElement | null;
} {
  if (typeof document === 'undefined') {
    return { isInteractive: false, isDisallowed: false, target: null };
  }

  let el: Element | null = null;
  if (canvas) {
    const prev = canvas.style.pointerEvents;
    canvas.style.pointerEvents = 'none';
    el = document.elementFromPoint(x, y);
    canvas.style.pointerEvents = prev;
  } else {
    el = document.elementFromPoint(x, y);
  }

  if (!el || el === document.documentElement || el === document.body) {
    return { isInteractive: false, isDisallowed: false, target: null };
  }

  // Header or Footer are always interactive and disallowed from sketching
  const headerOrFooter = el.closest('.site-header, .site-footer');
  if (headerOrFooter) {
    const clickable = el.closest('button, a, input, textarea, select, [role="button"]') as HTMLElement | null;
    return { isInteractive: true, isDisallowed: true, target: clickable || (headerOrFooter as HTMLElement) };
  }

  // Hero / cover areas where sketching is disallowed
  if (!el.closest('.site-hero-hold')) {
    if (el.closest(HERO_OR_COVER_SELECTORS) || (el.closest('[class*="hero"]') && !el.closest('.site-hero-hold'))) {
      const clickable = el.closest(
        'button, a, input, textarea, select, [role="button"], .cta-link'
      ) as HTMLElement | null;
      return { isInteractive: Boolean(clickable), isDisallowed: true, target: clickable };
    }
  }

  // Interactive controls: buttons, links, form inputs, tabs, CTAs
  const interactiveEl = el.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
  if (interactiveEl) {
    return { isInteractive: true, isDisallowed: false, target: interactiveEl };
  }

  return { isInteractive: false, isDisallowed: false, target: null };
}

function findStationaryAnchor(rawEl: Element): Element {
  // 1. If inside the Sensing Grounds strip (the moving image section in Home.tsx):
  // Anchor to the stationary section container so the stroke scrolls vertically
  // with the page but doesn't track horizontal marquee animation.
  const sensingSection = rawEl.closest('.home-sensing');
  if (sensingSection) {
    return sensingSection;
  }

  // 2. Generic check for any horizontally moving/animated marquee or track
  const movingContainer = rawEl.closest(
    '.home-sensing__scroll, .home-sensing__scroll-track, .home-sensing__scroll-item, [data-marquee], [class*="marquee"], [class*="ticker"], [class*="carousel-track"]'
  );
  if (movingContainer) {
    const stationaryParent =
      movingContainer.closest('section, main, article, .home-section, [class*="section"]') || document.body;
    return stationaryParent;
  }

  return rawEl;
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

function toAnchoredPoint(rect: DOMRect, clientX: number, clientY: number, color: string): AnchoredPoint {
  return {
    ox: clientX - rect.left,
    oy: clientY - rect.top,
    color,
  };
}

// Clean smoothed line: quadratic-curve stroke through captured points.
// Smoothly blends gradient colors across segments when cycling across colors.
function drawResolvedStroke(
  ctx: CanvasRenderingContext2D,
  pts: ResolvedPoint[],
  defaultColor: string,
  width: number,
  opacity: number = DEFAULT_OPACITY
) {
  if (pts.length === 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (pts.length === 1) {
    ctx.fillStyle = pts[0].color || defaultColor;
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (pts.length === 2) {
    const c0 = pts[0].color || defaultColor;
    const c1 = pts[1].color || defaultColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (c0 !== c1) {
      const grad = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
      grad.addColorStop(0, c0);
      grad.addColorStop(1, c1);
      ctx.strokeStyle = grad;
    } else {
      ctx.strokeStyle = c0;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // pts.length >= 3
  const firstColor = pts[0].color || defaultColor;
  let isUniform = true;
  for (let i = 1; i < pts.length; i++) {
    if ((pts[i].color || defaultColor) !== firstColor) {
      isUniform = false;
      break;
    }
  }

  if (isUniform) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width;
    ctx.strokeStyle = firstColor;
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
    return;
  }

  // Multi-color curve with smooth gradient transitions between points
  ctx.lineWidth = width;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';

  // Smooth start cap
  ctx.fillStyle = pts[0].color || defaultColor;
  ctx.beginPath();
  ctx.arc(pts[0].x, pts[0].y, width / 2, 0, Math.PI * 2);
  ctx.fill();

  let prevX = pts[0].x;
  let prevY = pts[0].y;

  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    const c0 = pts[i - 1].color || defaultColor;
    const c1 = pts[i].color || defaultColor;

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);

    if (c0 !== c1) {
      const grad = ctx.createLinearGradient(prevX, prevY, mx, my);
      grad.addColorStop(0, c0);
      grad.addColorStop(1, c1);
      ctx.strokeStyle = grad;
    } else {
      ctx.strokeStyle = c0;
    }
    ctx.stroke();

    prevX = mx;
    prevY = my;
  }

  // Final segment to last point
  const last = pts[pts.length - 1];
  const lastColor = last.color || defaultColor;
  const secondLastColor = pts[pts.length - 2].color || defaultColor;
  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(last.x, last.y);
  if (secondLastColor !== lastColor) {
    const grad = ctx.createLinearGradient(prevX, prevY, last.x, last.y);
    grad.addColorStop(0, secondLastColor);
    grad.addColorStop(1, lastColor);
    ctx.strokeStyle = grad;
  } else {
    ctx.strokeStyle = lastColor;
  }
  ctx.stroke();

  // Smooth end cap
  ctx.fillStyle = lastColor;
  ctx.beginPath();
  ctx.arc(last.x, last.y, width / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function resolveStrokePoints(stroke: Stroke): { points: ResolvedPoint[]; width: number } | null {
  if (!stroke.anchor.isConnected) return null;
  const rect = stroke.anchor.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  // One uniform scale for both axes (and for line width) - so the stroke
  // resizes with its anchor like a sticker, never warped independently.
  const scale = stroke.anchorWidth > 0 ? rect.width / stroke.anchorWidth : 1;
  return {
    points: stroke.points.map((p) => ({
      x: rect.left + p.ox * scale,
      y: rect.top + p.oy * scale,
      color: p.color || stroke.color,
    })),
    width: stroke.width * scale,
  };
}

export function SketchLayer() {
  const { pathname } = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cycleStateRef = useRef<CycleState>({
    fromBlackTime: null,
    baseWallTime: Date.now(),
    baseCycleStage: 0,
  });

  const [supported, setSupported] = useState(false);
  const [mode, setMode] = useState<SketchMode>('navigate');
  const [brushWidth, setBrushWidth] = useState(DEFAULT_WIDTH);
  const [cursor, setCursor] = useState(() => {
    const now = Date.now();
    const initialCycle: CycleState = {
      fromBlackTime: null,
      baseWallTime: now,
      baseCycleStage: 0,
    };
    return {
      x: 0,
      y: 0,
      on: false,
      color: getCycleColor(now, initialCycle),
    };
  });
  const [nudgeDismissing, setNudgeDismissing] = useState<{ x: number; y: number } | null>(null);

  const cursorRef = useRef({ x: 0, y: 0 });
  const modeRef = useRef<SketchMode>('navigate');
  const penActiveRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dprRef = useRef(1);
  const reducedMotionRef = useRef(false);
  const brushWidthRef = useRef(DEFAULT_WIDTH);
  const redrawRef = useRef<() => void>(() => {});
  const prevPathRef = useRef(pathname);
  const redrawScheduledRef = useRef(false);
  const nudgeCountRef = useRef(0);
  const lastNudgeDismissedAtRef = useRef(0);
  const hasEnteredSketchRef = useRef(false);

  brushWidthRef.current = brushWidth;

  const setModeBoth = useCallback((m: SketchMode) => {
    modeRef.current = m;
    setMode(m);
  }, []);

  const jumpToColor = useCallback((keyIndex: number) => {
    const now = Date.now();
    if (keyIndex === 3) {
      // 4th color is Black (#1b171c): only appears as shortcut,
      // transitions to Green over 10s, then rejoins standard 30s cycle
      cycleStateRef.current = {
        fromBlackTime: now,
        baseWallTime: now,
        baseCycleStage: 0,
      };
    } else {
      // Keys 1 (Green), 2 (Cyan Blue), 3 (Red)
      cycleStateRef.current = {
        fromBlackTime: null,
        baseWallTime: now,
        baseCycleStage: keyIndex,
      };
    }
    const newColor = getCycleColor(now, cycleStateRef.current);
    setCursor((c) => ({ ...c, color: newColor }));
    redrawRef.current();
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
      if (resolved) {
        drawResolvedStroke(ctx, resolved.points, stroke.color, resolved.width, stroke.opacity ?? DEFAULT_OPACITY);
      }
    }
    if (currentStrokeRef.current) {
      const resolved = resolveStrokePoints(currentStrokeRef.current);
      if (resolved) {
        drawResolvedStroke(
          ctx,
          resolved.points,
          currentStrokeRef.current.color,
          resolved.width,
          currentStrokeRef.current.opacity ?? DEFAULT_OPACITY
        );
      }
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

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (reducedMotionRef.current || modeRef.current !== 'navigate') return;
    if (hasEnteredSketchRef.current) return;

    const now = Date.now();
    const elapsedSinceDismiss = now - lastNudgeDismissedAtRef.current;

    // Reset burst count if 30s has passed since last dismiss
    if (elapsedSinceDismiss >= RESET_COOLDOWN_MS) {
      nudgeCountRef.current = 0;
    }

    // If burst limit reached, wait for the remaining 30s quiet window
    let delay = IDLE_MS;
    if (nudgeCountRef.current >= BURST_MAX) {
      const remainingCooldown = RESET_COOLDOWN_MS - elapsedSinceDismiss;
      if (remainingCooldown > 0) {
        delay = Math.max(IDLE_MS, remainingCooldown);
      } else {
        nudgeCountRef.current = 0;
      }
    }

    idleTimerRef.current = setTimeout(() => {
      if (modeRef.current === 'navigate' && !hasEnteredSketchRef.current) {
        const { isInteractive, isDisallowed } = getInteractiveOrHero(
          canvasRef.current,
          cursorRef.current.x,
          cursorRef.current.y
        );
        if (isInteractive || isDisallowed) {
          return;
        }

        const currentNow = Date.now();
        if (currentNow - lastNudgeDismissedAtRef.current >= RESET_COOLDOWN_MS) {
          nudgeCountRef.current = 0;
        }
        if (nudgeCountRef.current < BURST_MAX) {
          nudgeCountRef.current += 1;
          setModeBoth('nudge');
        }
      }
    }, delay);
  }, [clearIdleTimer, setModeBoth]);

  const dismissNudge = useCallback(() => {
    if (modeRef.current === 'nudge') {
      lastNudgeDismissedAtRef.current = Date.now();
      const pt = { x: cursorRef.current.x, y: cursorRef.current.y };
      setNudgeDismissing(pt);
      setTimeout(() => {
        setNudgeDismissing((curr) => (curr === pt ? null : curr));
      }, 260);
      setModeBoth('navigate');
      startIdleTimer();
    }
  }, [setModeBoth, startIdleTimer]);

  // Hard exit: clears all strokes only on route change or explicit reset
  const hardExit = useCallback(() => {
    currentStrokeRef.current = null;
    strokesRef.current = [];
    setModeBoth('navigate');
    setCursor((c) => ({ ...c, on: false }));
    redrawRef.current();
    startIdleTimer();
  }, [setModeBoth, startIdleTimer]);

  const enterSketch = useCallback(() => {
    hasEnteredSketchRef.current = true;
    clearIdleTimer();
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setModeBoth('sketch');
  }, [clearIdleTimer, setModeBoth]);

  // Soft exit: keeps all strokes on the page (P toggle, Esc, wheel scroll)
  const softExit = useCallback(() => {
    currentStrokeRef.current = null;
    setModeBoth('navigate');
    startIdleTimer();
  }, [setModeBoth, startIdleTimer]);

  // Route change -> clear sketches (sketches persist while staying on the page)
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
    return () => {
      el.classList.remove('scribble-hide-cursor');
      el.classList.remove('scribble-cursor-allow-hero');
    };
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

    let unhookLenis: (() => void) | undefined;
    const unsubscribeLenis = subscribeLenis((lenis) => {
      unhookLenis?.();
      unhookLenis = undefined;
      if (!lenis) return;
      lenis.on('scroll', scheduleRedraw);
      unhookLenis = () => lenis.off('scroll', scheduleRedraw);
    });

    const tick = () => {
      const m = modeRef.current;
      if (m === 'navigate') startIdleTimer();
    };

    // On iPad Pro / tablets with Apple Pencil, prevent default touch behavior when the stylus
    // touches down so the page stays completely stationary where it is, allowing the user to sketch
    const handleTouchStart = (e: TouchEvent) => {
      const isStylus = Array.from(e.touches).some((t: any) => t.touchType === 'stylus');
      if (isStylus) {
        penActiveRef.current = true;
        if (modeRef.current === 'navigate') {
          hasEnteredSketchRef.current = true;
          clearIdleTimer();
          setModeBoth('sketch');
        }
        const touch = e.touches[0];
        const { isInteractive, isDisallowed } = getInteractiveOrHero(canvasRef.current, touch.clientX, touch.clientY);
        if (!isInteractive && !isDisallowed) {
          e.preventDefault();
        }
      } else if (modeRef.current === 'drawing') {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const isStylus = Array.from(e.touches).some((t: any) => t.touchType === 'stylus');
      if (isStylus || modeRef.current === 'drawing') {
        // Stop iOS Safari from sliding/scrolling the page while sketching with pen
        e.preventDefault();
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'pen') {
        penActiveRef.current = true;
        if (modeRef.current === 'navigate') {
          hasEnteredSketchRef.current = true;
          clearIdleTimer();
          setModeBoth('sketch');
        }
      }

      const nowColor = getCycleColor(Date.now(), cycleStateRef.current);
      cursorRef.current = { x: e.clientX, y: e.clientY };

      const { isInteractive, isDisallowed } = getInteractiveOrHero(canvasRef.current, e.clientX, e.clientY);
      const shouldPassThrough = isInteractive || isDisallowed;

      // Custom brush follower is visible only when drawing is permitted at this location
      setCursor({
        x: e.clientX,
        y: e.clientY,
        on: !shouldPassThrough,
        color: nowColor,
      });

      const m = modeRef.current;
      const canvas = canvasRef.current;

      if (m === 'sketch') {
        if (shouldPassThrough) {
          if (canvas) canvas.style.pointerEvents = 'none';
          document.documentElement.classList.add('scribble-cursor-allow-hero');
        } else {
          if (canvas) canvas.style.pointerEvents = 'auto';
          document.documentElement.classList.remove('scribble-cursor-allow-hero');
        }
      }

      if ((m === 'nudge' || m === 'sketch' || m === 'drawing') && isDisallowed) {
        if (m === 'nudge') {
          dismissNudge();
        } else if (m === 'drawing' && currentStrokeRef.current) {
          strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
          currentStrokeRef.current = null;
          setModeBoth('sketch');
          redraw();
        }
        return;
      }
      if (m === 'nudge') {
        dismissNudge();
        return;
      }

      if (m === 'drawing' && currentStrokeRef.current) {
        if (isDisallowed) {
          return;
        }
        const rect = currentStrokeRef.current.anchor.getBoundingClientRect();
        currentStrokeRef.current.points.push(toAnchoredPoint(rect, e.clientX, e.clientY, nowColor));
        redraw();
        return;
      }
      tick();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const isPen = e.pointerType === 'pen';
      if (isPen) {
        penActiveRef.current = true;
        if (modeRef.current === 'navigate') {
          hasEnteredSketchRef.current = true;
          clearIdleTimer();
          setModeBoth('sketch');
        }
      }

      // On tablets where pen is active, ignore finger touches for drawing
      // so the user can use their finger to scroll, pan, and tap naturally
      if (penActiveRef.current && e.pointerType === 'touch') {
        return;
      }

      if (modeRef.current !== 'sketch') return;

      // Mouse requires left button (0); pen touches are always accepted
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const canvas = canvasRef.current;
      const { isInteractive, isDisallowed, target } = getInteractiveOrHero(canvas, e.clientX, e.clientY);

      // If clicked on an interactive element (button, link, CTA, input, tab) or disallowed hero:
      if (isInteractive || isDisallowed) {
        if (canvas) canvas.style.pointerEvents = 'none';
        if (target && e.target === canvas) {
          // Direct tap intercepted by canvas -> trigger the underlying button/link
          target.click();
          target.focus();
        }
        return;
      }

      if (isFormElement(e.target)) return;

      if (e.detail >= 2) {
        e.preventDefault();
        return;
      }

      if (!canvas) return;

      canvas.style.pointerEvents = 'auto';
      const nowColor = getCycleColor(Date.now(), cycleStateRef.current);
      const rawAnchor = elementUnderPoint(canvas, e.clientX, e.clientY);
      const anchor = findStationaryAnchor(rawAnchor);
      const rect = anchor.getBoundingClientRect();
      currentStrokeRef.current = {
        anchor,
        anchorWidth: rect.width,
        points: [toAnchoredPoint(rect, e.clientX, e.clientY, nowColor)],
        color: nowColor,
        width: brushWidthRef.current,
        opacity: DEFAULT_OPACITY,
      };
      setModeBoth('drawing');
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
      redraw();
      e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (modeRef.current !== 'drawing') return;

      if (currentStrokeRef.current) {
        strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
        currentStrokeRef.current = null;
      }
      setModeBoth('sketch');
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          if (e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        } catch {}
      }
      redraw();
    };

    const handleDblClick = (e: MouseEvent) => {
      // Strokes persist on double-click; double-clicking does not clear drawings
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
      } else if (key === ']') {
        e.preventDefault();
        setBrushWidth((w) => clampWidth(w + 2));
      } else if (key === '1' || key.toLowerCase() === 'g') {
        e.preventDefault();
        jumpToColor(0); // 1: Green (#b4cf45)
      } else if (key === '2' || key.toLowerCase() === 'c' || key.toLowerCase() === 't') {
        e.preventDefault();
        jumpToColor(1); // 2: Cyan Blue (#7bc8c0)
      } else if (key === '3' || key.toLowerCase() === 'r') {
        e.preventDefault();
        jumpToColor(2); // 3: Red (#e83239)
      } else if (key === '4' || key.toLowerCase() === 'b' || key.toLowerCase() === 'w') {
        e.preventDefault();
        jumpToColor(3); // 4: Black (#1b171c) - shortcut only, transitions to green then resumes cycle
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('dblclick', handleDblClick);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.classList.remove('scribble-cursor-allow-hero');
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', scheduleRedraw);
      unsubscribeLenis();
      unhookLenis?.();
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      clearIdleTimer();
    };
  }, [
    supported,
    redraw,
    scheduleRedraw,
    resizeCanvas,
    startIdleTimer,
    clearIdleTimer,
    setModeBoth,
    dismissNudge,
    softExit,
    enterSketch,
    jumpToColor,
  ]);

  if (!supported) return null;

  const isSketchActive = mode === 'sketch' || mode === 'drawing';
  const showBrush = (mode === 'nudge' || isSketchActive) && cursor.on;

  return (
    <div
      className={`scribble-layer ${mode === 'nudge' ? 'is-nudge' : ''} ${isSketchActive ? 'is-sketch' : ''} ${mode === 'drawing' ? 'is-drawing' : ''}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="scribble-layer__canvas" />

      {nudgeDismissing && (
        <div
          className="scribble-brush is-nudge is-dismissing"
          style={{ left: nudgeDismissing.x, top: nudgeDismissing.y }}
        >
          <svg className="scribble-brush__icon" width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path
              d="M22.5 2.5c.8-.8 2.1-.8 2.9 0l4.1 4.1c.8.8.8 2.1 0 2.9L12.2 26.8a2 2 0 0 1-.9.5l-5.6 1.4a1 1 0 0 1-1.2-1.2l1.4-5.6c.1-.3.3-.6.5-.9L22.5 2.5Z"
              fill="currentColor"
            />
            <path d="M6.2 25.8 10.4 21.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
          </svg>
          <span className="scribble-brush__hint">press P</span>
        </div>
      )}

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
            <span
              className="scribble-brush__ring"
              style={{
                width: brushWidth,
                height: brushWidth,
                borderColor: cursor.color || 'currentColor',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
