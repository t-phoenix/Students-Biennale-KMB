import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import "./CatalogueList.css";

export type CatalogueRow = {
  id: string;
  /** Row heading (artwork title, artist name, venue name…). */
  title: string;
  /** Extra heading lines — curator duos list both names in one row. */
  titles?: string[];
  /** Small label above the heading (e.g. "Zone 1"). */
  eyebrow?: string;
  /** Second line under the heading (institution, venue, medium…). */
  sub?: string;
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

  const visible = rows.slice(0, shown);
  const shownId = rows.some((r) => r.id === activeId) ? activeId : rows[0]?.id;
  const preview = previewFor && shownId ? previewFor(shownId) : null;
  const custom = renderPreview && shownId ? renderPreview(shownId) : null;

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
                  {(row.titles ?? []).map((t) => (
                    <span key={t} className="catalogue__row-title">
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

      {custom ? (
        <aside className="catalogue__preview" aria-live="polite">
          {custom}
        </aside>
      ) : null}

      {preview ? (
        <aside className="catalogue__preview" aria-live="polite">
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
        </aside>
      ) : null}
    </div>
  );
}
