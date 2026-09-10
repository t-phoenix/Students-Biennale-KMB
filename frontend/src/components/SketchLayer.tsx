import { useEffect, useRef, useState } from 'react';

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

// Mobile detection - only desktop/laptop/iPad (1024px+)
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
  const currentStrokeRef = useRef<Array<{ x: number; y: number; t: number }> | null>(null);
  const autoExitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check device support on mount
  useEffect(() => {
    if (!isSketchSupported()) return;

    // Initialize canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Helper functions
    const updateMode = (newMode: SketchMode) => {
      modeRef.current = newMode;
      setMode(newMode);
      if (newMode === 'sketch' || newMode === 'drawing') {
        setShowHUD(true);
        document.documentElement.classList.add('scribble-hide-cursor');
      } else {
        setShowHUD(false);
        document.documentElement.classList.remove('scribble-hide-cursor');
      }

      // Auto-exit after 10 seconds of inactivity
      if (autoExitTimerRef.current) clearTimeout(autoExitTimerRef.current);
      if (newMode === 'sketch') {
        autoExitTimerRef.current = setTimeout(() => {
          setMode('navigate');
          modeRef.current = 'navigate';
          setShowHUD(false);
          document.documentElement.classList.remove('scribble-hide-cursor');
        }, 10000);
      }
    };

    const redrawCanvas = () => {
      if (!ctxRef.current) return;
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    };

    const drawStroke = (stroke: Array<{ x: number; y: number }>, color: SketchColor, width: number) => {
      if (!ctxRef.current || stroke.length < 2) return;
      const ctx = ctxRef.current;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    };

    // Event handlers
    const handlePointerMove = (e: PointerEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });

      if (modeRef.current === 'drawing' && currentStrokeRef.current) {
        currentStrokeRef.current.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        redrawCanvas();
        if (currentStrokeRef.current.length > 1) {
          drawStroke(
            currentStrokeRef.current.map(p => ({ x: p.x, y: p.y })),
            brushColor,
            brushWidth
          );
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      if (modeRef.current === 'sketch') {
        if (
          e.target === document.querySelector('.site-header') ||
          e.target === document.querySelector('.site-layout__main > *:first-child')
        ) {
          return;
        }

        // Check for double-click
        if (e.detail >= 2) {
          updateMode('navigate');
          return;
        }

        updateMode('drawing');
        currentStrokeRef.current = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {}
        e.preventDefault();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (modeRef.current === 'drawing' && currentStrokeRef.current) {
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
        setBrushWidth(w => Math.max(1, w - 1));
      } else if (key === ']') {
        e.preventDefault();
        setBrushWidth(w => Math.min(20, w + 1));
      } else if (key in COLORS) {
        e.preventDefault();
        setBrushColor(COLORS[key as keyof typeof COLORS]);
      }
    };

    const handleWheel = () => {
      if (modeRef.current === 'sketch' || modeRef.current === 'drawing') {
        updateMode('navigate');
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      if (modeRef.current === 'sketch' || modeRef.current === 'drawing') {
        updateMode('navigate');
        e.preventDefault();
      }
    };

    // Add event listeners
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('dblclick', handleDblClick);

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('resize', handleResize);
      if (autoExitTimerRef.current) clearTimeout(autoExitTimerRef.current);
    };
  }, [brushColor, brushWidth]);

  if (!isSketchSupported()) return null;

  const brushSizeForDisplay = brushWidth * 2 + 8;

  return (
    <>
      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: mode === 'sketch' || mode === 'drawing' ? 'auto' : 'none',
          zIndex: mode === 'sketch' || mode === 'drawing' ? 9998 : -1,
        }}
      />

      {/* Brush cursor ring */}
      {(mode === 'sketch' || mode === 'drawing') && (
        <div
          style={{
            position: 'fixed',
            left: cursorPos.x,
            top: cursorPos.y,
            width: brushSizeForDisplay,
            height: brushSizeForDisplay,
            border: `1.5px solid ${brushColor}`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}

      {/* HUD - Heads Up Display */}
      {showHUD && (
        <aside
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '13px',
            lineHeight: '1.5',
            zIndex: 9997,
            minWidth: '200px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '12px', fontSize: '14px' }}>Sketch</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Toggle / exit</span>
            <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>P</kbd>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Brush size</span>
            <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>[ ]</kbd>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Colors</span>
            <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px', fontSize: '11px' }}>
              1 W · 2 R · 3 B
            </kbd>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>Exit</span>
            <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>Esc</kbd>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              paddingTop: '12px',
              borderTop: '1px solid #e5e5e5',
            }}
          >
            <div
              style={{
                width: brushSizeForDisplay,
                height: brushSizeForDisplay,
                background: brushColor,
                borderRadius: '50%',
              }}
            />
            <span style={{ fontSize: '12px', color: '#545454' }}>
              {COLOR_NAMES[brushColor]} · {brushWidth}px
            </span>
          </div>
        </aside>
      )}

      {/* Hide cursor CSS */}
      <style>{`
        html.scribble-hide-cursor,
        html.scribble-hide-cursor * {
          cursor: none !important;
        }
      `}</style>
    </>
  );
}
