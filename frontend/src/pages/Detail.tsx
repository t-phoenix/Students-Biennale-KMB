import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import {
  ARTISTS,
  ARTWORKS,
  CURATOR_ZONES,
  CURATORS,
  VENUES,
  artworkImages,
  artworksForZone,
  curatorsForArtwork,
  venueImages,
} from "../data/site";
import "./Detail.css";

export function Detail() {
  const { yearId = "2025-26", kindSeg = "artworks", id = "" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    setHeroIndex(0);
  }, [id, kindSeg]);

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
        <div className="fig-grid detail__section">
          <Link className="fig-c1-3" to={back}>
            BACK
          </Link>
          <p className="fig-c4-12">Entry not found</p>
        </div>
      </div>
    );
  }

  /* Artwork Page — Figma 1:3: full-bleed carousel, label cols 1-3, title cols 4-9,
     year cols 10-12, metadata cols 4-12, description, artists 3-up, NEXT. */
  if (data.kind === "artwork" && data.item) {
    const a = data.item;
    const idx = ARTWORKS.findIndex((x) => x.id === a.id);
    const next = ARTWORKS[(idx + 1) % ARTWORKS.length];
    const slides = artworkImages(a);
    const slide = slides[Math.min(heroIndex, Math.max(slides.length - 1, 0))];
    const curated = curatorsForArtwork(a);

    return (
      <div ref={root} className="detail" key={a.id}>
        <div className="detail__hero detail-reveal">
          {slide ? (
            <img src={slide} alt="" className="detail__hero-img" />
          ) : (
            <div className="detail__hero-fallback" aria-hidden />
          )}
          {slides.length > 1 ? (
            <div className="detail__hero-dots" role="tablist" aria-label="Artwork images">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === heroIndex}
                  className={i === heroIndex ? "is-active" : undefined}
                  onClick={() => setHeroIndex(i)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="fig-grid detail__section">
          <p className="fig-label fig-subheading detail__label detail-reveal">Artworks</p>
          <h1 className="fig-c4-9 detail__title detail-reveal">{a.title}</h1>
          <span className="fig-c10-12 detail__year detail-reveal">{a.year}</span>

          <dl className="fig-c4-12 detail__meta detail-reveal">
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

        <div className="fig-grid detail__section">
          <p className="fig-label detail__label detail-reveal">Description</p>
          <div className="fig-c4-9 fig-body detail-reveal detail__desc">
            {a.description.split(/\n\n+/).map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
          </div>
        </div>

        <div className="fig-grid detail__section">
          <p className="fig-label fig-subheading detail__label detail-reveal">Artists</p>
          <div className="fig-c4-12 fig-sub-3 detail__artists detail-reveal">
            {a.artists.map((artist) => (
              <div key={artist.name}>
                <strong>{artist.name}</strong>
                <span>{artist.institution}</span>
              </div>
            ))}
          </div>
          {curated.length ? (
            <p className="fig-c4-6 detail__curated-by detail-reveal">
              <strong>Curated by</strong>
              {curated.map((c) => c.name).join(" and ")}
            </p>
          ) : null}
        </div>

        <div className="fig-grid detail__nav">
          <Link className="fig-c1-3 detail__back" to={back}>
            BACK
          </Link>
          <CtaLink
            className="detail__next"
            variant="next"
            to={`/editions/${yearId}/artworks/${next.id}`}
            lines={["NEXT"]}
          />
        </div>
      </div>
    );
  }

  /* Curators Page — Figma 1:2484. */
  if (data.kind === "curator" && data.item) {
    const c = data.item;
    const zone = CURATOR_ZONES.find((z) => z.curators.some((x) => x.id === c.id));
    const members = zone ? [c, ...zone.curators.filter((x) => x.id !== c.id)] : [c];

    return (
      <div ref={root} className="detail">
        {members.map((member, i) => (
          <div
            key={member.id}
            className={`fig-grid ${i === 0 ? "detail__section" : "detail__section--tight"}`}
          >
            <div
              className={`detail__portrait fig-c1-3 detail-reveal${
                member.image ? "" : " detail__portrait--empty"
              }`}
            >
              {member.image ? (
                <img
                  src={`${member.image}?v=3`}
                  alt=""
                  style={{ objectPosition: member.focus ?? "center bottom" }}
                />
              ) : null}
            </div>

            <div className="fig-c4-9 detail__curator-copy detail-reveal">
              {i === 0 ? (
                <h1 className="detail__title">{member.name}</h1>
              ) : (
                <h2 className="detail__title">{member.name}</h2>
              )}
              <p className="fig-body">{member.bio ?? member.note}</p>
            </div>

            {i === 0 && zone ? (
              <aside className="fig-c10-12 detail__zone detail-reveal">
                <h2>{zone.label}</h2>
                <p>{zone.states}</p>
                {zone.curatorialAssistant ? (
                  <p className="detail__zone-assistant">
                    <span>Curatorial Assistant :</span>
                    {zone.curatorialAssistant}
                  </p>
                ) : null}
              </aside>
            ) : null}
          </div>
        ))}

        {zone?.noteBody ? (
          <div className="fig-grid detail__section">
            <p className="fig-label detail__label detail-reveal">Curatorial note</p>
            <div className="fig-c4-9 detail-reveal">
              {zone.noteTitle ? (
                <h2 className="detail__note-title">{zone.noteTitle}</h2>
              ) : null}
              <p className="fig-body">{zone.noteBody}</p>
            </div>
          </div>
        ) : null}

        {zone && artworksForZone(zone.id).length ? (
          <div className="fig-grid detail__section">
            <p className="fig-label fig-subheading detail__label detail-reveal">Artworks</p>
            <div className="fig-c4-12 fig-sub-3 detail__cards detail-reveal">
              {artworksForZone(zone.id).map((a) => (
                <Link key={a.id} to={`/editions/${yearId}/artworks/${a.id}`}>
                  {a.image ? (
                    <span className="detail__cards-media">
                      <img src={a.image} alt="" />
                    </span>
                  ) : (
                    <span className="detail__cards-media" aria-hidden />
                  )}
                  <strong>{a.title}</strong>
                  <span>Venue : {a.venue}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="fig-grid detail__nav">
          <Link className="fig-c1-3 detail__back" to={back}>
            BACK
          </Link>
          <CtaLink
            className="detail__next"
            to={`/editions/${yearId}/artworks`}
            lines={["View", "MORE"]}
            spacing={["0.26em", "0.135em"]}
          />
        </div>
      </div>
    );
  }

  if (data.kind === "artist" && data.item) {
    const a = data.item;
    return (
      <div ref={root} className="detail">
        <div className="fig-grid detail__section">
          <p className="fig-label fig-subheading detail__label detail-reveal">Artists</p>
          <h1 className="fig-c4-9 detail__title detail-reveal">{a.name}</h1>
          <p className="fig-c4-9 fig-body detail-reveal">{a.institution}</p>
          <p className="fig-c4-9 fig-body detail-reveal">{a.zone}</p>
        </div>
        <div className="fig-grid detail__nav">
          <Link className="fig-c1-3 detail__back" to={back}>
            BACK
          </Link>
        </div>
      </div>
    );
  }

  /* Venues page — Figma 1:1428: hero cols 1-7, name/links/description cols 8-12,
     then artworks at this venue on cols 4-12. */
  if (data.kind === "venue" && data.item) {
    const v = data.item;
    const slides = venueImages(v);
    const slide = slides[Math.min(heroIndex, Math.max(slides.length - 1, 0))];
    const venueWorks = ARTWORKS.filter((a) => a.venue === v.name);

    return (
      <div ref={root} className="detail" key={v.id}>
        <div className="fig-grid detail__section">
          <div className="detail__venue-hero fig-c1-7 detail-reveal">
            {slide ? <img src={slide} alt="" /> : null}
            {slides.length > 1 ? (
              <div className="detail__hero-dots detail__hero-dots--venue" role="tablist" aria-label="Venue images">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === heroIndex}
                    className={i === heroIndex ? "is-active" : undefined}
                    onClick={() => setHeroIndex(i)}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <div className="fig-c8-12 detail__venue-info detail-reveal">
            <h1>{v.name}</h1>
            <p className="detail__venue-links">
              {v.mapUrl ? (
                <a href={v.mapUrl} target="_blank" rel="noreferrer">
                  Google Map
                </a>
              ) : null}
              {v.tourUrl ? (
                <a href={v.tourUrl} target="_blank" rel="noreferrer">
                  Virtual Tour
                </a>
              ) : null}
            </p>
            <p className="fig-body detail__venue-desc">{v.description}</p>
          </div>
        </div>

        {venueWorks.length ? (
          <div className="fig-grid detail__section">
            <p className="fig-label fig-subheading detail__label detail-reveal">Artworks</p>
            <div className="fig-c4-12 fig-sub-3 detail__cards detail-reveal">
              {venueWorks.slice(0, 3).map((a) => (
                <Link key={a.id} to={`/editions/${yearId}/artworks/${a.id}`}>
                  {a.image ? (
                    <span className="detail__cards-media">
                      <img src={a.image} alt="" />
                    </span>
                  ) : (
                    <span className="detail__cards-media" aria-hidden />
                  )}
                  <strong>{a.title}</strong>
                  <span>
                    {a.artists.map((x) => x.name).join(", ")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="fig-grid detail__nav">
          <Link className="fig-c1-3 detail__back" to={back}>
            BACK
          </Link>
          <CtaLink
            className="detail__next"
            to={`/editions/${yearId}/artworks`}
            lines={["View", "MORE"]}
            spacing={["0.26em", "0.135em"]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="detail">
      <div className="fig-grid detail__section">
        <Link className="fig-c1-3" to={back}>
          BACK
        </Link>
        <p className="fig-c4-12">Entry not found</p>
      </div>
    </div>
  );
}
