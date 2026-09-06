import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
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
  const animFrameRef = useRef<number | null>(null);
  const velocityRef = useRef<number>(0);

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

  const stopAutoScroll = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    velocityRef.current = 0;
  }, []);

  const runAutoScroll = useCallback(() => {
    const el = previewRef.current;
    if (!el || velocityRef.current === 0) {
      stopAutoScroll();
      return;
    }
    el.scrollTop += velocityRef.current;
    animFrameRef.current = requestAnimationFrame(runAutoScroll);
  }, [stopAutoScroll]);

  // Proximity-based auto-scroll when cursor approaches upper/lower bounds of the container
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = previewRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      if (height <= 0) return;

      const threshold = Math.min(110, height * 0.22);
      let speed = 0;

      if (y < threshold && y >= 0) {
        const intensity = 1 - y / threshold;
        speed = -Math.round(intensity * 10);
      } else if (y > height - threshold && y <= height) {
        const intensity = 1 - (height - y) / threshold;
        speed = Math.round(intensity * 10);
      }

      velocityRef.current = speed;
      if (speed !== 0 && animFrameRef.current === null) {
        animFrameRef.current = requestAnimationFrame(runAutoScroll);
      } else if (speed === 0) {
        stopAutoScroll();
      }
    },
    [runAutoScroll, stopAutoScroll],
  );

  const handleMouseLeave = useCallback(() => {
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLElement>) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

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
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
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

              <dl className="catalogue__preview-meta">
                {preview.fields.map((field) => (
                  <div key={field.label}>
                    <dt>{field.label}</dt>
                    <dd>
                      {field.values.map((v) => (
                        <span key={v}>{v}</span>
                      ))}
                    </dd>
                  </div>
                ))}

                {preview.note ? (
                  <div className="catalogue__preview-note">
                    <dt>Note :</dt>
                    <dd>
                      <p>{preview.note}</p>
                      {preview.noteHref ? (
                        <Link to={preview.noteHref}>Read More...</Link>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
