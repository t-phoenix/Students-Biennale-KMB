import { useMemo, useRef, useState, type RefObject } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { type CuratorCard } from "../data/site";
import {
  curatorsForArtworkIn,
  matchesQuery,
  useEditionCatalogue,
} from "../lib/catalogue";
import { CatalogueList } from "../components/CatalogueList";
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
    <div className="edition-toolbar fig-band-9">
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
          <img src="/icons/grid-view.svg" alt="" width={36} height={36} />
        </button>
        <button
          type="button"
          className={view === "list" ? "is-active" : undefined}
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          aria-label="List view"
        >
          <img src="/icons/list-view.svg" alt="" width={36} height={36} />
        </button>
      </div>
    </div>
  );
}

function Forthcoming({
  catalogue,
  kind,
}: {
  catalogue?: { sections: { section_key: string; body?: string | null }[]; teamBody: string | null };
  kind?: "curators" | "artworks" | "artists" | "venues";
}) {
  const body =
    (kind && catalogue?.sections.find((s) => s.section_key === kind)?.body) ||
    (kind === "curators" ? catalogue?.teamBody : null);
  if (body) {
    return (
      <div className="fig-body" style={{ whiteSpace: "pre-line", margin: "1.5rem 0" }}>
        {body}
      </div>
    );
  }
  return (
    <p className="fig-body" style={{ margin: "1.5rem 0" }}>
      Catalogue records for this edition are forthcoming.
    </p>
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
            src={`${curator.image}?v=3`}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ objectPosition: curator.focus ?? "center bottom" }}
          />
        ) : null}
      </div>
      <h3>{curator.name}</h3>
    </Link>
  );
}

export function CuratorsView() {
  const { yearId = "2025-26" } = useParams();
  const { catalogue } = useEditionCatalogue(yearId);
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const zones = useMemo(() => {
    return catalogue.zones
      .map((zone) => ({
        ...zone,
        curators: zone.curators.filter((c) =>
          matchesQuery(query, c.searchText, c.name, c.region, zone.label, zone.states),
        ),
      }))
      .filter((z) => z.curators.length > 0);
  }, [catalogue.zones, query]);

  useStagger(root, `${view}-${query}-${catalogue.editionId}`);

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      {!catalogue.zones.length ? (
        <Forthcoming catalogue={catalogue} kind="curators" />
      ) : view === "list" ? (
        <CatalogueList
          pageSize={8}
          rows={zones.map((z) => ({
            id: z.id,
            eyebrow: z.label,
            title: z.curators[0]?.name ?? z.label,
            titles: z.curators.slice(1).map((c) => c.name),
            href: `/editions/${yearId}/curators/${z.curators[0]?.id ?? ""}`,
          }))}
          renderPreview={(zoneId) => {
            const zone = catalogue.zones.find((z) => z.id === zoneId);
            if (!zone) return null;
            return (
              <div className="curator-panel">
                <p className="curator-panel__zone">{zone.label}</p>
                <p className="curator-panel__states">{zone.states}</p>
                {zone.curators.map((c) => (
                  <article key={c.id} className="curator-panel__person">
                    <div
                      className={`curator-panel__portrait${
                        c.image ? "" : " curator-panel__portrait--empty"
                      }`}
                    >
                      {c.image ? (
                        <img
                          src={`${c.image}?v=3`}
                          alt=""
                          style={{ objectPosition: c.focus ?? "center bottom" }}
                        />
                      ) : null}
                    </div>
                    <h3>{c.name}</h3>
                    {c.bio ? <p>{c.bio}</p> : null}
                  </article>
                ))}
                <Link
                  className="curator-panel__more"
                  to={`/editions/${yearId}/artworks`}
                >
                  VIEW ARTWORKS
                </Link>
              </div>
            );
          }}
        />
      ) : (
        <div className="edition-zones">
          {zones.map((zone) => (
            <section key={zone.id} className="edition-zone fig-band-9">
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
  const { catalogue } = useEditionCatalogue(yearId);
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const items = useMemo(
    () =>
      catalogue.artworks.filter((a) =>
        matchesQuery(query, a.searchText, a.title, a.venue, ...a.artists.map((x) => x.name)),
      ),
    [catalogue.artworks, query],
  );
  useStagger(root, `${view}-${query}-${catalogue.editionId}`);

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      {!catalogue.artworks.length ? (
        <Forthcoming catalogue={catalogue} kind="artworks" />
      ) : view === "list" ? (
        <CatalogueList
          rows={items.map((a) => ({
            id: a.id,
            title: a.title,
            sub: a.medium ?? `Venue : ${a.venue}`,
            href: `/editions/${yearId}/artworks/${a.id}`,
          }))}
          previewFor={(id) => {
            const a = catalogue.artworks.find((x) => x.id === id);
            if (!a) return null;
            const curators = curatorsForArtworkIn(a, catalogue.zones);
            return {
              title: a.title,
              year: a.year,
              image: a.image || a.images?.[0],
              fields: [
                { label: "Venue :", values: [a.venue] },
                { label: "Artist :", values: a.artists.map((x) => x.name) },
                ...(curators.length
                  ? [{ label: "Curator :", values: curators.map((c) => c.name) }]
                  : []),
              ],
              note: a.description,
              noteHref: `/editions/${yearId}/artworks/${a.id}`,
            };
          }}
        />
      ) : (
        <div className="edition-grid edition-grid--art">
          {items.map((a) => (
            <Link
              key={a.id}
              className="edition-card"
              to={`/editions/${yearId}/artworks/${a.id}`}
            >
              <div className="edition-card__media edition-card__media--art" aria-hidden>
                {a.image ? <img src={a.image} alt="" loading="lazy" decoding="async" /> : null}
              </div>
              <h3>{a.title}</h3>
              <p>{a.medium ? a.medium : `Venue : ${a.venue}`}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArtistsView() {
  const { yearId = "2025-26" } = useParams();
  const { catalogue } = useEditionCatalogue(yearId);
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const items = useMemo(
    () =>
      catalogue.artists.filter((a) =>
        matchesQuery(query, a.searchText, a.name, a.institution, a.zone),
      ),
    [catalogue.artists, query],
  );
  useStagger(root, `${view}-${query}-${catalogue.editionId}`);

  /* Artists have no profile page of their own — their name opens the artwork
     they're credited on. Artists with no matching artwork stay non-interactive
     rather than link to a page that doesn't exist. */
  const workForArtist = (a: { name: string }) =>
    catalogue.artworks.find((w) => w.artists.some((x) => x.name === a.name || x.name.toLowerCase() === a.name.toLowerCase()));

  return (
    <div ref={root} className="edition-view">
      <Toolbar query={query} setQuery={setQuery} view={view} setView={setView} />
      {!catalogue.artists.length ? (
        <Forthcoming catalogue={catalogue} kind="artists" />
      ) : view === "list" ? (
        <CatalogueList
          rows={items.map((a) => {
            const work = workForArtist(a);
            return {
              id: a.id,
              title: a.name,
              sub: a.institution,
              href: work ? `/editions/${yearId}/artworks/${work.id}` : undefined,
            };
          })}
          previewFor={(id) => {
            const a = catalogue.artists.find((x) => x.id === id);
            if (!a) return null;
            const work = workForArtist(a);
            const curators = work ? curatorsForArtworkIn(work, catalogue.zones) : [];
            return {
              title: work?.title ?? a.name,
              year: work?.year,
              image: work?.image || work?.images?.[0],
              fields: [
                { label: "School :", values: [a.institution] },
                ...(work ? [{ label: "Venue :", values: [work.venue] }] : [{ label: "Zone :", values: [a.zone] }]),
                { label: "Artist :", values: [a.name] },
                ...(curators.length
                  ? [{ label: "Curator :", values: curators.map((c) => c.name) }]
                  : []),
              ],
              note: work?.description,
              noteHref: work ? `/editions/${yearId}/artworks/${work.id}` : undefined,
            };
          }}
        />
      ) : (
        <div className="edition-grid edition-grid--artists">
          {items.map((a) => {
            const work = workForArtist(a);
            const body = (
              <>
                <h3>{a.name}</h3>
                <p>{a.institution}</p>
              </>
            );
            return work ? (
              <Link
                key={a.id}
                className="edition-card edition-card--artist"
                to={`/editions/${yearId}/artworks/${work.id}`}
              >
                {body}
              </Link>
            ) : (
              <div key={a.id} className="edition-card edition-card--artist edition-card--static">
                {body}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function VenueView() {
  const { yearId = "2025-26" } = useParams();
  const { catalogue } = useEditionCatalogue(yearId);
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const items = useMemo(
    () =>
      catalogue.venues.filter((v) =>
        matchesQuery(query, v.searchText, v.name, v.address, v.description),
      ),
    [catalogue.venues, query],
  );
  useStagger(root, `${query}-${catalogue.editionId}`);

  return (
    <div ref={root} className="edition-view">
      <div className="edition-toolbar fig-band-9">
        <label className="edition-search">
          <span className="sr-only">Search venues</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
          />
        </label>
      </div>
      {!catalogue.venues.length ? (
        <Forthcoming catalogue={catalogue} kind="venues" />
      ) : (
        <div className="edition-venue-rows">
          {items.map((v) => {
            const blurb =
              v.description.length > 280
                ? `${v.description.slice(0, 280).trimEnd()}…`
                : v.description;
            return (
              <article key={v.id} className="edition-venue">
                <div className="edition-venue__media">
                  {v.image ? <img src={v.image} alt="" /> : null}
                </div>
                <div className="edition-venue__copy">
                  <h3>{v.name}</h3>
                  <p>
                    {blurb}{" "}
                    <Link to={`/editions/${yearId}/venue/${v.id}`}>Read more...</Link>
                  </p>
                  <p className="edition-venue__links">
                    {v.mapUrl ? (
                      <a href={v.mapUrl} target="_blank" rel="noreferrer">
                        Google Map
                      </a>
                    ) : (
                      <span>Google Map</span>
                    )}
                    <span aria-hidden>/</span>
                    {v.tourUrl ? (
                      <a href={v.tourUrl} target="_blank" rel="noreferrer">
                        Virtual Tour
                      </a>
                    ) : (
                      <span>Virtual Tour</span>
                    )}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}