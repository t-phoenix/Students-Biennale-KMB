import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, useCallback } from "react";
import { REVEAL } from "../lib/motion";
import { Link } from "react-router-dom";
import { FormattedText } from "./FormattedText";
import { MetaGrid, MetaRow } from "./MetaGrid";
import { subscribeLenis, getLenisInstance } from "../lib/lenisSingleton";
import "./CatalogueList.css";
import { PreviewCrossfade } from "./PreviewCrossfade";

export type CatalogueRow = {
  id: string;
  /** Row heading (artwork title, artist name, venue name…). */
  title: ReactNode;
  /** Extra heading lines — curator duos list both names in one row. */
  titles?: ReactNode[];
  /** Small label above the heading (e.g. "Zone 1"). */
  eyebrow?: ReactNode;
  /** Second line under the heading (institution, venue, medium…). */
  sub?: ReactNode;
  /** Where the row's "open" link goes. Omit for rows with nothing to open. */
  href?: string;
};

export type CataloguePreview = {
  title: string;
  year?: string;
  image?: string;
  /** Label/value pairs — "Venue :", "Artist :", "Curator :". Values may be multi-line. */
  fields: { label: string; values: string[] }[];
  note?: string;
  noteHref?: string;
};

function isAccordionMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth <= 899 ||
    window.matchMedia("(max-width: 1024px) and (orientation: portrait)").matches ||
    window.matchMedia("(hover: none) and (pointer: coarse) and (max-width: 1024px)").matches
  );
}

function isTouchInteraction(e: React.MouseEvent): boolean {
  if (typeof window === "undefined") return false;
  const pe = e.nativeEvent as PointerEvent | undefined;
  if (pe && (pe.pointerType === "touch" || pe.pointerType === "pen")) {
    return true;
  }
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  if (isCoarse && pe?.pointerType !== "mouse") {
    return true;
  }
  return false;
}

function getTruncatedNote(note: string, maxWords = 50): string {
  if (!note) return "";
  const firstPara = note.split(/\n\s*\n/)[0]?.trim() || note;
  const words = firstPara.split(/\s+/);
  if (words.length <= maxWords) return firstPara;
  return words.slice(0, maxWords).join(" ") + "…";
}

type CatalogueListProps = {
  rows: CatalogueRow[];
  /** Field-based preview shown on cols 9-12 for the highlighted row. */
  previewFor?: (id: string) => CataloguePreview | null;
  /** Bespoke preview panel, used instead of previewFor (the curators panel). */
  renderPreview?: (id: string) => ReactNode;
  /** Rows revealed per page; a "Load more..." control appears while more remain. */
  pageSize?: number;
};

function renderPreviewBody(
  id: string,
  previewFor?: (id: string) => CataloguePreview | null,
  renderPreview?: (id: string) => ReactNode
) {
  if (renderPreview) {
    return renderPreview(id);
  }
  if (!previewFor) return null;
  const preview = previewFor(id);
  if (!preview) return null;

  return (
    <div className="catalogue__preview-inner">
      {preview.image ? (
        <div className="catalogue__preview-media">
          <img src={preview.image} alt={preview.title} loading="lazy" />
        </div>
      ) : null}

      <div className="catalogue__preview-head">
        <h3>{preview.title}</h3>
        {preview.year ? <span>{preview.year}</span> : null}
      </div>

      <div className="catalogue__preview-meta-wrap">
        <MetaGrid className="catalogue__preview-meta">
          {preview.fields.map((field) => {
            const cleanLabel = field.label.replace(/\s*:$/, "").trim();
            return (
              <MetaRow
                key={field.label}
                label={cleanLabel}
                value={
                  field.values.length === 1 ? (
                    field.values[0]
                  ) : (
                    <span className="catalogue__preview-values">
                      {field.values.map((v) => (
                        <span key={v} className="catalogue__preview-value-line">
                          {v}
                        </span>
                      ))}
                    </span>
                  )
                }
              />
            );
          })}
          {preview.note ? (
            <MetaRow
              label="Note"
              className="catalogue__preview-note-row"
              value={
                <div className="catalogue__preview-note-content">
                  <FormattedText as="p" text={getTruncatedNote(preview.note, 50)} />
                  {preview.noteHref ? (
                    <Link to={preview.noteHref} className="catalogue__preview-cta">
                      <span>VIEW FULL ARTWORK</span>
                      <span aria-hidden>→</span>
                    </Link>
                  ) : null}
                </div>
              }
            />
          ) : preview.noteHref ? (
            <MetaRow
              label=""
              className="catalogue__preview-note-row"
              value={
                <div className="catalogue__preview-note-content">
                  <Link to={preview.noteHref} className="catalogue__preview-cta">
                    <span>VIEW FULL ARTWORK</span>
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              }
            />
          ) : null}
        </MetaGrid>
      </div>
    </div>
  );
}

/**
 * Figma list view (708:518 / 713:970): rows on cols 4-8 with a rule above and below
 * each, a "Load more..." control, and a live preview panel on cols 9-12 (desktop)
 * or in-place accordion rows on mobile.
 */
export function CatalogueList({
  rows,
  previewFor,
  renderPreview,
  pageSize = 12,
}: CatalogueListProps) {
  const [activeId, setActiveId] = useState(rows[0]?.id ?? "");
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);
  // A row that is closing keeps its preview until its lower edge has risen over it; removing it
  // at once made the row snap shut instead of closing.
  const [closingId, setClosingId] = useState<string | null>(null);
  const lastExpandedRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const prev = lastExpandedRef.current;
    lastExpandedRef.current = mobileExpandedId;
    if (!prev || prev === mobileExpandedId) return;
    setClosingId(prev);
    const t = window.setTimeout(() => setClosingId(null), REVEAL.close * 1000 + 60);
    return () => window.clearTimeout(t);
  }, [mobileExpandedId]);
  const [touchActivatedId, setTouchActivatedId] = useState<string | null>(null);
  const [shown, setShown] = useState(pageSize);
  const previewRef = useRef<HTMLElement>(null);

  // Rolling the pointer down the list must not flip the preview on every row it crosses: a
  // row is chosen only once the pointer has rested on it for a moment.
  const pendingChoice = useRef(0);
  const cancelPendingChoice = useCallback(() => window.clearTimeout(pendingChoice.current), []);
  const chooseAfterPause = useCallback(
    (id: string) => {
      window.clearTimeout(pendingChoice.current);
      pendingChoice.current = window.setTimeout(() => setActiveId(id), 110);
    },
    [],
  );
  useEffect(() => cancelPendingChoice, [cancelPendingChoice]);

  const visible = rows.slice(0, shown);
  const shownId = rows.some((r) => r.id === activeId) ? activeId : rows[0]?.id;

  // Auto-reset scroll position when selecting a new catalogue item on desktop
  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.scrollTop = 0;
    }
  }, [shownId]);

  // Dynamically clamp max-height so the bottom of the preview (e.g. "VIEW ARTWORKS")
  // is always 100% reachable within the viewport without having to scroll the page.
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;

    let rafId: number;

    const updateHeight = () => {
      if (isAccordionMode()) {
        el.style.maxHeight = "none";
        return;
      }
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const bottomInset = 24; // buffer above bottom of viewport
      const available = Math.max(180, viewportH - rect.top - bottomInset);
      el.style.maxHeight = `${available}px`;
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateHeight);
    };

    updateHeight();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    const unsubscribeLenis = subscribeLenis((lenis) => {
      if (lenis) {
        lenis.on("scroll", handleScroll);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      unsubscribeLenis();
      const lenis = getLenisInstance();
      if (lenis) {
        lenis.off("scroll", handleScroll);
      }
    };
  }, [shownId, renderPreview, previewFor]);

  const handleRowClick = (e: React.MouseEvent, row: CatalogueRow) => {
    if (isAccordionMode()) {
      const isExpanded = mobileExpandedId === row.id;
      const target = e.target as HTMLElement;
      const isMarkClick = Boolean(target.closest(".catalogue__row-mark"));

      if (!isExpanded) {
        // First click on this article: expand it in place. The page never scrolls.
        e.preventDefault();
        setMobileExpandedId(row.id);
        setActiveId(row.id);
      } else {
        // Row is already expanded:
        if (isMarkClick) {
          // Explicit click on the toggle mark collapses it
          e.preventDefault();
          setMobileExpandedId(null);
        } else if (row.href) {
          // Clicking again on the article opens new page (allow Link navigation)
        } else {
          e.preventDefault();
          setMobileExpandedId(null);
        }
      }
      return;
    }

    // Touch devices in side-preview mode (e.g. Surface Pro, iPad in landscape, touchscreen laptops)
    if (isTouchInteraction(e)) {
      const target = e.target as HTMLElement;
      const isMarkClick = Boolean(target.closest(".catalogue__row-mark"));
      const isAlreadyTapped = touchActivatedId === row.id && activeId === row.id;

      if (isMarkClick) {
        // Explicit tap on the + / - toggle mark selects/expands without navigating to full page
        e.preventDefault();
        setActiveId(row.id);
        setTouchActivatedId(row.id);
        return;
      }

      if (!isAlreadyTapped) {
        // 1st tap on the row expands / previews it first, preventing immediate navigation
        e.preventDefault();
        setActiveId(row.id);
        setTouchActivatedId(row.id);
        return;
      }

      // If already active and tapped by user, clicking row body again allows navigation
    }
  };

  return (
    <div className="catalogue fig-band-9">
      <div className="catalogue__rows">
        {visible.map((row) => {
          const isMobileExpanded = row.id === mobileExpandedId;
          const isDesktopActive = row.id === activeId;

          const rowContent = (
            <>
              {row.eyebrow ? (
                <span className="catalogue__row-eyebrow">{row.eyebrow}</span>
              ) : null}
              <span className="catalogue__row-title">{row.title}</span>
              {(row.titles ?? []).map((t, i) => (
                <span key={i} className="catalogue__row-title">
                  {t}
                </span>
              ))}
              {row.sub ? <span className="catalogue__row-sub">{row.sub}</span> : null}
              <span className="catalogue__row-mark" aria-hidden />
            </>
          );

          return (
            <div
              key={row.id}
              className={`catalogue__row${isDesktopActive ? " is-active" : ""}${
                isMobileExpanded ? " is-expanded" : ""
              }`}
              onMouseEnter={() => chooseAfterPause(row.id)}
              onMouseLeave={cancelPendingChoice}
              onFocus={() => {
                cancelPendingChoice();
                setActiveId(row.id);
              }}
            >
              {row.href ? (
                <Link
                  className="catalogue__row-link"
                  to={row.href}
                  onClick={(e) => handleRowClick(e, row)}
                  aria-expanded={isMobileExpanded}
                >
                  {rowContent}
                </Link>
              ) : (
                <button
                  type="button"
                  className="catalogue__row-link catalogue__row-link--button"
                  onClick={(e) => handleRowClick(e, row)}
                  aria-expanded={isMobileExpanded}
                >
                  {rowContent}
                </button>
              )}

              {/* Mobile in-place expandable accordion */}
              <div
                className={`catalogue__row-accordion${isMobileExpanded ? " is-open" : ""}`}
                aria-hidden={!isMobileExpanded}
              >
                <div className="catalogue__row-accordion-inner">
                  {isMobileExpanded || row.id === closingId
                    ? renderPreviewBody(row.id, previewFor, renderPreview)
                    : null}
                </div>
              </div>
            </div>
          );
        })}

        {shown < rows.length ? (
          <button
            type="button"
            className="catalogue__more"
            onClick={() => setShown((n) => n + pageSize)}
          >
            Load more...
          </button>
        ) : null}
      </div>

      {shownId && (previewFor || renderPreview) ? (
        <aside
          ref={previewRef}
          className="catalogue__preview"
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          aria-live="polite"
        >
          <PreviewCrossfade
            id={shownId}
            render={(id) => renderPreviewBody(id, previewFor, renderPreview)}
          />
        </aside>
      ) : null}
    </div>
  );
}
