import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { BrandArrow } from "../components/BrandArrow";
import { ArtworkDetailBody } from "../components/ArtworkDetailBody";
import { HighlightText } from "../components/HighlightText";
import { FormattedParagraphs } from "../components/FormattedText";
import { ImageCrossfadeStack } from "../components/ImageCrossfadeStack";
import { MetaGrid, MetaRow } from "../components/MetaGrid";
import { venueImages, RAZA_SCHOLAR_ARTWORKS, RAZA_SCHOLARS } from "../data/site";
import { prefetchNextArtwork } from "../lib/predictivePrefetch";
import {
  artworkDetailPath,
  artworksForNavScope,
  artworksForVenueIn,
  artworksForZoneIn,
  findCard,
  parseArtworkNavScope,
  useEditionCatalogue,
} from "../lib/catalogue";
import "./Detail.css";

export function Detail() {
  const { yearId = "2025-26", kindSeg = "artworks", id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get("highlight") ?? "";
  const { catalogue } = useEditionCatalogue(yearId);
  const root = useRef<HTMLDivElement>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    setHeroIndex(0);
  }, [id, kindSeg]);

  const data = useMemo(() => {
    if (kindSeg === "artworks")
      return {
        kind: "artwork" as const,
        item: findCard(catalogue.artworks, id) ?? findCard(RAZA_SCHOLAR_ARTWORKS, id),
      };
    if (kindSeg === "curators")
      return { kind: "curator" as const, item: findCard(catalogue.curators, id) };
    if (kindSeg === "artists") {
      const item = findCard(catalogue.artists, id);
      if (item) return { kind: "artist" as const, item };
      const scholar = RAZA_SCHOLARS.find((s) => s.id === id);
      if (scholar) {
        return {
          kind: "artist" as const,
          item: {
            id: scholar.id,
            name: scholar.name,
            institution: "",
            zone: "",
          },
        };
      }
      return { kind: "artist" as const, item: undefined };
    }
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

  useEffect(() => {
    const q = highlight.trim();
    if (!q || kindSeg === "artworks") return;
    const timer = window.setTimeout(() => {
      const mark = root.current?.querySelector("mark");
      mark?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [highlight, id, kindSeg]);

  const artworkNav = useMemo(
    () => parseArtworkNavScope(searchParams, catalogue.zones),
    [searchParams, catalogue.zones],
  );

  const artworkNavList = useMemo(
    () => artworksForNavScope(catalogue.artworks, catalogue.venues, artworkNav),
    [catalogue.artworks, catalogue.venues, artworkNav],
  );

  useEffect(() => {
    if (kindSeg !== "artworks" || !id) return;
    prefetchNextArtwork(artworkNavList, id);
  }, [kindSeg, id, artworkNavList]);

  const back = useMemo(() => {
    if (kindSeg === "artworks" && artworkNav.kind === "curator") {
      return `/editions/${yearId}/curators/${artworkNav.curatorId}`;
    }
    if (kindSeg === "artworks" && artworkNav.kind === "venue") {
      return `/editions/${yearId}/venue/${artworkNav.venueId}`;
    }
    return `/editions/${yearId}/${kindSeg}`;
  }, [kindSeg, yearId, artworkNav]);

  if (!data.item) {
    return (
      <div className="detail">
        <div className="fig-grid detail__section">
          <Link className="fig-c1-3 detail__back" to={back}>
            <BrandArrow direction="left" />
            <span>BACK</span>
          </Link>
          <p className="fig-c4-12">Entry not found</p>
        </div>
      </div>
    );
  }

  if (data.kind === "artwork" && data.item) {
    const a = data.item;
    const list =
      artworkNavList.length > 0
        ? artworkNavList
        : catalogue.artworks.filter((x) => x.id === a.id);
    const idx = list.findIndex((x) => x.id === a.id);
    const next =
      idx >= 0 && list.length > 1 ? list[(idx + 1) % list.length] : undefined;

    return (
      <div ref={root} className="detail">
        <ArtworkDetailBody artwork={a} highlightQuery={highlight} />

        <div className="fig-grid detail__nav">
          <Link className="fig-c1-3 detail__back" to={back}>
            <BrandArrow direction="left" />
            <span>BACK</span>
          </Link>
          {next ? (
            <CtaLink
              className="detail__next"
              variant="next"
              to={artworkDetailPath(yearId, next.id, searchParams, artworkNav)}
              lines={["NEXT"]}
            />
          ) : null}
        </div>
      </div>
    );
  }

  if (data.kind === "curator" && data.item) {
    const c = data.item;
    const zoneIndex = catalogue.zones.findIndex((z) => z.curators.some((x) => x.id === c.id));
    const zone = zoneIndex >= 0 ? catalogue.zones[zoneIndex] : undefined;
    const nextZone =
      zoneIndex >= 0 && zoneIndex < catalogue.zones.length - 1
        ? catalogue.zones[zoneIndex + 1]
        : undefined;
    const nextCurator = nextZone?.curators[0];
    const members = zone ? [c, ...zone.curators.filter((x) => x.id !== c.id)] : [c];
    // Zone 6 (and any future dual-note zones): show every curator individual note.
    // Otherwise fall back to the shared zone note.
    const curatorNotes = (zone?.curators ?? [])
      .filter((member) => Boolean(member.noteBody?.trim()))
      .map((member) => ({
        id: member.id,
        title: member.noteTitle,
        attribution: member.noteAttribution,
        body: member.noteBody as string,
      }));
    const notesToShow =
      curatorNotes.length > 0
        ? curatorNotes
        : zone?.noteBody?.trim()
          ? [
              {
                id: zone.id,
                title: zone.noteTitle,
                attribution: undefined as string | undefined,
                body: zone.noteBody,
              },
            ]
          : c.noteBody?.trim()
            ? [
                {
                  id: c.id,
                  title: c.noteTitle,
                  attribution: c.noteAttribution,
                  body: c.noteBody,
                },
              ]
            : [];

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
                <h1 className="detail__title">
                  <HighlightText text={member.name} query={highlight} />
                </h1>
              ) : (
                <h2 className="detail__title">
                  <HighlightText text={member.name} query={highlight} />
                </h2>
              )}
              {member.bio?.trim() || member.note?.trim() ? (
                <FormattedParagraphs
                  text={member.bio?.trim() || member.note || ""}
                  paragraphClassName="fig-body"
                  className="detail__curator-bio"
                />
              ) : null}
            </div>

            {i === 0 && zone ? (
              <aside className="fig-c10-12 detail__zone detail-reveal">
                <h2>{zone.label}</h2>
                <p>{zone.states}</p>
                {zone.curatorialAssistant ? (
                  <MetaGrid className="detail__zone-assistant meta-grid--compact meta-grid--tight-colon">
                    <MetaRow label="Curatorial Assistant" value={zone.curatorialAssistant} />
                  </MetaGrid>
                ) : null}
              </aside>
            ) : null}
          </div>
        ))}

        {notesToShow.map((note, noteIndex) => (
          <div key={note.id} className="fig-grid detail__section">
            <p className="fig-label detail__label detail-reveal">
              {noteIndex === 0 ? "Curatorial note" : "\u00A0"}
            </p>
            <div className="fig-c4-9 detail-reveal">
              {note.title ? (
                <h2 className="detail__note-title">{note.title}</h2>
              ) : null}
              {note.attribution ? (
                <p className="detail__note-attribution">{note.attribution}</p>
              ) : null}
              <FormattedParagraphs
                text={note.body}
                paragraphClassName="fig-body"
                className="detail__note-body"
              />
            </div>
          </div>
        ))}

        {zone && artworksForZoneIn(catalogue.artworks, zone.id).length ? (
          <div className="fig-grid detail__section">
            <p className="fig-label fig-subheading detail__label detail-reveal">Artworks</p>
            <div className="fig-c4-12 fig-sub-3 detail__cards detail-reveal">
              {artworksForZoneIn(catalogue.artworks, zone.id).map((a) => (
                <Link
                  key={a.id}
                  to={artworkDetailPath(yearId, a.id, searchParams, {
                    kind: "curator",
                    curatorId: c.id,
                    zoneId: zone.id,
                  })}
                >
                  {a.image ? (
                    <span className="detail__cards-media">
                      <img src={a.image} alt="" />
                    </span>
                  ) : (
                    <span className="detail__cards-media" aria-hidden />
                  )}
                  <strong>{a.title}</strong>
                  {a.venue?.trim() ? (
                    <MetaGrid className="detail__card-venue meta-grid--compact meta-grid--tight-colon">
                      <MetaRow label="Venue" value={a.venue} />
                    </MetaGrid>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="fig-grid detail__nav">
          <Link className="fig-c1-3 detail__back" to={back}>
            <BrandArrow direction="left" />
            <span>BACK</span>
          </Link>
          {nextCurator ? (
            <CtaLink
              className="detail__next"
              variant="next"
              to={`/editions/${yearId}/curators/${nextCurator.id}`}
              lines={["NEXT"]}
              ariaLabel={`Next zone: ${nextZone?.label ?? nextCurator.name}`}
            />
          ) : (
            <CtaLink
              className="detail__next"
              to={`/editions/${yearId}/artworks`}
              lines={["View", "MORE"]}
              spacing={["0.26em", "0.135em"]}
            />
          )}
        </div>
      </div>
    );
  }

  if (data.kind === "venue" && data.item) {
    const v = data.item;
    const slides = venueImages(v);
    const venueWorks = artworksForVenueIn(catalogue.artworks, v);

    return (
      <div ref={root} className="detail" key={v.id}>
        <div className="fig-grid detail__section">
          <div className="detail__venue-hero fig-c1-7 detail-reveal">
            {slides.length ? (
              <ImageCrossfadeStack
                images={slides}
                index={heroIndex}
                imageClassName="detail__venue-hero-img"
              />
            ) : null}
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
            <h1>
              <HighlightText text={v.name} query={highlight} />
            </h1>
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
                <Link
                  key={a.id}
                  to={artworkDetailPath(yearId, a.id, searchParams, {
                    kind: "venue",
                    venueId: v.id,
                  })}
                >
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
            <BrandArrow direction="left" />
            <span>BACK</span>
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
        <Link className="fig-c1-3 detail__back" to={back}>
          <BrandArrow direction="left" />
          <span>BACK</span>
        </Link>
        <p className="fig-c4-12">Entry not found</p>
      </div>
    </div>
  );
}
