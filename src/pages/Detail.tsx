import { useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { ARTISTS, ARTWORKS, CURATORS, VENUES } from "../data/site";
import "./Detail.css";

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
        <div className="detail__hero detail-reveal" aria-hidden />
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
          <Link to={back}>BACK</Link>
          <Link to={`/editions/${yearId}/artworks/${next.id}`}>NEXT</Link>
        </div>
      </div>
    );
  }

  if (data.kind === "curator" && data.item) {
    const c = data.item;
    return (
      <div ref={root} className="detail">
        <Link to={back} className="detail-reveal">
          BACK
        </Link>
        <h1 className="detail-reveal">{c.name}</h1>
        <p className="detail-reveal">{c.region}</p>
        <p className="detail-reveal detail__body">{c.note}</p>
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
    return (
      <div ref={root} className="detail">
        <div className="detail__hero detail-reveal" aria-hidden />
        <Link to={back} className="detail-reveal">
          BACK
        </Link>
        <h1 className="detail-reveal">{v.name}</h1>
        <p className="detail-reveal">{v.address}</p>
        <p className="detail-reveal">{v.hours}</p>
        <a className="detail-reveal" href="https://maps.google.com" target="_blank" rel="noreferrer">
          Map
        </a>
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
