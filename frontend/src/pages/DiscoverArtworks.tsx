import { useCallback, useEffect, useRef, useState } from "react";
import type { ArtworkCard, CanvasItem } from "../data/site";
import { InfiniteCanvas } from "../components/canvas/InfiniteCanvas";
import { CanvasExpand } from "../components/canvas/CanvasExpand";
import { useAllArtworks } from "../lib/catalogue";
import { markDiscoverMount } from "../lib/discoverPerf";
import { gsap, prefersReducedMotion, useGSAP, DUR, EASE, EXIT } from "../lib/motion";
import { prefetchDiscoverViewport } from "../lib/predictivePrefetch";
import "./DiscoverArtworks.css";

type ExpandState = {
  item: CanvasItem;
  origin: DOMRect;
  /** The tile that was clicked, so the picture can return to where it is now (the canvas drifts). */
  originEl: HTMLElement;
};

export function DiscoverArtworks() {
  useEffect(() => {
    const prevHtml = document.documentElement.style.overscrollBehavior;
    const prevBody = document.body.style.overscrollBehavior;
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.documentElement.style.overscrollBehavior = prevHtml;
      document.body.style.overscrollBehavior = prevBody;
    };
  }, []);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [expand, setExpand] = useState<ExpandState | null>(null);
  // True from the moment an open artwork starts closing: the search bar is back in place at
  // once, behind the closing sheet, so nothing pops in once it has gone.
  const [expandClosing, setExpandClosing] = useState(false);
  // While an artwork opens, the search bar stays in place and the artwork grows over it; it is
  // put away only once the open artwork covers it, so nothing vanishes first.
  const [expandOpened, setExpandOpened] = useState(false);
  const searchHidden = Boolean(expand) && expandOpened && !expandClosing;
  const [isTucked, setIsTucked] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const isSearchFocusedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = isFocused || Boolean(query);
  const { artworks: liveArtworks, catalogues, status } = useAllArtworks();
  const liveSourceKey =
    catalogues.map((row) => `${row.years}:${row.generatedAt}`).join("|") || "static";
  // The field is built once, from the real artworks. Building it from placeholder photos
  // first and rebuilding when the data arrives re-lays out every tile, which is what made
  // tiles appear at random. A later background refresh must not rebuild it either.
  const [fieldSource, setFieldSource] = useState<{ artworks: ArtworkCard[]; sourceKey: string } | null>(null);
  useEffect(() => {
    if (fieldSource || status === "loading") return;
    setFieldSource({ artworks: liveArtworks, sourceKey: liveSourceKey });
  }, [fieldSource, status, liveArtworks, liveSourceKey]);
  const artworks = fieldSource?.artworks;
  const sourceKey = fieldSource?.sourceKey ?? "static";

  useEffect(() => {
    markDiscoverMount();
    // Until the real artworks are in, there is nothing worth fetching (the alternative is
    // the placeholder photos, which the field never shows).
    if (!artworks) return;
    const stage = stageRef.current;
    const rect = stage?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;
    prefetchDiscoverViewport(artworks, w, h, sourceKey);
  }, [artworks, sourceKey]);

  const expandRef = useRef(false);
  expandRef.current = Boolean(expand);

  const isTuckedRef = useRef(false);
  isTuckedRef.current = isTucked;
  const tuckHeader = useCallback(() => {
    if (isSearchFocusedRef.current || expandRef.current) return;
    // Already tucked: asking again would only restart the header's slide while the canvas moves.
    if (isTuckedRef.current) return;
    isTuckedRef.current = true;
    setIsTucked(true);
    window.dispatchEvent(new CustomEvent("canvas:tuck-header", { detail: { tucked: true } }));
  }, []);

  const untuckHeader = useCallback((immediate?: boolean | unknown) => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setIsTucked(false);
    window.dispatchEvent(
      new CustomEvent("canvas:tuck-header", {
        detail: { tucked: false, immediate: immediate === true },
      })
    );
  }, []);

  // Guarantee that whenever an article opens, header is immediately untucked and present
  useEffect(() => {
    if (expand) {
      untuckHeader(true);
    }
  }, [expand, untuckHeader]);

  // When interacting with the canvas, header slides up and search moves to top
  useEffect(() => {
    const onInteract = () => {
      if (isSearchFocusedRef.current || expandRef.current) return;
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

      // Moves in lockstep with the header: tucking away is an exit (quick), coming back an entrance.
      gsap.to(el, {
        y: isTucked ? -navHeight : 0,
        duration: isTucked ? EXIT.duration : DUR.emphasis,
        ease: isTucked ? EXIT.ease : EASE.enterSoft,
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

  const onSelect = useCallback(
    (item: CanvasItem, el: HTMLButtonElement) => {
      untuckHeader(true);
      setExpandClosing(false);
      setExpandOpened(false);
      setExpand({ item, origin: el.getBoundingClientRect(), originEl: el });
    },
    [untuckHeader]
  );

  const onNext = useCallback((nextArtwork: ArtworkCard) => {
    setExpand((prev) => {
      if (!prev) return null;
      const nextItem: CanvasItem = {
        ...prev.item,
        id: `aw-${nextArtwork.id}`,
        kind: "artwork",
        name: nextArtwork.title,
        image: nextArtwork.image || "",
        meta: nextArtwork.artists.map((a) => a.name).join(", "),
      };
      return { ...prev, item: nextItem };
    });
  }, []);

  return (
    <div ref={rootRef} className="discover">
      <div
        ref={searchBarRef}
        className={`discover__search${searchHidden ? " is-hidden" : ""}${expandClosing || expandOpened ? " is-restored" : ""}`}
        onPointerEnter={() => untuckHeader()}
        aria-hidden={searchHidden}
      >
        <div className={`discover__search-field${isActive ? " is-active" : ""}`}>
          <label htmlFor="discover-search-input" className="discover__search-label">
            Search
          </label>
          <input
            ref={searchInputRef}
            id="discover-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              isSearchFocusedRef.current = true;
              setIsFocused(true);
              untuckHeader();
            }}
            onBlur={() => {
              isSearchFocusedRef.current = false;
              setIsFocused(false);
            }}
            aria-label="Search Artworks"
            autoComplete="off"
          />
          <button
            type="button"
            className={`discover__clear${query ? " is-visible" : ""}`}
            onClick={() => setQuery("")}
            aria-label="Clear search"
            tabIndex={query ? 0 : -1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div ref={stageRef} className="discover__stage">
        {fieldSource ? (
          <InfiniteCanvas
            query={query}
            onSelect={onSelect}
            paused={Boolean(expand)}
            artworks={artworks}
            sourceKey={sourceKey}
          />
        ) : (
          <div className="infinite-canvas is-loading" aria-busy="true">
            <div className="infinite-canvas__loading" aria-hidden>
              <img src="/logo-sb-mark.svg" alt="" />
            </div>
          </div>
        )}
      </div>
      {expand ? (
        <CanvasExpand
          item={expand.item}
          origin={expand.origin}
          originEl={expand.originEl}
          onCloseStart={() => setExpandClosing(true)}
          onOpened={() => setExpandOpened(true)}
          onClose={() => {
            setExpand(null);
            setExpandClosing(false);
            setExpandOpened(false);
          }}
          onNext={onNext}
        />
      ) : null}
    </div>
  );
}
