import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { getLenisInstance } from '../lib/lenisSingleton';
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
/** Rest before the first "press P" hint of a visit, and before every later one. */
const FIRST_IDLE_MS = 3000;
const IDLE_MS = 2000;
/** The first hint of a visit becomes the cursor for this long, following the mouse. */
const INTRO_NUDGE_MS = 5000;
/** Once per visit: a refresh or a fresh open of the site shows the long first hint again. */
let introNudgeShown = false;

function clampWidth(w: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
}

// A point is stored as a pixel offset from its anchor element's top-left
// corner, measured at draw time, and re-placed from the anchor's layout box
// (tracking resize and reflow) with one uniform scale - so the whole stroke
// grows/shrinks with the element like a sticker, never warped in x vs y.
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
  anchorWidth: number; // anchor's layout width at draw time, for proportional scaling
  points: AnchoredPoint[];
  color: string;
  width: number;
  opacity?: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** An element's layout box in document coordinates. */
interface LayoutBox {
  left: number;
  top: number;
  width: number;
}

/**
 * Where an element sits in the page's layout, in document coordinates, ignoring CSS transforms.
 *
 * Transforms are deliberately ignored: images drift with scroll parallax, sections rise in on
 * reveal, cards lift on hover. A stroke attached to the transformed box would slide with the
 * parallax ("moving when scrolling") instead of staying where it was drawn. The layout box only
 * moves when the page really reflows (resize, an accordion opening above), and the stroke follows that.
 * Returns null when the element is not laid out (removed, display: none, collapsed).
 */
function layoutBox(anchor: Element): LayoutBox | null {
  let el: Element | null = anchor;
  while (el && !(el instanceof HTMLElement)) el = el.parentElement;
  const h = (el as HTMLElement | null) ?? document.body;
  if (!h.isConnected) return null;
  if (h !== document.body && h.offsetWidth === 0 && h.offsetHeight === 0 && h.getClientRects().length === 0) {
    return null;
  }

  let x = 0;
  let y = 0;
  let fixed = false;
  let e: HTMLElement | null = h;
  while (e && e !== document.body) {
    x += e.offsetLeft;
    y += e.offsetTop;
    const parent = e.offsetParent as HTMLElement | null;
    if (!parent) {
      fixed = getComputedStyle(e).position === 'fixed';
      break;
    }
    // With <body> as the offset parent, offsets are already measured from the page itself.
    if (parent === document.body) break;
    x += parent.clientLeft;
    y += parent.clientTop;
    e = parent;
  }
  // Content inside its own scroller (a modal sheet, a scrolling row) moves with that scroller.
  for (let p = h.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
    x -= p.scrollLeft;
    y -= p.scrollTop;
  }
  // A fixed element's offsets are relative to the screen: turn them into page coordinates.
  if (fixed) {
    x += window.scrollX;
    y += window.scrollY;
  }
  return { left: x, top: y, width: h.offsetWidth || h.getBoundingClientRect().width };
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
  '[tabindex]:not([tabindex="-1"])',
  '.cta-link',
  '.cta-button',
  '.brand-arrow',
  '.home-text-btn',
  '.fig-subheading',
  '.edition-search__clear',
  '.edition-view-toggle',
  '.edition-view-toggle__btn',
  '.edition-shell__archive-toggle',
  '.carousel-nav',
  '.carousel-nav__arrow',
  '.carousel-dots',
  '.gallery-lightbox',
  '.home-hero__card',
  '.home-hero__stack',
  '.home-hero__card-close',
  '.press__accordion-header',
  '.programmes__award',
  '.programmes__scholar-card',
  '.detail__back',
  '.press__back',
  '.residencies__back',
  '.past-workshop-detail__back',
  '.catalogue__preview-cta',
  '.catalogue-list__row',
  '[data-interactive="true"]',
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
        'button, a, input, textarea, select, [role="button"], .cta-link, .carousel-nav__arrow, .carousel-dots button, .home-hero__card'
      ) as HTMLElement | null;
      return { isInteractive: Boolean(clickable), isDisallowed: true, target: clickable };
    }
  }

  // Interactive controls: buttons, links, form inputs, tabs, CTAs
  const interactiveEl = el.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
  if (interactiveEl) {
    const directClickable = interactiveEl.closest('button, a, [role="button"], .cta-link') as HTMLElement | null;
    return { isInteractive: true, isDisallowed: false, target: directClickable || interactiveEl };
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

  // 3. For any text with GSAP SplitText or animated lines, anchor to the parent section/article/container
  const splitTextContainer = rawEl.closest('[data-split-text], .split-line, .split-word, .split-char');
  if (splitTextContainer) {
    const sectionParent =
      splitTextContainer.closest('section, main, article, .site-layout, [class*="section"]') || document.body;
    return sectionParent;
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

/** A pointer position as an offset from the anchor's layout box (box is in page coordinates). */
function toAnchoredPoint(box: LayoutBox, clientX: number, clientY: number, color: string): AnchoredPoint {
  return {
    ox: clientX + window.scrollX - box.left,
    oy: clientY + window.scrollY - box.top,
    color,
  };
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

/**
 * The stroke as SVG path pieces: one smooth path when the colour is uniform; otherwise a piece
 * per segment in that segment's colour (the brand colour cycle drifts slowly, so neighbouring
 * pieces differ only slightly). Same quadratic smoothing as before.
 */
function strokePieces(pts: ResolvedPoint[], defaultColor: string): { d: string; color: string }[] {
  if (pts.length === 0) return [];
  const col = (p: ResolvedPoint) => p.color || defaultColor;
  if (pts.length === 1) {
    // A zero-length line with round caps renders as a dot of the brush's width.
    const p = pts[0];
    return [{ d: `M${fmt(p.x)} ${fmt(p.y)}h0.01`, color: col(p) }];
  }
  if (pts.length === 2) {
    return [{ d: `M${fmt(pts[0].x)} ${fmt(pts[0].y)}L${fmt(pts[1].x)} ${fmt(pts[1].y)}`, color: col(pts[1]) }];
  }
  const uniform = pts.every((p) => col(p) === col(pts[0]));
  const pieces: { d: string; color: string }[] = [];
  let d = `M${fmt(pts[0].x)} ${fmt(pts[0].y)}`;
  let prevX = pts[0].x;
  let prevY = pts[0].y;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    const seg = `Q${fmt(pts[i].x)} ${fmt(pts[i].y)} ${fmt(mx)} ${fmt(my)}`;
    if (uniform) d += seg;
    else pieces.push({ d: `M${fmt(prevX)} ${fmt(prevY)}${seg}`, color: col(pts[i]) });
    prevX = mx;
    prevY = my;
  }
  const last = pts[pts.length - 1];
  const tail = `L${fmt(last.x)} ${fmt(last.y)}`;
  if (uniform) return [{ d: d + tail, color: col(pts[0]) }];
  pieces.push({ d: `M${fmt(prevX)} ${fmt(prevY)}${tail}`, color: col(last) });
  return pieces;
}

/** The stroke's points in the ink layer's coordinates, or null when its anchor is not on the page. */
function resolveStroke(
  stroke: Stroke,
  box: LayoutBox | null,
  origin: { left: number; top: number }
): { points: ResolvedPoint[]; width: number } | null {
  if (!box || box.width === 0) return null;
  // One uniform scale for both axes and the line width: the stroke resizes with its anchor.
  const scale = stroke.anchorWidth > 0 ? box.width / stroke.anchorWidth : 1;
  const left = box.left - origin.left;
  const top = box.top - origin.top;
  return {
    points: stroke.points.map((p) => ({ x: left + p.ox * scale, y: top + p.oy * scale, color: p.color || stroke.color })),
    width: stroke.width * scale,
  };
}

/** Fills a stroke's group with its path pieces. The group carries the opacity, so where pieces
 *  overlap at their round joins they don't darken. */
function paintStroke(g: SVGGElement, stroke: Stroke, resolved: { points: ResolvedPoint[]; width: number }) {
  g.setAttribute('opacity', String(stroke.opacity ?? DEFAULT_OPACITY));
  const pieces = strokePieces(resolved.points, stroke.color);
  const paths = pieces.map(({ d, color }) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', fmt(resolved.width));
    return path;
  });
  g.replaceChildren(...paths);
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
  const inkRef = useRef<SVGSVGElement>(null);
  const inkGroupsRef = useRef(new Map<Stroke, { g: SVGGElement; key: string }>());
  const reducedMotionRef = useRef(false);
  const brushWidthRef = useRef(DEFAULT_WIDTH);
  const redrawRef = useRef<() => void>(() => {});
  const prevPathRef = useRef(pathname);
  const pendingTargetClickRef = useRef<{ target: HTMLElement; x: number; y: number } | null>(null);
  const brushRef = useRef<HTMLDivElement>(null);
  const cursorOnRef = useRef(false);

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

  // The ink is an SVG layer inside the page (not a canvas pinned to the screen), so it scrolls
  // with the content natively. On tablets and phones the page scrolls on the GPU, ahead of any
  // JavaScript: a screen-pinned canvas repainted after each scroll always trailed the content
  // and the strokes visibly slid. Strokes are only rebuilt when a stroke or its anchor's layout
  // really changes, never because of scrolling.
  const redraw = useCallback((force?: unknown) => {
    const svg = inkRef.current;
    const groups = inkGroupsRef.current;
    if (!svg) return;
    const all = currentStrokeRef.current ? [...strokesRef.current, currentStrokeRef.current] : strokesRef.current;
    if (!all.length && !groups.size) return;

    const o = svg.getBoundingClientRect();
    const origin = { left: o.left + window.scrollX, top: o.top + window.scrollY };
    const boxes = new Map<Element, LayoutBox | null>();
    const seen = new Set<Stroke>();
    for (const stroke of all) {
      seen.add(stroke);
      let box = boxes.get(stroke.anchor);
      if (box === undefined) {
        box = layoutBox(stroke.anchor);
        boxes.set(stroke.anchor, box);
      }
      const key = box
        ? `${fmt(box.left - origin.left)}|${fmt(box.top - origin.top)}|${fmt(box.width)}|${stroke.points.length}|${stroke.width}`
        : 'hidden';
      let entry = groups.get(stroke);
      if (!entry || entry.g.parentNode !== svg) {
        const g = document.createElementNS(SVG_NS, 'g');
        svg.appendChild(g);
        entry = { g, key: '' };
        groups.set(stroke, entry);
      }
      if (entry.key === key && force !== true) continue;
      entry.key = key;
      const resolved = resolveStroke(stroke, box, origin);
      if (resolved) paintStroke(entry.g, stroke, resolved);
      else entry.g.replaceChildren();
    }
    for (const [stroke, entry] of groups) {
      if (!seen.has(stroke)) {
        entry.g.remove();
        groups.delete(stroke);
      }
    }
  }, []);
  redrawRef.current = redraw;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  // While true, the first hint of the visit is the cursor: it follows the mouse instead of
  // disappearing at the first move.
  const introNudgeRef = useRef(false);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissNudgeRef = useRef<() => void>(() => {});

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (reducedMotionRef.current || modeRef.current !== 'navigate') return;

    idleTimerRef.current = setTimeout(() => {
      if (modeRef.current === 'navigate') {
        const { isInteractive, isDisallowed } = getInteractiveOrHero(
          canvasRef.current,
          cursorRef.current.x,
          cursorRef.current.y
        );
        if (isInteractive || isDisallowed) {
          return;
        }

        const nowColor = getCycleColor(Date.now(), cycleStateRef.current);
        cursorOnRef.current = true;
        setCursor({
          x: cursorRef.current.x,
          y: cursorRef.current.y,
          on: true,
          color: nowColor,
        });
        if (brushRef.current) {
          brushRef.current.style.left = `${cursorRef.current.x}px`;
          brushRef.current.style.top = `${cursorRef.current.y}px`;
        }
        setModeBoth('nudge');
        if (!introNudgeShown) {
          introNudgeShown = true;
          introNudgeRef.current = true;
          if (introTimerRef.current) clearTimeout(introTimerRef.current);
          introTimerRef.current = setTimeout(() => {
            introNudgeRef.current = false;
            document.documentElement.classList.remove('scribble-cursor-allow-hero');
            if (modeRef.current === 'nudge') dismissNudgeRef.current();
          }, INTRO_NUDGE_MS);
        }
      }
    }, introNudgeShown ? IDLE_MS : FIRST_IDLE_MS);
  }, [clearIdleTimer, setModeBoth]);

  const dismissNudge = useCallback(() => {
    introNudgeRef.current = false;
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    document.documentElement.classList.remove('scribble-cursor-allow-hero');
    if (modeRef.current === 'nudge') {
      const pt = { x: cursorRef.current.x, y: cursorRef.current.y };
      setNudgeDismissing(pt);
      setTimeout(() => {
        setNudgeDismissing((curr) => (curr === pt ? null : curr));
      }, 260);
      setModeBoth('navigate');
      startIdleTimer();
    }
  }, [setModeBoth, startIdleTimer]);
  dismissNudgeRef.current = dismissNudge;

  // Hard exit: clears all strokes only on route change or explicit reset
  const hardExit = useCallback(() => {
    currentStrokeRef.current = null;
    pendingTargetClickRef.current = null;
    strokesRef.current = [];
    document.documentElement.classList.remove('scribble-cursor-allow-hero');
    // A pen user who taps a link keeps the pen on the next page: only the sketch is cleared.
    // (Dropping back to navigate here made the next Pencil stroke scroll the page instead.)
    if (penActiveRef.current) {
      if (canvasRef.current) canvasRef.current.style.pointerEvents = 'auto';
      setModeBoth('sketch');
      redrawRef.current();
      return;
    }
    if (canvasRef.current) {
      canvasRef.current.style.pointerEvents = 'none';
    }
    setModeBoth('navigate');
    cursorOnRef.current = false;
    setCursor((c) => ({ ...c, on: false }));
    redrawRef.current();
    startIdleTimer();
  }, [setModeBoth, startIdleTimer]);

  const enterSketch = useCallback(() => {
    clearIdleTimer();
    const active = document.activeElement;
    if (active instanceof HTMLElement && !isFormElement(active)) active.blur();
    setModeBoth('sketch');
    if (canvasRef.current) {
      canvasRef.current.style.pointerEvents = 'auto';
    }
    // If cursor coordinates are unset (e.g. key pressed before any pointermove), default to viewport center
    if (cursorRef.current.x === 0 && cursorRef.current.y === 0 && typeof window !== 'undefined') {
      cursorRef.current = { x: Math.floor(window.innerWidth / 2), y: Math.floor(window.innerHeight / 2) };
    }
    const nowColor = getCycleColor(Date.now(), cycleStateRef.current);
    const { isInteractive, isDisallowed } = getInteractiveOrHero(
      canvasRef.current,
      cursorRef.current.x,
      cursorRef.current.y
    );
    const shouldPassThrough = isInteractive || isDisallowed;
    if (canvasRef.current) {
      canvasRef.current.style.pointerEvents = shouldPassThrough ? 'none' : 'auto';
    }
    // The pen always shows at once, even over a link or the hero; links stay clickable, and
    // the usual cursor rules take over from the next mouse move.
    cursorOnRef.current = true;
    setCursor({
      x: cursorRef.current.x,
      y: cursorRef.current.y,
      on: true,
      color: nowColor,
    });
    if (brushRef.current) {
      brushRef.current.style.left = `${cursorRef.current.x}px`;
      brushRef.current.style.top = `${cursorRef.current.y}px`;
    }
  }, [clearIdleTimer, setModeBoth]);

  /** Keeps the stroke being drawn (if any) as a finished stroke. */
  const commitStroke = useCallback(() => {
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (stroke) strokesRef.current = [...strokesRef.current, stroke];
  }, []);

  // Soft exit: keeps all strokes on the page (P toggle, Esc, wheel scroll). A stroke still being
  // drawn is kept too: leaving mid-stroke used to throw it away.
  const softExit = useCallback(() => {
    commitStroke();
    pendingTargetClickRef.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.pointerEvents = 'none';
    }
    document.documentElement.classList.remove('scribble-cursor-allow-hero');
    setModeBoth('navigate');
    cursorOnRef.current = false;
    setCursor((c) => ({ ...c, on: false }));
    redrawRef.current();
    startIdleTimer();
  }, [commitStroke, setModeBoth, startIdleTimer]);

  // Ensure canvas pointer events are properly synchronized with mode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (mode === 'navigate') {
      canvas.style.pointerEvents = 'none';
      document.documentElement.classList.remove('scribble-cursor-allow-hero');
    } else if (mode === 'sketch') {
      canvas.style.pointerEvents = 'auto';
    }
  }, [mode]);

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

    redraw(true);
    startIdleTimer();

    // Scrolling needs no work at all (the ink scrolls with the page). Each frame only checks
    // whether an anchor's layout moved - an accordion opening, images loading, a resize, a
    // modal's own scroll - and rebuilds just those strokes. With no strokes it returns at once.
    let frame = 0;
    const watch = () => {
      if (!document.hidden) redraw();
      frame = requestAnimationFrame(watch);
    };
    frame = requestAnimationFrame(watch);
    const onResize = () => redraw(true);
    window.addEventListener('resize', onResize);

    const tick = () => {
      const m = modeRef.current;
      if (m === 'navigate') startIdleTimer();
    };

    // Halts any active Lenis momentum scrolling immediately when stylus touches down
    const stopScrollMomentum = () => {
      const lenis = getLenisInstance();
      if (lenis) {
        lenis.stop();
        lenis.start();
      }
    };

    // On iPad Pro / tablets with Apple Pencil, detect stylus touch down:
    // 1. Immediately stops any residual scroll velocity so page freezes where it is.
    // 2. Ensures canvas is ready to accept pointerdown with pointer-events: auto.
    // 3. Prevents default touch behavior so iOS Safari never initiates a page scroll/slide.
    // 4. For finger touches without stylus, allows page scrolling and button taps.
    const handleTouchStart = (e: TouchEvent) => {
      const stylusTouch = Array.from(e.touches).find((t: any) => t.touchType === 'stylus');
      const canvas = canvasRef.current;

      if (stylusTouch) {
        penActiveRef.current = true;
        stopScrollMomentum();

        if (modeRef.current === 'navigate') {
          clearIdleTimer();
          setModeBoth('sketch');
        }

        const { isInteractive, isDisallowed } = getInteractiveOrHero(canvas, stylusTouch.clientX, stylusTouch.clientY);
        if (isInteractive || isDisallowed) {
          if (canvas) canvas.style.pointerEvents = 'none';
        } else {
          if (canvas) canvas.style.pointerEvents = 'auto';
          e.preventDefault();
        }
      } else {
        // Finger touch (no stylus on screen):
        // Allow finger to scroll the page naturally and tap buttons freely
        if (modeRef.current !== 'drawing' && canvas) {
          canvas.style.pointerEvents = 'none';
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const isStylus = Array.from(e.touches).some((t: any) => t.touchType === 'stylus');
      if (isStylus || modeRef.current === 'drawing') {
        // Prevent default touch move so iOS Safari never slides/scrolls the page during pen sketch
        e.preventDefault();
      }
    };

    // After a tap goes through to the page (a button, a link, a finger touch), the pen surface
    // was left switched off. iPads mostly can't sense a Pencil hovering, so nothing switched it
    // back on: the next Pencil stroke landed on the page, which iPadOS treats as a scroll, and
    // the pen seemed to stop working. It is switched back on once the tap's click has gone
    // through (a moment later, so that click still reaches the button or link).
    let rearmTimer = 0;
    const rearmForPen = () => {
      if (!penActiveRef.current) return;
      window.clearTimeout(rearmTimer);
      rearmTimer = window.setTimeout(() => {
        const m = modeRef.current;
        if (!penActiveRef.current || (m !== 'sketch' && m !== 'drawing')) return;
        const canvas = canvasRef.current;
        if (canvas) canvas.style.pointerEvents = 'auto';
      }, 80);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (e.touches.length === 0 && modeRef.current === 'navigate' && canvas) {
        canvas.style.pointerEvents = 'none';
      }
      if (e.touches.length === 0) rearmForPen();
    };

    const handlePointerMove = (e: PointerEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };

      if (brushRef.current) {
        brushRef.current.style.left = `${e.clientX}px`;
        brushRef.current.style.top = `${e.clientY}px`;
      }

      if (e.pointerType === 'pen') {
        penActiveRef.current = true;
        if (modeRef.current === 'navigate') {
          clearIdleTimer();
          setModeBoth('sketch');
        }
      }

      const nowColor = getCycleColor(Date.now(), cycleStateRef.current);
      const { isInteractive, isDisallowed } = getInteractiveOrHero(canvasRef.current, e.clientX, e.clientY);
      const shouldPassThrough = isInteractive || isDisallowed;
      const isVisible = !shouldPassThrough;

      // Only update React state when visibility changes (entering/leaving an interactive element)
      if (cursorOnRef.current !== isVisible) {
        cursorOnRef.current = isVisible;
        setCursor((prev) => ({
          ...prev,
          x: e.clientX,
          y: e.clientY,
          on: isVisible,
          color: nowColor,
        }));
      }

      const m = modeRef.current;
      const canvas = canvasRef.current;

      if (m === 'navigate') {
        if (canvas && canvas.style.pointerEvents !== 'none') {
          canvas.style.pointerEvents = 'none';
        }
      } else if (m === 'sketch') {
        if (shouldPassThrough) {
          if (canvas) canvas.style.pointerEvents = 'none';
          document.documentElement.classList.add('scribble-cursor-allow-hero');
        } else {
          if (canvas) canvas.style.pointerEvents = 'auto';
          document.documentElement.classList.remove('scribble-cursor-allow-hero');
        }
      }

      if (m === 'nudge' && introNudgeRef.current) {
        // First hint of the visit: it is the cursor and follows the mouse; over links and the
        // hero the normal cursor shows instead, and the hint returns off them.
        document.documentElement.classList.toggle('scribble-cursor-allow-hero', shouldPassThrough);
        return;
      }

      if ((m === 'nudge' || m === 'sketch' || m === 'drawing') && isDisallowed) {
        if (m === 'nudge') {
          dismissNudge();
        } else if (m === 'drawing' && currentStrokeRef.current) {
          commitStroke();
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
        const stroke = currentStrokeRef.current;
        const box = layoutBox(stroke.anchor);
        if (box) {
          stroke.points.push(toAnchoredPoint(box, e.clientX, e.clientY, nowColor));
          redraw();
        }
        return;
      }
      tick();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const isPen = e.pointerType === 'pen';
      if (isPen) {
        penActiveRef.current = true;
        stopScrollMomentum();
        if (modeRef.current === 'navigate') {
          clearIdleTimer();
          setModeBoth('sketch');
        }
      }

      // On tablets where pen is active, ignore finger touches for drawing
      // so the user can use their finger to scroll, pan, and tap naturally
      // (A finger tap needs no help: the touch handler lets it through to the page before the
      // browser's click is aimed, so the button or link underneath gets that click.)
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
          // Direct tap intercepted by canvas -> record pending target to trigger cleanly on pointerup
          pendingTargetClickRef.current = { target, x: e.clientX, y: e.clientY };
        } else {
          pendingTargetClickRef.current = null;
        }
        return;
      }

      pendingTargetClickRef.current = null;
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
      // An element that isn't laid out (rare: display: contents) falls back to the page itself.
      const ownBox = layoutBox(anchor);
      const strokeAnchor = ownBox ? anchor : document.body;
      const box = ownBox ?? layoutBox(document.body);
      if (!box) return;
      currentStrokeRef.current = {
        anchor: strokeAnchor,
        anchorWidth: box.width,
        points: [toAnchoredPoint(box, e.clientX, e.clientY, nowColor)],
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
      // 1. If a tap on canvas over an interactive element was caught during pointerdown:
      if (pendingTargetClickRef.current) {
        const { target, x, y } = pendingTargetClickRef.current;
        pendingTargetClickRef.current = null;
        const dist = Math.hypot(e.clientX - x, e.clientY - y);
        if (dist < 8) {
          try {
            target.focus();
            target.click();
          } catch {}
          // The browser may aim its own click at the same element a moment later (pens and
          // touch do): swallow that one, or a toggle such as an accordion opens and shuts again.
          const swallow = (ev: MouseEvent) => {
            if (ev.isTrusted && ev.target instanceof Node && target.contains(ev.target)) {
              ev.preventDefault();
              ev.stopImmediatePropagation();
            }
          };
          window.addEventListener('click', swallow, { capture: true, once: true });
          window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 500);
        }
      }

      // A Pencil has no hover on most iPads, so the pen surface can't be switched back on as the
      // pen approaches: switch it back on as soon as this tap is done.
      if (e.pointerType !== 'mouse') rearmForPen();

      if (modeRef.current !== 'drawing') return;

      commitStroke();
      setModeBoth('sketch');
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          if (e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        } catch {}

        // Immediately reconcile pointerEvents and cursor after stroke completion
        const { isInteractive, isDisallowed } = getInteractiveOrHero(canvas, e.clientX, e.clientY);
        if (e.pointerType !== 'mouse' && penActiveRef.current) {
          // Pen: the surface stays on for the next stroke (re-armed above).
        } else if (isInteractive || isDisallowed) {
          canvas.style.pointerEvents = 'none';
          document.documentElement.classList.add('scribble-cursor-allow-hero');
          cursorOnRef.current = false;
          setCursor((c) => ({ ...c, on: false }));
        } else {
          canvas.style.pointerEvents = 'auto';
          document.documentElement.classList.remove('scribble-cursor-allow-hero');
        }
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
        if (!introNudgeRef.current) dismissNudge();
      } else if (m === 'sketch' || m === 'drawing') {
        softExit();
      } else {
        tick();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFormElement(e.target)) return;
      const key = e.key;

      if ((key === 'p' || key === 'P') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        introNudgeRef.current = false;
        if (introTimerRef.current) clearTimeout(introTimerRef.current);
        if (modeRef.current === 'sketch' || modeRef.current === 'drawing') {
          softExit();
        } else {
          enterSketch();
        }
        return;
      }

      if (key === 'Escape') {
        if (modeRef.current !== 'navigate') {
          e.preventDefault();
          softExit();
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

    // A stroke whose pointer is taken away - palm rejection, a system gesture, switching window
    // mid-stroke - is kept as drawn instead of being left half-open.
    const handleInterrupted = () => {
      if (modeRef.current !== 'drawing') return;
      commitStroke();
      setModeBoth('sketch');
      redraw();
    };
    const handleVisibility = () => {
      if (document.hidden) handleInterrupted();
    };

    window.addEventListener('lostpointercapture', handleInterrupted);
    window.addEventListener('blur', handleInterrupted);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('dblclick', handleDblClick);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.classList.remove('scribble-cursor-allow-hero');
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('lostpointercapture', handleInterrupted);
      window.removeEventListener('blur', handleInterrupted);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
      clearIdleTimer();
      window.clearTimeout(rearmTimer);
    };
  }, [
    supported,
    redraw,
    commitStroke,
    startIdleTimer,
    clearIdleTimer,
    setModeBoth,
    dismissNudge,
    softExit,
    enterSketch,
    jumpToColor,
  ]);

  if (!supported || pathname === "/artworks") return null;

  const isSketchActive = mode === 'sketch' || mode === 'drawing';
  const showBrush = (mode === 'nudge' || isSketchActive) && cursor.on;

  return (
    <div
      className={`scribble-layer ${mode === 'nudge' ? 'is-nudge' : ''} ${isSketchActive ? 'is-sketch' : ''} ${mode === 'drawing' ? 'is-drawing' : ''}`}
      aria-hidden="true"
    >
      {/* Catches the pen and mouse while sketching; the strokes themselves live in the ink layer. */}
      <canvas ref={canvasRef} className="scribble-layer__canvas" width={1} height={1} />
      {createPortal(<svg ref={inkRef} className="scribble-layer__ink" aria-hidden="true" />, document.body)}

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
          ref={brushRef}
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
