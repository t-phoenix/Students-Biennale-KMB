import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasItem } from "../data/site";
import { InfiniteCanvas } from "../components/canvas/InfiniteCanvas";
import { CanvasExpand } from "../components/canvas/CanvasExpand";
import { useAllArtworks } from "../lib/catalogue";
import { markDiscoverMount } from "../lib/discoverPerf";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import { prefetchDiscoverViewport } from "../lib/predictivePrefetch";
import "./DiscoverArtworks.css";

type ExpandState = {
  item: CanvasItem;
  origin: DOMRect;
};

export function DiscoverArtworks() {
  const [query, setQuery] = useState("");
  const [expand, setExpand] = useState<ExpandState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { artworks, catalogues } = useAllArtworks();
  const sourceKey =
    catalogues.map((row) => `${row.years}:${row.generatedAt}`).join("|") || "static";

  const [navVisible, setNavVisible] = useState(true);
  const isSearchFocusedRef = useRef(false);
  const isHoveringTopRef = useRef(false);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = searchBarRef.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: navVisible ? 1 : 0 });
        return;
      }

      if (navVisible) {
        gsap.to(el, {
          y: 0,
          autoAlpha: 1,
          duration: 0.38,
          ease: "power3.out",
          overwrite: "auto",
        });
      } else {
        gsap.to(el, {
          y: -140,
          autoAlpha: 0,
          duration: 0.38,
          ease: "power3.in",
          overwrite: "auto",
        });
      }
    },
    { dependencies: [navVisible], scope: rootRef }
  );

  useEffect(() => {
    markDiscoverMount();
    const stage = stageRef.current;
    const rect = stage?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;
    prefetchDiscoverViewport(artworks, w, h, sourceKey);
  }, [artworks, sourceKey]);

  const showNav = useCallback(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    setNavVisible(true);
    window.dispatchEvent(new CustomEvent("canvas:nav", { detail: { visible: true } }));
  }, []);

  const scheduleHideNav = useCallback(() => {
    if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
    graceTimerRef.current = setTimeout(() => {
      if (!isSearchFocusedRef.current && !isHoveringTopRef.current) {
        setNavVisible(false);
        window.dispatchEvent(new CustomEvent("canvas:nav", { detail: { visible: false } }));
      }
    }, 1400);
  }, []);

  // Initial onboarding: visible for 1.8s, then smoothly tucks away
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      if (!isSearchFocusedRef.current && !isHoveringTopRef.current) {
        setNavVisible(false);
        window.dispatchEvent(new CustomEvent("canvas:nav", { detail: { visible: false } }));
      }
    }, 1800);

    return () => clearTimeout(initialTimer);
  }, []);

  // Synchronize hover state with the top header hover zone
  useEffect(() => {
    const onNavHover = (e: Event) => {
      const hovering = Boolean((e as CustomEvent<{ hovering: boolean }>).detail?.hovering);
      isHoveringTopRef.current = hovering;
      if (hovering) {
        showNav();
      } else {
        scheduleHideNav();
      }
    };

    window.addEventListener("canvas:nav-hover", onNavHover);
    return () => window.removeEventListener("canvas:nav-hover", onNavHover);
  }, [showNav, scheduleHideNav]);

  // Quick keyboard shortcut '/' to focus search and show navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        showNav();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showNav]);

  const onSelect = useCallback((item: CanvasItem, el: HTMLButtonElement) => {
    setExpand({ item, origin: el.getBoundingClientRect() });
  }, []);

  return (
    <div ref={rootRef} className="discover">
      <div
        className="discover__top-sensor"
        onPointerEnter={() => {
          isHoveringTopRef.current = true;
          showNav();
        }}
        onPointerLeave={() => {
          isHoveringTopRef.current = false;
          scheduleHideNav();
        }}
        aria-hidden
      />
      <div
        ref={searchBarRef}
        className="discover__search"
        onPointerEnter={() => {
          isHoveringTopRef.current = true;
          showNav();
        }}
        onPointerLeave={() => {
          isHoveringTopRef.current = false;
          scheduleHideNav();
        }}
      >
        <label className="discover__search-field">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              isSearchFocusedRef.current = true;
              showNav();
            }}
            onBlur={() => {
              isSearchFocusedRef.current = false;
              scheduleHideNav();
            }}
            placeholder="Search Artworks"
            aria-label="Search Artworks"
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              className="discover__clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 1.5L12.5 12.5M1.5 12.5L12.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </label>
      </div>
      <div ref={stageRef} className="discover__stage">
        <InfiniteCanvas
          query={query}
          onSelect={onSelect}
          paused={Boolean(expand)}
          artworks={artworks}
          sourceKey={sourceKey}
        />
      </div>
      {expand ? (
        <CanvasExpand
          item={expand.item}
          origin={expand.origin}
          onClose={() => setExpand(null)}
        />
      ) : null}
    </div>
  );
}
