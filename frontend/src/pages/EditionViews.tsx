import { useEffect, useRef, useState } from "react";
import { Link, useNavigationType, useParams } from "react-router-dom";
import { artworkImages, type ArtworkCard, type CuratorCard, hasActualTourUrl } from "../data/site";
import { preloadUrl } from "../lib/preloadImages";
import { curatorsForArtworkIn, useEditionCatalogue } from "../lib/catalogue";
import { useImageParallax } from "../lib/parallax";
import { CatalogueList } from "../components/CatalogueList";
import { FormattedParagraphs, stripMarkdownLite } from "../components/FormattedText";
import { useEditionSearch } from "./EditionSearchContext";
import "./EditionViews.css";

// Cards, rows and text arrive in reading order through useReadingOrderReveal in EditionShell.

// The picture of the card being opened: it must keep downloading when the list goes away.
let openingSrc = "";

function warmArtwork(a: ArtworkCard) {
  const first = artworkImages(a)[0];
  if (!first) return;
  openingSrc = first;
  void preloadUrl(first, "high");
}

// Card pictures load as they come within a screen of view, nearest first, not dozens at once:
// a phone connection was still busy with list pictures when an artwork was opened, and the
// artwork waited behind them.
let cardObserver: IntersectionObserver | null = null;
function observeCard(img: HTMLImageElement) {
  if (typeof IntersectionObserver === "undefined") {
    img.src = img.dataset.src ?? "";
    return () => {};
  }
  cardObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLImageElement;
        cardObserver?.unobserve(el);
        if (el.dataset.src) el.src = el.dataset.src;
      });
    },
    // The screen and half a screen ahead (and a little behind), so pictures are there as they scroll in.
    { rootMargin: "25% 0px 50% 0px" },
  );
  cardObserver.observe(img);
  return () => cardObserver?.unobserve(img);
}

function CardImage({ src }: { src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    const stop = observeCard(img);
    return () => {
      stop();
      // Leaving the list: a picture still on its way is no longer wanted, unless it is the
      // one being opened. Stopping it gives the connection to the page that opens.
      if (!img.isConnected && !img.complete && img.dataset.src !== openingSrc) img.removeAttribute("src");
    };
  }, [src]);
  return <img ref={ref} data-src={src} alt="" decoding="async" />;
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

function CuratorPortrait({ curator, yearId }: { curator: CuratorCard; yearId: string }) {
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
            src={`${curator.image}?v=4`}
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
  const { view } = useEditionSearch();
  const root = useRef<HTMLDivElement>(null);

  useImageParallax(root, [view, catalogue.editionId]);

  return (
    <div ref={root} className="edition-view__content">
      {!catalogue.zones.length ? (
        <Forthcoming catalogue={catalogue} kind="curators" />
      ) : view === "list" ? (
        <CatalogueList
          pageSize={8}
          rows={catalogue.zones.map((z) => ({
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
                    <Link
                      to={`/editions/${yearId}/curators/${c.id}`}
                      className="curator-panel__person-link"
                    >
                      <div
                        className={`curator-panel__portrait${
                          c.image ? "" : " curator-panel__portrait--empty"
                        }`}
                      >
                        {c.image ? (
                          <img
                            src={`${c.image}?v=4`}
                            alt=""
                            style={{ objectPosition: c.focus ?? "center bottom" }}
                          />
                        ) : null}
                      </div>
                      <h3>{c.name}</h3>
                    </Link>
                    {c.bio ? (
                      <FormattedParagraphs text={c.bio} className="curator-panel__bio" />
                    ) : null}
                  </article>
                ))}
                <Link
                  className="curator-panel__more"
                  to={`/editions/${yearId}/curators/${zone.curators[0]?.id ?? ""}`}
                >
                  Know more…
                </Link>
              </div>
            );
          }}
        />
      ) : (
        <div className="edition-zones">
          {catalogue.zones.map((zone) => (
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

// Cards drawn when the Artworks tab opens: two screens of cards on any device. The rest are
// added a few at a time in the frames after, so the tab appears at once instead of waiting for
// all 85 cards to be built and laid out.
const FIRST_CARDS = 24;
const MORE_CARDS = 16;

function useCardsShown(total: number) {
  // Coming back (the back button) draws every card at once, so the page can return to where
  // it was scrolled.
  const back = useNavigationType() === "POP";
  const [shown, setShown] = useState(back ? Infinity : FIRST_CARDS);
  useEffect(() => {
    if (shown >= total) return;
    let timer = 0;
    // After the frame that shows the first cards has been painted.
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => setShown((n) => n + MORE_CARDS), 0);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [shown, total]);
  return shown;
}

export function ArtworksView() {
  const { yearId = "2025-26" } = useParams();
  const { catalogue } = useEditionCatalogue(yearId);
  const { view } = useEditionSearch();
  const root = useRef<HTMLDivElement>(null);
  const shown = useCardsShown(catalogue.artworks.length);


  return (
    <div ref={root} className="edition-view__content">
      {!catalogue.artworks.length ? (
        <Forthcoming catalogue={catalogue} kind="artworks" />
      ) : view === "list" ? (
        <CatalogueList
          rows={catalogue.artworks.map((a) => ({
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
                { label: "Venue", values: [a.venue] },
                { label: "Artist", values: a.artists.map((x) => x.name) },
                ...(curators.length
                  ? [{ label: "Curator", values: curators.map((c) => c.name) }]
                  : []),
              ],
              note: a.description,
              noteHref: `/editions/${yearId}/artworks/${a.id}`,
            };
          }}
        />
      ) : (
        <div className="edition-grid edition-grid--art">
          {catalogue.artworks.slice(0, shown).map((a) => (
            <Link
              key={a.id}
              className="edition-card"
              to={`/editions/${yearId}/artworks/${a.id}`}
              // The finger touching (or the pointer resting on) a card starts its picture, a
              // moment before the tap completes.
              onPointerDown={() => warmArtwork(a)}
              onPointerEnter={() => warmArtwork(a)}
            >
              <div className="edition-card__media edition-card__media--art" aria-hidden>
                {a.image ? <CardImage src={a.image} /> : null}
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
  const { view } = useEditionSearch();
  const root = useRef<HTMLDivElement>(null);


  const workForArtist = (a: { name: string }) =>
    catalogue.artworks.find((w) =>
      w.artists.some((x) => x.name === a.name || x.name.toLowerCase() === a.name.toLowerCase()),
    );

  return (
    <div ref={root} className="edition-view__content">
      {!catalogue.artists.length ? (
        <Forthcoming catalogue={catalogue} kind="artists" />
      ) : view === "list" ? (
        <CatalogueList
          rows={catalogue.artists.map((a) => {
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
                { label: "School", values: [a.institution] },
                ...(work
                  ? [{ label: "Venue", values: [work.venue] }]
                  : [{ label: "Zone", values: [a.zone] }]),
                { label: "Artist", values: [a.name] },
                ...(curators.length
                  ? [{ label: "Curator", values: curators.map((c) => c.name) }]
                  : []),
              ],
              note: work?.description,
              noteHref: work ? `/editions/${yearId}/artworks/${work.id}` : undefined,
            };
          }}
        />
      ) : (
        <div className="edition-grid edition-grid--artists">
          {catalogue.artists.map((a) => {
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
  const { view } = useEditionSearch();
  const root = useRef<HTMLDivElement>(null);


  return (
    <div ref={root} className="edition-view__content">
      {!catalogue.venues.length ? (
        <Forthcoming catalogue={catalogue} kind="venues" />
      ) : view === "list" ? (
        <CatalogueList
          rows={catalogue.venues.map((v) => ({
            id: v.id,
            title: v.name,
            sub: v.address,
            href: `/editions/${yearId}/venue/${v.id}`,
          }))}
          previewFor={(id) => {
            const v = catalogue.venues.find((x) => x.id === id);
            if (!v) return null;
            return {
              title: v.name,
              image: v.image,
              fields: [{ label: "Address", values: [v.address] }],
              note: v.description,
              noteHref: `/editions/${yearId}/venue/${v.id}`,
            };
          }}
        />
      ) : (
        <div className="edition-venue-rows">
          {catalogue.venues.map((v) => {
            const plain = stripMarkdownLite(v.description);
            const blurb =
              plain.length > 280 ? `${plain.slice(0, 280).trimEnd()}…` : plain;
            return (
              <article key={v.id} className="edition-venue">
                <Link
                  to={`/editions/${yearId}/venue/${v.id}`}
                  className="edition-venue__media"
                  tabIndex={-1}
                  aria-label={v.name}
                >
                  {v.image ? <img src={v.image} alt={v.name} /> : null}
                </Link>
                <div className="edition-venue__copy">
                  <Link to={`/editions/${yearId}/venue/${v.id}`}>
                    <h3>{v.name}</h3>
                  </Link>
                  <p>{blurb}</p>
                  <Link className="edition-venue__more" to={`/editions/${yearId}/venue/${v.id}`}>
                    Read more...
                  </Link>
                  {v.mapUrl || hasActualTourUrl(v.tourUrl, v.mapUrl) ? (
                    <p className="edition-venue__links">
                      {v.mapUrl ? (
                        <a href={v.mapUrl} target="_blank" rel="noreferrer">
                          Google Map
                        </a>
                      ) : null}
                      {v.mapUrl && hasActualTourUrl(v.tourUrl, v.mapUrl) ? (
                        <span aria-hidden>/</span>
                      ) : null}
                      {hasActualTourUrl(v.tourUrl, v.mapUrl) ? (
                        <a href={v.tourUrl} target="_blank" rel="noreferrer">
                          Virtual Tour
                        </a>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
