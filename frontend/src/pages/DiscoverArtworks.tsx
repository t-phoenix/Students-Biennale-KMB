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
  const [isTucked, setIsTucked] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const isSearchFocusedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { artworks, catalogues } = useAllArtworks();
  const sourceKey =
    catalogues.map((row) => `${row.years}:${row.generatedAt}`).join("|") || "static";

  useEffect(() => {
    markDiscoverMount();
    const stage = stageRef.current;
    const rect = stage?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;
    prefetchDiscoverViewport(artworks, w, h, sourceKey);
  }, [artworks, sourceKey]);

  const tuckHeader = useCallback(() => {
    if (isSearchFocusedRef.current) return;
    setIsTucked(true);
    window.dispatchEvent(new CustomEvent("canvas:tuck-header", { detail: { tucked: true } }));
  }, []);

  const untuckHeader = useCallback(() => {
    setIsTucked(false);
    window.dispatchEvent(new CustomEvent("canvas:tuck-header", { detail: { tucked: false } }));
  }, []);

  // When interacting with the canvas, header slides up and search moves to top
  useEffect(() => {
    const onInteract = () => {
      if (isSearchFocusedRef.current) return;
      tuckHeader();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        untuckHeader();
      }, 2500);
    };

    const onHeaderSync = (e: Event) => {
      const tucked = Boolean((e as CustomEvent<{ tucked: boolean }>).detail?.tucked);
      setIsTucked(tucked);
    };

    window.addEventListener("canvas:interacting", onInteract);
    window.addEventListener("canvas:tuck-header", onHeaderSync);
    return () => {
      window.removeEventListener("canvas:interacting", onInteract);
      window.removeEventListener("canvas:tuck-header", onHeaderSync);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [tuckHeader, untuckHeader]);

  // Smoothly elevate search to top edge in lockstep with header tucking
  useGSAP(
    () => {
      const el = searchBarRef.current;
      if (!el) return;

      const headerEl = document.querySelector<HTMLElement>(".site-header");
      const navHeight = headerEl?.offsetHeight || (window.innerWidth <= 899 ? 48 : 64);

      if (prefersReducedMotion()) {
        gsap.set(el, { y: isTucked ? -navHeight : 0 });
        return;
      }

      gsap.to(el, {
        y: isTucked ? -navHeight : 0,
        duration: 0.38,
        ease: isTucked ? "power3.inOut" : "power3.out",
        overwrite: "auto",
      });
    },
    { dependencies: [isTucked], scope: rootRef }
  );

  // Quick keyboard shortcut '/' to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        untuckHeader();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [untuckHeader]);

  const onSelect = useCallback((item: CanvasItem, el: HTMLButtonElement) => {
    setExpand({ item, origin: el.getBoundingClientRect() });
  }, []);

  return (
    <div ref={rootRef} className="discover">
      <div
        ref={searchBarRef}
        className="discover__search"
        onPointerEnter={untuckHeader}
      >
        <label className="discover__search-field">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              isSearchFocusedRef.current = true;
              untuckHeader();
            }}
            onBlur={() => {
              isSearchFocusedRef.current = false;
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
