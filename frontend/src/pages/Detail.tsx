import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { ArtworkDetailBody } from "../components/ArtworkDetailBody";
import { venueImages } from "../data/site";
import {
  artworksForZoneIn,
  findCard,
  useEditionCatalogue,
} from "../lib/catalogue";
import "./Detail.css";

export function Detail() {
  const { yearId = "2025-26", kindSeg = "artworks", id = "" } = useParams();
  const { catalogue } = useEditionCatalogue(yearId);
  const root = useRef<HTMLDivElement>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    setHeroIndex(0);
  }, [id, kindSeg]);

  const data = useMemo(() => {
    if (kindSeg === "artworks")
      return { kind: "artwork" as const, item: findCard(catalogue.artworks, id) };
    if (kindSeg === "curators")
      return { kind: "curator" as const, item: findCard(catalogue.curators, id) };
    if (kindSeg === "artists")
      return { kind: "artist" as const, item: findCard(catalogue.artists, id) };
    if (kindSeg === "venue")
      return { kind: "venue" as const, item: findCard(catalogue.venues, id) };
    return { kind: "unknown" as const, item: undefined };
  }, [kindSeg, id, catalogue]);

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

  if (data.kind === "artwork" && data.item) {
    const a = data.item;
    const idx = catalogue.artworks.findIndex((x) => x.id === a.id);
    const next =
      idx >= 0 && catalogue.artworks.length
        ? catalogue.artworks[(idx + 1) % catalogue.artworks.length]
        : undefined;

    return (
      <div ref={root} className="detail">
        <ArtworkDetailBody artwork={a} />

        <div className="fig-grid detail__nav">
          <Link className="fig-c1-3 detail__back" to={back}>
            BACK
          </Link>
          <CtaLink
            className="detail__next"
            variant="next"
            to={`/editions/${yearId}/artworks/${(next ?? a).id}`}
            lines={["NEXT"]}
          />
        </div>
      </div>
    );
  }

  if (data.kind === "curator" && data.item) {
    const c = data.item;
    const zone = catalogue.zones.find((z) => z.curators.some((x) => x.id === c.id));
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

        {zone && artworksForZoneIn(catalogue.artworks, zone.id).length ? (
          <div className="fig-grid detail__section">
            <p className="fig-label fig-subheading detail__label detail-reveal">Artworks</p>
            <div className="fig-c4-12 fig-sub-3 detail__cards detail-reveal">
              {artworksForZoneIn(catalogue.artworks, zone.id).map((a) => (
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

  if (data.kind === "venue" && data.item) {
    const v = data.item;
    const slides = venueImages(v);
    const slide = slides[Math.min(heroIndex, Math.max(slides.length - 1, 0))];
    const venueWorks = catalogue.artworks.filter((a) => a.venue === v.name || a.venue === v.id);

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
