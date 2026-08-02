import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import {
  ARTISTS,
  ARTWORKS,
  CURATOR_ZONES,
  VENUES,
  type ArtworkCard,
  type CuratorCard,
} from "../data/site";
import "./EditionViews.css";

function useStagger(ref: RefObject<HTMLElement | null>, dep: string) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".edition-card", {
        autoAlpha: 0,
        y: 20,
        duration: 0.45,
        stagger: 0.06,
        ease: "power2.out",
      });
    },
    { scope: ref, dependencies: [dep] }
  );
}

function Toolbar({
  query,
  setQuery,
  view,
  setView,
}: {
  query: string;
  setQuery: (v: string) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
}) {
  return (
    <div className="edition-toolbar">
      <label className="edition-search">
        <span className="sr-only">Search</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
        />
      </label>
      <div className="edition-view-toggle" role="group" aria-label="View mode">
        <button
          type="button"
          className={view === "grid" ? "is-active" : undefined}
          onClick={() => setView("grid")}
          aria-pressed={view === "grid"}
          aria-label="Grid view"
        >
          <span className="edition-view-toggle__icon edition-view-toggle__icon--grid" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={view === "list" ? "is-active" : undefined}
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          aria-label="List view"
        >
          <span className="edition-view-toggle__icon edition-view-toggle__icon--list" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Plus/minus row-expand glyph, downloaded from Figma (Group 112/113) — never hand-drawn. */
function ExpandIcon({ active }: { active: boolean }) {
  return (
    <span
      className={`edition-row__toggle${active ? " edition-row__toggle--minus" : " edition-row__toggle--plus"}`}
      aria-hidden="true"
    />
  );
}

type FeatureField = { label: string; value: ReactNode };

/**
 * Shared "row list + featured side panel" pattern (Figma 32:267 Artworks list,
 * 32:2 Artists list) — mirrors how Press.tsx swaps a featured item via state.
 */
function FeaturePanel({
  image,
  focus,
  title,
  meta,
  fields,
  note,
  moreHref,
}: {
  image?: string;
  focus?: string;
  title: string;
  meta?: string;
  fields: FeatureField[];
  note?: string;
  moreHref: string;
}) {
  return (
    <aside className="edition-feature">
      <div
        className={`edition-feature__media${image ? "" : " edition-feature__media--placeholder"}`}
        aria-hidden={!image}
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            style={focus ? { objectPosition: focus } : undefined}
          />
        ) : null}
      </div>
      <div className="edition-feature__head">
        <h3>{title}</h3>
        {meta ? <span>{meta}</span> : null}
      </div>
      {fields.length ? (
        <dl className="edition-feature__fields">
          {fields.map((f) => (
            <div key={f.label} className="edition-feature__field">
              <dt>{f.label} :</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {note ? (
        <div className="edition-feature__note">
          <p className="edition-feature__note-label">Note :</p>
          <p>{note}</p>
        </div>
      ) : null}
      <Link to={moreHref} className="edition-feature__more">
        Read More...
      </Link>
    </aside>
  );
}

function artworkFields(a: ArtworkCard): FeatureField[] {
  const fields: FeatureField[] = [{ label: "Venue", value: a.venue }];
  if (a.artists.length) {
    fields.push({
      label: "Artist",
      value: (
        <>
          {a.artists.map((ar) => (
            <div key={ar.name}>{ar.name}</div>
          ))}
        </>
      ),
    });
  }
  if (a.curators?.length) {
    fields.push({
      label: "Curator",
      value: (
        <>
          {a.curators.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </>
      ),
    });
  }
  return fields;
}

function findArtworkForArtist(name: string) {
  return ARTWORKS.find((aw) => aw.artists.some((ar) => ar.name === name));
}

function CuratorPortrait({
  curator,
  yearId,
}: {
  curator: CuratorCard;
  yearId: string;
}) {
  return (
    <Link
      className="edition-card edition-card--curator"
      to={`/editions/${yearId}/curators/${curator.id}`}
    >
      <div
        className={`edition-card__frame${curator.image ? "" : " edition-card__frame--placeholder"}`}
        aria-hidden={!curator.image}
      >
        {curator.image ? (
          <img
            src={curator.image}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ objectPosition: curator.focus ?? "50% 20%" }}
          />
        ) : null}
      </div>
      <h3>{curator.name}</h3>
    </Link>
  );
}

export function CuratorsView() {
  const { yearId = "2025-26" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const zones = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURATOR_ZONES;
    return CURATOR_ZONES.map((zone) => ({
      ...zone,
      curators: zone.curators.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q) ||
          zone.label.toLowerCase().includes(q) ||
          zone.states.toLowerCase().includes(q)
      ),
    })).filter((z) => z.curators.length > 0);
  }, [query]);

  useStagger(root, `${view}-${query}`);

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      {view === "list" ? (
        <div className="edition-curator-list">
          {zones.map((zone) => (
            <section key={zone.id} className="edition-curator-list__zone">
              <header className="edition-curator-list__zone-head">
                <h4>{zone.label}</h4>
                <p>{zone.states}</p>
              </header>
              <div className="edition-curator-list__bios">
                {zone.curators.map((c) => (
                  <article key={c.id} className="edition-card edition-curator-bio">
                    <div
                      className={`edition-card__frame edition-curator-bio__frame${c.image ? "" : " edition-card__frame--placeholder"}`}
                      aria-hidden={!c.image}
                    >
                      {c.image ? (
                        <img
                          src={c.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          style={{ objectPosition: c.focus ?? "50% 20%" }}
                        />
                      ) : null}
                    </div>
                    <div className="edition-curator-bio__text">
                      <h3>{c.name}</h3>
                      <p>{c.bio ?? c.note}</p>
                      <Link
                        to={`/editions/${yearId}/curators/${c.id}`}
                        className="edition-curator-bio__link"
                      >
                        Know more...
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="edition-zones">
          {zones.map((zone) => (
            <section key={zone.id} className="edition-zone">
              <div className="edition-zone__grid">
                {zone.curators.map((c) => (
                  <CuratorPortrait key={c.id} curator={c} yearId={yearId} />
                ))}
              </div>
              <aside className="edition-zone__meta">
                <h4>{zone.label}</h4>
                <p>{zone.states}</p>
              </aside>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArtworksView() {
  const { yearId = "2025-26" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const items = useMemo(
    () =>
      ARTWORKS.filter(
        (a) =>
          !query ||
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.venue.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  const featured = items.find((a) => a.id === selectedId) ?? items[0];
  useStagger(root, `${view}-${query}`);

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      {view === "grid" ? (
        <div className="edition-grid edition-grid--art">
          {items.map((a) => (
            <Link
              key={a.id}
              className="edition-card"
              to={`/editions/${yearId}/artworks/${a.id}`}
            >
              <div
                className={`edition-card__media edition-card__media--landscape${a.image ? "" : " edition-card__media--placeholder"}`}
                aria-hidden={!a.image}
              >
                {a.image ? (
                  <img src={a.image} alt="" loading="lazy" decoding="async" />
                ) : null}
              </div>
              <h3>{a.title}</h3>
              <p>Venue : {a.venue}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="edition-row-list">
          <div className="edition-row-list__rows">
            {items.map((a) => {
              const isActive = featured?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`edition-row${isActive ? " is-active" : ""}`}
                  onMouseEnter={() => setSelectedId(a.id)}
                  onFocus={() => setSelectedId(a.id)}
                  onClick={() => setSelectedId(a.id)}
                  aria-pressed={isActive}
                >
                  <span className="edition-row__main">
                    <span className="edition-row__title">{a.title}</span>
                    <span className="edition-row__meta">Venue : {a.venue}</span>
                  </span>
                  <ExpandIcon active={isActive} />
                </button>
              );
            })}
          </div>
          {featured ? (
            <FeaturePanel
              image={featured.image}
              title={featured.title}
              meta={featured.year}
              fields={artworkFields(featured)}
              note={featured.description}
              moreHref={`/editions/${yearId}/artworks/${featured.id}`}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ArtistsView() {
  const { yearId = "2025-26" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const items = useMemo(
    () =>
      ARTISTS.filter(
        (a) =>
          !query ||
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.institution.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  const featured = items.find((a) => a.id === selectedId) ?? items[0];
  const featuredArtwork = featured ? findArtworkForArtist(featured.name) : undefined;
  useStagger(root, `${view}-${query}`);

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      {view === "grid" ? (
        <div className="edition-grid edition-grid--artists">
          {items.map((a) => (
            <Link
              key={a.id}
              className="edition-card edition-card--artist"
              to={`/editions/${yearId}/artists/${a.id}`}
            >
              {a.image ? (
                <div className="edition-card__media edition-card__media--square">
                  <img
                    src={a.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: a.focus ?? "50% 50%" }}
                  />
                </div>
              ) : null}
              <h3>{a.name}</h3>
              <p>{a.institution}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="edition-row-list">
          <div className="edition-row-list__rows">
            {items.map((a) => {
              const isActive = featured?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`edition-row${isActive ? " is-active" : ""}`}
                  onMouseEnter={() => setSelectedId(a.id)}
                  onFocus={() => setSelectedId(a.id)}
                  onClick={() => setSelectedId(a.id)}
                  aria-pressed={isActive}
                >
                  <span className="edition-row__main">
                    <span className="edition-row__title">{a.name}</span>
                    <span className="edition-row__meta">{a.institution}</span>
                  </span>
                  <ExpandIcon active={isActive} />
                </button>
              );
            })}
          </div>
          {featured ? (
            featuredArtwork ? (
              <FeaturePanel
                image={featuredArtwork.image}
                title={featuredArtwork.title}
                meta={featuredArtwork.year}
                fields={artworkFields(featuredArtwork)}
                note={featuredArtwork.description}
                moreHref={`/editions/${yearId}/artworks/${featuredArtwork.id}`}
              />
            ) : (
              <FeaturePanel
                title={featured.name}
                fields={[{ label: "Institution", value: featured.institution }]}
                note="No linked artwork listed for this edition yet."
                moreHref={`/editions/${yearId}/artists/${featured.id}`}
              />
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

export function VenueView() {
  const { yearId = "2025-26" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const items = useMemo(
    () =>
      VENUES.filter(
        (v) =>
          !query ||
          v.name.toLowerCase().includes(query.toLowerCase()) ||
          v.address.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  useStagger(root, `${view}-${query}`);

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      {view === "grid" ? (
        <div className="edition-grid edition-grid--venues">
          {items.map((v) => (
            <article key={v.id} className="edition-card edition-card--venue">
              <Link to={`/editions/${yearId}/venue/${v.id}`} className="edition-card__link">
                <div
                  className={`edition-card__media edition-card__media--venue${v.image ? "" : " edition-card__media--placeholder"}`}
                  aria-hidden={!v.image}
                >
                  {v.image ? (
                    <img src={v.image} alt="" loading="lazy" decoding="async" />
                  ) : null}
                </div>
                <h3>{v.name}</h3>
              </Link>
              {v.history ? (
                <p className="edition-card__excerpt">
                  {v.history.length > 150 ? `${v.history.slice(0, 150)}…` : v.history}{" "}
                  <Link to={`/editions/${yearId}/venue/${v.id}`} className="edition-card__more">
                    Read more...
                  </Link>
                </p>
              ) : null}
              {v.mapUrl || v.virtualTourUrl ? (
                <p className="edition-card__links">
                  {v.mapUrl ? (
                    <a href={v.mapUrl} target="_blank" rel="noreferrer">
                      Google Map
                    </a>
                  ) : null}
                  {v.mapUrl && v.virtualTourUrl ? " / " : null}
                  {v.virtualTourUrl ? (
                    <a href={v.virtualTourUrl} target="_blank" rel="noreferrer">
                      Virtual Tour
                    </a>
                  ) : null}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="edition-venue-rows">
          {items.map((v) => (
            <article key={v.id} className="edition-venue-row">
              <Link
                to={`/editions/${yearId}/venue/${v.id}`}
                className="edition-venue-row__link"
              >
                <div
                  className={`edition-card__media edition-card__media--wide${v.image ? "" : " edition-card__media--placeholder"}`}
                  aria-hidden={!v.image}
                >
                  {v.image ? (
                    <img src={v.image} alt="" loading="lazy" decoding="async" />
                  ) : null}
                </div>
                <div className="edition-venue-row__body">
                  <h3>{v.name}</h3>
                  <p>{v.history ?? v.address}</p>
                </div>
              </Link>
              {v.mapUrl || v.virtualTourUrl ? (
                <p className="edition-card__links">
                  {v.mapUrl ? (
                    <a href={v.mapUrl} target="_blank" rel="noreferrer">
                      Google Map
                    </a>
                  ) : null}
                  {v.mapUrl && v.virtualTourUrl ? " / " : null}
                  {v.virtualTourUrl ? (
                    <a href={v.virtualTourUrl} target="_blank" rel="noreferrer">
                      Virtual Tour
                    </a>
                  ) : null}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
