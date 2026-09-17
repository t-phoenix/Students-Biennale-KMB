import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCatalogue } from "../lib/catalogue";
import { useHomeCms } from "../lib/homeCms";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import { prefetchHomeDestinations } from "../lib/predictivePrefetch";
import { preloadUrls } from "../lib/preloadImages";
import {
  SPLASH_STAR_COLORS,
  SPLASH_TILES,
  buildSplashTileSet,
  fibonacciSphere,
  useSplash,
  warmHomeAssetsForSplash,
} from "../lib/splash";
import "./SplashScreen.css";

/** Globe formation needs ~2.6s; exit waits for site warm beyond that. */
const MIN_MS = 2800;
const SAFETY_MAX_MS = 45_000;
const SKIP_VISIBLE_MS = 500;
const BURST_MS = 0.95;
const SKIP_BURST_MS = 0.4;
const STAR_COUNT = 36;

/**
 * Artwork globe → star burst → site erupt.
 * Compressed tiles (~72KB) keep motion smooth while home warms underneath.
 */
export function SplashScreen() {
  const { active, markComplete } = useSplash();
  const { status, covers, cards } = useHomeCms();
  const { current, status: catalogueStatus } = useCatalogue();
  const rootRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const exitingRef = useRef(false);
  const introTlRef = useRef<gsap.core.Timeline | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const spherePointsRef = useRef<{ x: number; y: number; z: number }[]>([]);

  const [minElapsed, setMinElapsed] = useState(false);
  const [siteReady, setSiteReady] = useState(false);
  const [safetyTimedOut, setSafetyTimedOut] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);

  const tileSrcs = useMemo(() => buildSplashTileSet(3), []);
  const cmsReady = status === "ready";

  const runExit = useCallback(
    (fast: boolean) => {
      if (exitingRef.current) return;
      exitingRef.current = true;
      introTlRef.current?.kill();
      spinTweenRef.current?.kill();

      const firstSlide = document.querySelector<HTMLElement>(".home-hero__slide:first-child");
      if (firstSlide) {
        gsap.set(firstSlide, { opacity: 1, visibility: "visible" });
      }

      const root = rootRef.current;
      if (!root) {
        markComplete();
        return;
      }

      const duration = fast ? SKIP_BURST_MS : BURST_MS;
      const tiles = root.querySelectorAll<HTMLElement>(".splash__tile");
      const stars = root.querySelectorAll<HTMLElement>(".splash__star");
      const brand = root.querySelector<HTMLElement>(".splash__brand");
      const skip = root.querySelector<HTMLElement>(".splash__skip");
      const points = spherePointsRef.current;

      if (prefersReducedMotion()) {
        gsap.to(root, {
          autoAlpha: 0,
          duration: 0.22,
          ease: "power2.out",
          onComplete: markComplete,
        });
        return;
      }

      // Erupt tiles outward along sphere normals — keep rectangular crop.
      const tl = gsap.timeline({
        defaults: { ease: "power3.in" },
        onComplete: markComplete,
      });

      tl.to(skip, { autoAlpha: 0, duration: duration * 0.25 }, 0)
        .to(
          brand,
          { autoAlpha: 0, scale: 1.15, duration: duration * 0.45, ease: "power2.in" },
          0,
        )
        .to(
          tiles,
          {
            x: (_i, el) => {
              const i = Number((el as HTMLElement).dataset.index ?? 0);
              const p = points[i] ?? { x: 0, y: 0, z: 0 };
              return p.x * 4.2;
            },
            y: (_i, el) => {
              const i = Number((el as HTMLElement).dataset.index ?? 0);
              const p = points[i] ?? { x: 0, y: 0, z: 0 };
              return p.y * 4.2;
            },
            z: (_i, el) => {
              const i = Number((el as HTMLElement).dataset.index ?? 0);
              const p = points[i] ?? { x: 0, y: 0, z: 0 };
              return p.z * 4.2;
            },
            scale: 0.35,
            opacity: 0,
            duration,
            stagger: { each: 0.012, from: "center" },
          },
          0.05,
        )
        .fromTo(
          stars,
          { opacity: 0, scale: 0.4 },
          {
            opacity: 1,
            scale: 1,
            x: () => gsap.utils.random(-window.innerWidth * 0.55, window.innerWidth * 0.55),
            y: () => gsap.utils.random(-window.innerHeight * 0.55, window.innerHeight * 0.55),
            duration: duration * 0.9,
            stagger: 0.008,
            ease: "power2.out",
          },
          0.08,
        )
        .to(
          stars,
          { opacity: 0, scale: 0.2, duration: duration * 0.45, ease: "power2.in" },
          duration * 0.45,
        )
        .to(root, { autoAlpha: 0, duration: duration * 0.4, ease: "power2.inOut" }, duration * 0.55);
    },
    [markComplete],
  );

  useEffect(() => {
    if (!active) return;
    const reduced = prefersReducedMotion();
    const minMs = reduced ? 120 : MIN_MS;
    const skipMs = reduced ? 0 : SKIP_VISIBLE_MS;
    const minTimer = window.setTimeout(() => setMinElapsed(true), minMs);
    const safetyTimer = window.setTimeout(() => setSafetyTimedOut(true), SAFETY_MAX_MS);
    const skipTimer = window.setTimeout(() => setSkipVisible(true), skipMs);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(safetyTimer);
      window.clearTimeout(skipTimer);
    };
  }, [active]);

  // Preload compressed tiles (tiny) so the globe never pops in empty.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void preloadUrls([...SPLASH_TILES], "low").then(() => {
      if (!cancelled) setTilesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (!cmsReady) return;

    let cancelled = false;
    setSiteReady(false);

    void (async () => {
      try {
        await warmHomeAssetsForSplash(covers, cards);
        if (!cancelled) setSiteReady(true);
      } catch {
        if (!cancelled) setSiteReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, cmsReady, covers, cards]);

  useEffect(() => {
    if (!active) return;
    if (catalogueStatus !== "ready") return;
    prefetchHomeDestinations(current ?? null);
  }, [active, current, catalogueStatus]);

  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("spotlight:change", { detail: { open: true } }));
    return () => {
      html.style.overflow = prevOverflow;
      window.dispatchEvent(new CustomEvent("spotlight:change", { detail: { open: false } }));
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = window.requestAnimationFrame(() => {
      rootRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSkipped(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => {
    if (!active || exitingRef.current) return;
    const ready = minElapsed && cmsReady && siteReady && (tilesReady || prefersReducedMotion());
    if (skipped || safetyTimedOut || ready) {
      runExit(skipped);
    }
  }, [
    active,
    minElapsed,
    cmsReady,
    siteReady,
    tilesReady,
    skipped,
    safetyTimedOut,
    runExit,
  ]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const globe = globeRef.current;
      if (!root || !globe || !active) return;

      const tiles = gsap.utils.toArray<HTMLElement>(".splash__tile");
      const mark = root.querySelector(".splash__mark");
      const title = root.querySelector(".splash__title");
      const radius = Math.min(window.innerWidth, window.innerHeight) * 0.22;
      const points = fibonacciSphere(tiles.length, Math.max(110, radius));
      spherePointsRef.current = points;

      if (prefersReducedMotion()) {
        gsap.set([mark, title], { autoAlpha: 1 });
        gsap.set(tiles, { autoAlpha: 0 });
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      gsap.set([mark, title], { autoAlpha: 0 });
      tiles.forEach((tile, i) => {
        gsap.set(tile, {
          xPercent: -50,
          yPercent: -50,
          x: gsap.utils.random(-vw * 0.55, vw * 0.55),
          y: gsap.utils.random(-vh * 0.55, vh * 0.55),
          z: gsap.utils.random(-180, 180),
          scale: gsap.utils.random(0.25, 0.55),
          opacity: 0,
          rotationY: gsap.utils.random(-40, 40),
          force3D: true,
        });
        tile.dataset.index = String(i);
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      introTlRef.current = tl;

      // Brand arrives as the void opens.
      tl.fromTo(
        mark,
        { autoAlpha: 0, scale: 0.88 },
        { autoAlpha: 1, scale: 1, duration: 0.7 },
        0.15,
      ).fromTo(
        title,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.55 },
        0.45,
      );

      // Artworks gather into a globe.
      tl.to(
        tiles,
        {
          opacity: 1,
          scale: 1,
          x: (i) => points[i]?.x ?? 0,
          y: (i) => points[i]?.y ?? 0,
          z: (i) => points[i]?.z ?? 0,
          rotationY: 0,
          duration: 1.55,
          stagger: { each: 0.028, from: "random" },
          ease: "power2.out",
        },
        0.35,
      );

      // Soft pulse on the mark while the sphere holds.
      gsap.to(mark, {
        scale: 1.04,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.6,
      });

      // Slow orbital spin while the site warms underneath.
      spinTweenRef.current = gsap.to(globe, {
        rotationY: 360,
        duration: 28,
        repeat: -1,
        ease: "none",
        delay: 1.9,
      });

      return () => {
        introTlRef.current = null;
        spinTweenRef.current = null;
      };
    },
    { scope: rootRef, dependencies: [active, tileSrcs.length] },
  );

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      className="splash"
      role="dialog"
      aria-modal="true"
      aria-label="Students' Biennale"
      tabIndex={-1}
    >
      <div className="splash__void" aria-hidden />
      <div className="splash__stage" aria-hidden>
        <div ref={globeRef} className="splash__globe">
          {tileSrcs.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="splash__tile"
              data-index={index}
              style={{
                color: SPLASH_STAR_COLORS[index % SPLASH_STAR_COLORS.length],
              }}
            >
              <img src={src} alt="" decoding="async" loading="eager" draggable={false} />
            </div>
          ))}
        </div>
      </div>
      <div className="splash__stars" aria-hidden>
        {Array.from({ length: STAR_COUNT }, (_, i) => (
          <span
            key={i}
            className="splash__star"
            style={{
              color: SPLASH_STAR_COLORS[i % SPLASH_STAR_COLORS.length],
              background: SPLASH_STAR_COLORS[i % SPLASH_STAR_COLORS.length],
            }}
          />
        ))}
      </div>
      <div className="splash__brand">
        <img
          className="splash__mark"
          src="/logo-sb-mark.svg"
          alt=""
          width={68}
          height={96}
          aria-hidden
        />
        <p className="splash__title">Students&apos; Biennale</p>
      </div>
      <button
        type="button"
        className={`splash__skip${skipVisible ? " is-visible" : ""}`}
        tabIndex={skipVisible ? 0 : -1}
        aria-hidden={!skipVisible}
        onClick={() => setSkipped(true)}
      >
        Skip
      </button>
    </div>,
    document.body,
  );
}
