import { useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import {
  ARTISTS,
  ARTWORKS,
  CURATOR_ZONES,
  CURATORS,
  VENUES,
  type ArtworkCard,
} from "../data/site";
import "./Detail.css";

function normalizeVenueKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Artworks explicitly curated by this person; falls back to other works at
 * the same venue(s) when the curator↔artwork link in the data is sparse. */
function getCuratorArtworks(curatorName: string): ArtworkCard[] {
  const direct = ARTWORKS.filter((a) => a.curators?.includes(curatorName));
  const venues = new Set(direct.map((a) => a.venue));
  const fallback = ARTWORKS.filter((a) => !direct.includes(a) && venues.has(a.venue));
  return [...direct, ...fallback].slice(0, 3);
}

function getVenueArtworks(venueName: string): ArtworkCard[] {
  const key = normalizeVenueKey(venueName);
  return ARTWORKS.filter((a) => normalizeVenueKey(a.venue) === key);
}

function ArrowIcon({ className }: { className?: string }) {
  return <img className={className} src="/icons/explore.svg" alt="" width={14} height={24} />;
}

function ArtworkCardTile({ artwork, yearId }: { artwork: ArtworkCard; yearId: string }) {
  return (
    <Link to={`/editions/${yearId}/artworks/${artwork.id}`} className="detail__artwork-card">
      {artwork.image ? (
        <img className="detail__artwork-card-img" src={artwork.image} alt={artwork.title} />
      ) : (
        <div className="detail__artwork-card-img detail__artwork-card-img--placeholder" aria-hidden />
      )}
      <h3 className="detail__artwork-card-title">{artwork.title}</h3>
      <dl className="detail__artwork-card-meta">
        <div>
          <dt>Venue :</dt>
          <dd>{artwork.venue}</dd>
        </div>
        {artwork.artists.length > 0 ? (
          <div>
            <dt>Artist :</dt>
            <dd>
              {artwork.artists.slice(0, 2).map((artist) => (
                <span key={artist.name}>{artist.name}</span>
              ))}
              {artwork.artists.length > 2 ? <span className="detail__artwork-card-more">and more...</span> : null}
            </dd>
          </div>
        ) : null}
      </dl>
      <span className="detail__artwork-card-link">Know more...</span>
    </Link>
  );
}

function ViewMoreLink({ to }: { to: string }) {
  return (
    <Link to={to} className="fig-link-more detail__view-more">
      <span>
        View
        <br />
        MORE
      </span>
      <ArrowIcon className="detail__view-more-icon" />
    </Link>
  );
}

export function Detail() {
  const { yearId = "2025-26", kindSeg = "artworks", id = "" } = useParams();
  const root = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    if (kindSeg === "artworks") return { kind: "artwork" as const, item: ARTWORKS.find((a) => a.id === id) };
    if (kindSeg === "curators") return { kind: "curator" as const, item: CURATORS.find((c) => c.id === id) };
    if (kindSeg === "artists") return { kind: "artist" as const, item: ARTISTS.find((a) => a.id === id) };
    if (kindSeg === "venue") return { kind: "venue" as const, item: VENUES.find((v) => v.id === id) };
    return { kind: "unknown" as const, item: undefined };
  }, [kindSeg, id]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".detail-reveal", {
        autoAlpha: 0,
        x: 16,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: root, dependencies: [id, kindSeg] }
  );

  const back = `/editions/${yearId}/${kindSeg}`;

  if (!data.item) {
    return (
      <div className="detail">
        <Link to={back}>BACK</Link>
        <p>Entry not found</p>
      </div>
    );
  }

  if (data.kind === "artwork" && data.item) {
    const a = data.item;
    const idx = ARTWORKS.findIndex((x) => x.id === a.id);
    const next = ARTWORKS[(idx + 1) % ARTWORKS.length];
    return (
      <div ref={root} className="detail">
        <div className="detail__hero detail-reveal">
          {a.heroImage ? (
            <img className="detail__hero-img" src={a.heroImage} alt={a.title} />
          ) : (
            <div className="detail__hero-fallback" aria-hidden />
          )}
        </div>
        <div className="detail__grid">
          <p className="detail__label detail-reveal">Artworks</p>
          <div className="detail-reveal">
            <div className="detail__title-row">
              <h1>{a.title}</h1>
              <span>{a.year}</span>
            </div>
            <dl className="detail__meta">
              <div>
                <dt>Venue :</dt>
                <dd>{a.venue}</dd>
              </div>
              <div>
                <dt>Dimensions :</dt>
                <dd>{a.dimensions}</dd>
              </div>
              <div>
                <dt>Materials :</dt>
                <dd>
                  {a.materials.map((m) => (
                    <p key={m}>{m}</p>
                  ))}
                </dd>
              </div>
              {a.curators && a.curators.length > 0 ? (
                <div>
                  <dt>Curators :</dt>
                  <dd>{a.curators.join(" and ")}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <p className="detail__label detail-reveal">Description</p>
          <p className="detail-reveal detail__body">{a.description}</p>
          <p className="detail__label detail-reveal">Artists</p>
          <div className="detail__artists detail-reveal">
            {a.artists.map((artist) => (
              <div key={artist.name}>
                <strong>{artist.name}</strong>
                <span>{artist.institution}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="detail__nav">
          <Link to={back} className="detail-reveal">
            BACK
          </Link>
          <Link to={`/editions/${yearId}/artworks/${next.id}`} className="detail__nav-next detail-reveal">
            NEXT
            <ArrowIcon className="detail__view-more-icon" />
          </Link>
        </div>
      </div>
    );
  }

  if (data.kind === "curator" && data.item) {
    const c = data.item;
    const zone = CURATOR_ZONES.find((z) => z.curators.some((cur) => cur.id === c.id));
    const relatedArtworks = getCuratorArtworks(c.name);
    return (
      <div ref={root} className="detail">
        <div className="detail__grid">
          <div className="detail__portrait detail-reveal">
            {c.image ? (
              <img src={c.image} alt={c.name} style={c.focus ? { objectPosition: c.focus } : undefined} />
            ) : (
              <div className="detail__portrait-fallback" aria-hidden />
            )}
          </div>
          <div className="detail__curator-head detail-reveal">
            <div className="detail__curator-main">
              <h1>{c.name}</h1>
              <p className="detail__body">{c.bio ?? c.note}</p>
            </div>
            {zone ? (
              <div className="detail__aside">
                <div className="detail__aside-group">
                  <p className="detail__aside-label">{zone.label.toUpperCase()} :</p>
                  <p>{zone.states}</p>
                </div>
                {zone.assistants && zone.assistants.length > 0 ? (
                  <div className="detail__aside-group">
                    <p className="detail__aside-label">
                      Curatorial Assistant{zone.assistants.length > 1 ? "s" : ""} :
                    </p>
                    {zone.assistants.map((assistant) => (
                      <p key={assistant.id}>{assistant.name}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {zone?.curatorialNote ? (
            <>
              <p className="detail__label detail-reveal">Curatorial note</p>
              <div className="detail-reveal">
                <h2 className="detail__section-title">{zone.curatorialNote.title}</h2>
                <p className="detail__body">{zone.curatorialNote.text}</p>
              </div>
            </>
          ) : null}

          <p className="detail__label detail-reveal">Artworks</p>
          <div className="detail-reveal">
            {relatedArtworks.length > 0 ? (
              <>
                <div className="detail__artwork-grid">
                  {relatedArtworks.map((artwork) => (
                    <ArtworkCardTile key={artwork.id} artwork={artwork} yearId={yearId} />
                  ))}
                </div>
                <ViewMoreLink to={`/editions/${yearId}/artworks`} />
              </>
            ) : (
              <p className="detail__body">No linked artworks yet.</p>
            )}
          </div>
        </div>
        <div className="detail__nav">
          <Link to={back} className="detail-reveal">
            BACK
          </Link>
        </div>
      </div>
    );
  }

  if (data.kind === "artist" && data.item) {
    const a = data.item;
    return (
      <div ref={root} className="detail">
        <Link to={back} className="detail-reveal">
          BACK
        </Link>
        <h1 className="detail-reveal">{a.name}</h1>
        <p className="detail-reveal">{a.institution}</p>
        <p className="detail-reveal">{a.zone}</p>
      </div>
    );
  }

  if (data.kind === "venue" && data.item) {
    const v = data.item;
    const relatedArtworks = getVenueArtworks(v.name);
    return (
      <div ref={root} className="detail">
        <div className="detail__venue-head detail-reveal">
          <div className="detail__venue-media">
            {v.heroImage ? (
              <img src={v.heroImage} alt={v.name} />
            ) : (
              <div className="detail__hero-fallback" aria-hidden />
            )}
          </div>
          <div className="detail__venue-info">
            <h1>{v.name}</h1>
            <p className="detail__venue-address">{v.address}</p>
            <div className="detail__venue-links">
              <a href={v.mapUrl} target="_blank" rel="noreferrer">
                Google Map
              </a>
              <span aria-hidden>/</span>
              <a href={v.virtualTourUrl} target="_blank" rel="noreferrer">
                Virtual Tour
              </a>
            </div>
            {v.history ? (
              <p className="detail__body detail__venue-history">
                {v.history}
                {v.historyTruncated ? (
                  <>
                    {" "}
                    <a className="detail__read-more" href={v.mapUrl} target="_blank" rel="noreferrer">
                      Read more...
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="detail__grid">
          <p className="detail__label detail-reveal">Artworks</p>
          <div className="detail-reveal">
            {relatedArtworks.length > 0 ? (
              <>
                <div className="detail__artwork-grid">
                  {relatedArtworks.map((artwork) => (
                    <ArtworkCardTile key={artwork.id} artwork={artwork} yearId={yearId} />
                  ))}
                </div>
                <ViewMoreLink to={`/editions/${yearId}/artworks`} />
              </>
            ) : (
              <p className="detail__body">No artworks linked to this venue yet.</p>
            )}
          </div>
        </div>

        <div className="detail__nav">
          <Link to={back} className="detail-reveal">
            BACK
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="detail">
      <Link to={back}>BACK</Link>
      <p>Entry not found</p>
    </div>
  );
}
