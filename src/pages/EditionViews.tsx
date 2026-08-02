import { useMemo, useRef, useState, type RefObject } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import {
  ARTISTS,
  ARTWORKS,
  CURATOR_ZONES,
  VENUES,
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
          ▦
        </button>
        <button
          type="button"
          className={view === "list" ? "is-active" : undefined}
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          aria-label="List view"
        >
          ☰
        </button>
      </div>
    </div>
  );
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
        <div className="edition-list">
          {zones.flatMap((z) =>
            z.curators.map((c) => (
              <Link
                key={c.id}
                className="edition-card edition-card--row"
                to={`/editions/${yearId}/curators/${c.id}`}
              >
                <h3>{c.name}</h3>
                <p>
                  {z.label} · {c.region}
                </p>
              </Link>
            ))
          )}
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
  useStagger(root, `${view}-${query}`);

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      <div className={view === "grid" ? "edition-grid edition-grid--art" : "edition-list"}>
        {items.map((a) => (
          <Link
            key={a.id}
            className="edition-card"
            to={`/editions/${yearId}/artworks/${a.id}`}
          >
            <div className="edition-card__media edition-card__media--tall" aria-hidden />
            <h3>{a.title}</h3>
            <p>Venue : {a.venue}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ArtistsView() {
  const { yearId = "2025-26" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
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
  useStagger(root, `${view}-${query}`);

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      <div className={view === "grid" ? "edition-grid" : "edition-list"}>
        {items.map((a) => (
          <Link
            key={a.id}
            className="edition-card"
            to={`/editions/${yearId}/artists/${a.id}`}
          >
            <div className="edition-card__media" aria-hidden />
            <h3>{a.name}</h3>
            <p>{a.institution}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function VenueView() {
  const { yearId = "2025-26" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
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
  useStagger(root, query);

  return (
    <div ref={root} className="edition-view">
      <label className="edition-search edition-search--alone">
        <span className="sr-only">Search venues</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
        />
      </label>
      <div className="edition-venue-rows">
        {items.map((v) => (
          <Link
            key={v.id}
            className="edition-card edition-card--row"
            to={`/editions/${yearId}/venue/${v.id}`}
          >
            <div className="edition-card__media edition-card__media--wide" aria-hidden />
            <div>
              <h3>{v.name}</h3>
              <p>{v.address}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
