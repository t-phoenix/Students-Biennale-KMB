import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FormattedParagraphs } from "./FormattedText";
import { MetaGrid, MetaRow } from "./MetaGrid";
import { subscribeLenis, getLenisInstance } from "../lib/lenisSingleton";
import "./CatalogueList.css";

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

type CatalogueListProps = {
  rows: CatalogueRow[];
  /** Field-based preview shown on cols 9-12 for the highlighted row. */
  previewFor?: (id: string) => CataloguePreview | null;
  /** Bespoke preview panel, used instead of previewFor (the curators panel). */
  renderPreview?: (id: string) => ReactNode;
  /** Rows revealed per page; a "Load more..." control appears while more remain. */
  pageSize?: number;
};

/**
 * Figma list view (708:518 / 713:970): rows on cols 4-8 with a rule above and below
 * each, a "Load more..." control, and a live preview panel on cols 9-12.
 */
export function CatalogueList({
  rows,
  previewFor,
  renderPreview,
  pageSize = 12,
}: CatalogueListProps) {
  const [activeId, setActiveId] = useState(rows[0]?.id ?? "");
  const [shown, setShown] = useState(pageSize);
  const previewRef = useRef<HTMLElement>(null);

  const visible = rows.slice(0, shown);
  const shownId = rows.some((r) => r.id === activeId) ? activeId : rows[0]?.id;
  const preview = previewFor && shownId ? previewFor(shownId) : null;
  const custom = renderPreview && shownId ? renderPreview(shownId) : null;

  // Auto-reset scroll position when selecting a new catalogue item
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
      if (window.innerWidth <= 899) {
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
  }, [shownId, custom, preview]);

  return (
    <div className="catalogue fig-band-9">
      <div className="catalogue__rows">
        {visible.map((row) => (
          <div
            key={row.id}
            className={`catalogue__row${row.id === activeId ? " is-active" : ""}`}
            onMouseEnter={() => setActiveId(row.id)}
            onFocus={() => setActiveId(row.id)}
          >
            {(() => {
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
              return row.href ? (
                <Link className="catalogue__row-link" to={row.href}>
                  {rowContent}
                </Link>
              ) : (
                <div className="catalogue__row-link catalogue__row-link--static">
                  {rowContent}
                </div>
              );
            })()}
          </div>
        ))}

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

      {custom || preview ? (
        <aside
          ref={previewRef}
          className="catalogue__preview"
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          aria-live="polite"
        >
          {custom ? (
            custom
          ) : preview ? (
            <>
              <div className="catalogue__preview-media">
                {preview.image ? <img src={preview.image} alt="" /> : null}
              </div>

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
                                <span key={v} className="catalogue__preview-value-line">{v}</span>
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
                          <FormattedParagraphs text={preview.note} />
                          {preview.noteHref ? (
                            <Link to={preview.noteHref}>Read More...</Link>
                          ) : null}
                        </div>
                      }
                    />
                  ) : null}
                </MetaGrid>
              </div>
            </>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
