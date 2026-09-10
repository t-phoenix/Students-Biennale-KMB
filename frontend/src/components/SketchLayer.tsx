import { useEffect, useRef, useState } from 'react';
import './SketchLayer.css';

type SketchMode = 'navigate' | 'sketch' | 'drawing';
type SketchColor = '#ffffff' | '#ef3942' | '#323031';

const COLORS = {
  '1': '#ffffff' as SketchColor,
  '2': '#ef3942' as SketchColor,
  '3': '#323031' as SketchColor,
};

const COLOR_NAMES: Record<SketchColor, string> = {
  '#ffffff': 'white',
  '#ef3942': 'red',
  '#323031': 'black',
};

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: SketchColor;
  width: number;
}

// Device support check - desktop, laptop, and iPad screens (1024px+)
function isSketchSupported() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

export function SketchLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [mode, setMode] = useState<SketchMode>('navigate');
  const [brushColor, setBrushColor] = useState<SketchColor>('#ef3942');
  const [brushWidth, setBrushWidth] = useState(3);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showHUD, setShowHUD] = useState(false);

  const modeRef = useRef<SketchMode>('navigate');
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Point[] | null>(null);
  const autoExitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const brushColorRef = useRef<SketchColor>('#ef3942');
  const brushWidthRef = useRef(3);

  brushColorRef.current = brushColor;
  brushWidthRef.current = brushWidth;

  useEffect(() => {
    if (!isSketchSupported()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawStroke = (stroke: Point[], color: SketchColor, width: number) => {
      if (!ctxRef.current || stroke.length === 0) return;
      const c = ctxRef.current;
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = width;

      if (stroke.length === 1) {
        c.beginPath();
        c.arc(stroke[0].x, stroke[0].y, Math.max(1, width / 2), 0, Math.PI * 2);
        c.fill();
        return;
      }

      c.beginPath();
      c.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        c.lineTo(stroke[i].x, stroke[i].y);
      }
      c.stroke();
    };

    const redrawAll = () => {
      if (!ctxRef.current || !canvas) return;
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);

      for (const stroke of strokesRef.current) {
        drawStroke(stroke.points, stroke.color, stroke.width);
      }

      if (currentStrokeRef.current && currentStrokeRef.current.length > 0) {
        drawStroke(currentStrokeRef.current, brushColorRef.current, brushWidthRef.current);
      }
    };

    const resetInactivityTimer = () => {
      if (autoExitTimerRef.current) clearTimeout(autoExitTimerRef.current);
      if (modeRef.current === 'sketch') {
        autoExitTimerRef.current = setTimeout(() => {
          updateMode('navigate');
        }, 10000);
      }
    };

    const updateMode = (newMode: SketchMode) => {
      modeRef.current = newMode;
      setMode(newMode);

      if (newMode === 'sketch' || newMode === 'drawing') {
        setShowHUD(true);
        document.documentElement.classList.add('scribble-hide-cursor');
        redrawAll();
      } else {
        setShowHUD(false);
        document.documentElement.classList.remove('scribble-hide-cursor');
        if (ctxRef.current && canvas) {
          ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
        }
        strokesRef.current = [];
      }

      resetInactivityTimer();
    };

    const handlePointerMove = (e: PointerEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });

      if (modeRef.current === 'drawing' && currentStrokeRef.current) {
        currentStrokeRef.current.push({ x: e.clientX, y: e.clientY });
        redrawAll();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || modeRef.current !== 'sketch') return;

      // Double-click exits
      if (e.detail >= 2) {
        updateMode('navigate');
        return;
      }

      updateMode('drawing');
      currentStrokeRef.current = [{ x: e.clientX, y: e.clientY }];
      redrawAll();

      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {}
      e.preventDefault();
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (modeRef.current === 'drawing' && currentStrokeRef.current && currentStrokeRef.current.length > 0) {
        strokesRef.current.push({
          points: [...currentStrokeRef.current],
          color: brushColorRef.current,
          width: brushWidthRef.current,
        });
        currentStrokeRef.current = null;
        updateMode('sketch');
      }

      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {}
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'p') {
        e.preventDefault();
        if (modeRef.current === 'sketch' || modeRef.current === 'drawing') {
          updateMode('navigate');
        } else {
          updateMode('sketch');
        }
        return;
      }

      if (modeRef.current !== 'sketch' && modeRef.current !== 'drawing') return;

      if (key === 'escape') {
        e.preventDefault();
        updateMode('navigate');
      } else if (key === '[') {
        e.preventDefault();
        const w = Math.max(1, brushWidthRef.current - 1);
        brushWidthRef.current = w;
        setBrushWidth(w);
        resetInactivityTimer();
      } else if (key === ']') {
        e.preventDefault();
        const w = Math.min(20, brushWidthRef.current + 1);
        brushWidthRef.current = w;
        setBrushWidth(w);
        resetInactivityTimer();
      } else if (key in COLORS) {
        e.preventDefault();
        const c = COLORS[key as keyof typeof COLORS];
        brushColorRef.current = c;
        setBrushColor(c);
        resetInactivityTimer();
      }
    };

    const handleWheel = () => {
      if (modeRef.current === 'sketch' || modeRef.current === 'drawing') {
        updateMode('navigate');
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (ctxRef.current) {
        ctxRef.current.lineCap = 'round';
        ctxRef.current.lineJoin = 'round';
        redrawAll();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (autoExitTimerRef.current) clearTimeout(autoExitTimerRef.current);
    };
  }, []);

  if (!isSketchSupported()) return null;

  const brushSizeForDisplay = brushWidth * 2 + 8;

  return (
    <div className={`scribble-layer ${mode === 'sketch' || mode === 'drawing' ? 'is-sketch' : ''}`}>
      <canvas
        ref={canvasRef}
        className="scribble-layer__canvas"
        style={{
          display: mode === 'sketch' || mode === 'drawing' ? 'block' : 'none',
        }}
      />

      {(mode === 'sketch' || mode === 'drawing') && (
        <div
          className="scribble-brush"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            color: brushColor,
          }}
        >
          <svg
            className="scribble-brush__icon"
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M22.5 2.5c.8-.8 2.1-.8 2.9 0l4.1 4.1c.8.8.8 2.1 0 2.9L12.2 26.8a2 2 0 0 1-.9.5l-5.6 1.4a1 1 0 0 1-1.2-1.2l1.4-5.6c.1-.3.3-.6.5-.9L22.5 2.5Z"
              fill={brushColor}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </svg>
          <span
            className="scribble-brush__ring"
            style={{
              width: brushSizeForDisplay,
              height: brushSizeForDisplay,
              borderColor: brushColor,
            }}
          />
        </div>
      )}

      {showHUD && (
        <aside className="scribble-layer__hud">
          <p className="scribble-layer__hud-title">Sketch</p>

          <div className="scribble-layer__hud-row">
            <span>Toggle / exit</span>
            <kbd>P</kbd>
          </div>

          <div className="scribble-layer__hud-row">
            <span>Brush size</span>
            <kbd>[ ]</kbd>
          </div>

          <div className="scribble-layer__hud-row">
            <span>Colors</span>
            <kbd>1 W · 2 R · 3 B</kbd>
          </div>

          <div className="scribble-layer__hud-row">
            <span>Exit</span>
            <kbd>Esc</kbd>
          </div>

          <div className="scribble-layer__swatch">
            <span
              className="scribble-layer__swatch-dot"
              style={{
                background: brushColor,
                width: Math.min(24, Math.max(10, brushSizeForDisplay)),
                height: Math.min(24, Math.max(10, brushSizeForDisplay)),
              }}
            />
            <span className="scribble-layer__swatch-label">
              {COLOR_NAMES[brushColor]} · {brushWidth}px
            </span>
          </div>
        </aside>
      )}
    </div>
  );
}
