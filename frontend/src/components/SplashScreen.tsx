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

/** Globe formation needs ~2.8s; exit waits for site warm beyond that. */
const MIN_MS = 2800;
const SAFETY_MAX_MS = 45_000;
const SKIP_VISIBLE_MS = 500;
const BURST_MS = 1.15;
const SKIP_BURST_MS = 0.45;
const STAR_COUNT = 42;

/**
 * Dense artwork globe around the SB mark on a white gallery field,
 * then a soft white flash into the warmed site.
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

  const tileSrcs = useMemo(() => buildSplashTileSet(5), []);
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
      const flash = root.querySelector<HTMLElement>(".splash__flash");
      const points = spherePointsRef.current;

      if (prefersReducedMotion()) {
        gsap
          .timeline({ onComplete: markComplete })
          .to(flash, { autoAlpha: 1, duration: 0.18, ease: "power2.out" }, 0)
          .to(root, { autoAlpha: 0, duration: 0.28, ease: "power2.out" }, 0.12);
        return;
      }

      // Rush through the gallery field → soft white bloom → site.
      const tl = gsap.timeline({
        defaults: { ease: "power3.in" },
        onComplete: markComplete,
      });

      tl.to(skip, { autoAlpha: 0, duration: duration * 0.2 }, 0)
        .to(
          brand,
          { autoAlpha: 0, scale: 1.2, duration: duration * 0.4, ease: "power2.in" },
          0,
        )
        .to(
          tiles,
          {
            x: (_i, el) => {
              const i = Number((el as HTMLElement).dataset.index ?? 0);
              const p = points[i] ?? { x: 0, y: 0, z: 0 };
              return p.x * 5.5;
            },
            y: (_i, el) => {
              const i = Number((el as HTMLElement).dataset.index ?? 0);
              const p = points[i] ?? { x: 0, y: 0, z: 0 };
              return p.y * 5.5;
            },
            z: (_i, el) => {
              const i = Number((el as HTMLElement).dataset.index ?? 0);
              const p = points[i] ?? { x: 0, y: 0, z: 0 };
              return p.z * 5.5 + 220;
            },
            scale: 1.35,
            opacity: 0,
            duration: duration * 0.75,
            stagger: { each: 0.008, from: "center" },
            ease: "power2.in",
          },
          0.04,
        )
        .fromTo(
          stars,
          { opacity: 0, scale: 0.3 },
          {
            opacity: 0.85,
            scale: 1.2,
            x: () => gsap.utils.random(-window.innerWidth * 0.6, window.innerWidth * 0.6),
            y: () => gsap.utils.random(-window.innerHeight * 0.6, window.innerHeight * 0.6),
            duration: duration * 0.7,
            stagger: 0.006,
            ease: "power2.out",
          },
          0.06,
        )
        // Soft white flash — gallery / outer-space handoff
        .fromTo(
          flash,
          { autoAlpha: 0, scale: 0.92 },
          { autoAlpha: 1, scale: 1, duration: duration * 0.42, ease: "power2.out" },
          duration * 0.22,
        )
        .to(stars, { opacity: 0, duration: duration * 0.25 }, duration * 0.45)
        .to(
          root,
          { autoAlpha: 0, duration: duration * 0.48, ease: "power2.inOut" },
          duration * 0.52,
        );
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
      const flash = root.querySelector(".splash__flash");
      const radius = Math.min(window.innerWidth, window.innerHeight) * 0.28;
      const points = fibonacciSphere(tiles.length, Math.max(140, radius));
      spherePointsRef.current = points;

      gsap.set(flash, { autoAlpha: 0 });

      if (prefersReducedMotion()) {
        gsap.set(mark, { autoAlpha: 1 });
        gsap.set(tiles, { autoAlpha: 0 });
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      gsap.set(mark, { autoAlpha: 0 });
      tiles.forEach((tile, i) => {
        gsap.set(tile, {
          xPercent: -50,
          yPercent: -50,
          x: gsap.utils.random(-vw * 0.6, vw * 0.6),
          y: gsap.utils.random(-vh * 0.6, vh * 0.6),
          z: gsap.utils.random(-220, 220),
          scale: gsap.utils.random(0.2, 0.5),
          opacity: 0,
          rotationY: gsap.utils.random(-35, 35),
          force3D: true,
        });
        tile.dataset.index = String(i);
      });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      introTlRef.current = tl;

      tl.fromTo(
        mark,
        { autoAlpha: 0, scale: 0.9 },
        { autoAlpha: 1, scale: 1, duration: 0.75 },
        0.12,
      );

      // More artworks gather tightly around the mark.
      tl.to(
        tiles,
        {
          opacity: 1,
          scale: 1,
          x: (i) => points[i]?.x ?? 0,
          y: (i) => points[i]?.y ?? 0,
          z: (i) => points[i]?.z ?? 0,
          rotationY: 0,
          duration: 1.65,
          stagger: { each: 0.018, from: "random" },
          ease: "power2.out",
        },
        0.28,
      );

      gsap.to(mark, {
        scale: 1.035,
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.7,
      });

      spinTweenRef.current = gsap.to(globe, {
        rotationY: 360,
        duration: 32,
        repeat: -1,
        ease: "none",
        delay: 2,
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
              color: "#ffffff",
              background: "#ffffff",
            }}
          />
        ))}
      </div>
      <div className="splash__brand">
        <img
          className="splash__mark"
          src="/logo-sb-mark.svg"
          alt=""
          width={76}
          height={108}
          aria-hidden
        />
      </div>
      <div className="splash__flash" aria-hidden />
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
