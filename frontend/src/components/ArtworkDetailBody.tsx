import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { artworkImages, curatorsForArtwork, type ArtworkCard } from "../data/site";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { preloadAdjacent, preloadUrls } from "../lib/preloadImages";
import { useCarouselDotsTone } from "../lib/useCarouselDotsTone";
import { CarouselNavArrows } from "./CarouselNavArrows";
import { GalleryLightbox } from "./GalleryLightbox";
import { HighlightText } from "./HighlightText";
import { PreloadedImage } from "./PreloadedImage";
import "../pages/Detail.css";

type Props = {
  artwork: ArtworkCard;
  highlightQuery?: string;
};

/** Shared artwork content — hero carousel through artists/curated-by — reused by
 *  the standalone artwork page (Detail.tsx) and the Discover Artworks canvas
 *  expand overlay (CanvasExpand.tsx). Page-level chrome (BACK/NEXT nav) stays
 *  with each caller since it differs by context. */
export function ArtworkDetailBody({ artwork: a, highlightQuery = "" }: Props) {
  const { yearId = "2025-26" } = useParams();
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const slides = artworkImages(a);

  useEffect(() => {
    setHeroIndex(0);
    setLightboxOpen(false);
  }, [a.id, slides.length]);

  // Warm the full gallery as soon as the artwork opens — the carousel
  // auto-advances every 4s, so upcoming slides should already be decoded.
  useEffect(() => {
    if (!slides.length) return;
    void preloadUrls(slides, "high", 0);
  }, [a.id, slides]);

  useEffect(() => {
    if (slides.length <= 1) return;
    void preloadAdjacent(slides, heroIndex, 1, "high");
  }, [heroIndex, slides]);

  const slide = slides[Math.min(heroIndex, Math.max(slides.length - 1, 0))];
  const dotsTone = useCarouselDotsTone(slide ?? "", "center");
  const upcomingSlides = slides.filter((url) => url !== slide);
  const curated = curatorsForArtwork(a);
  const goPrev = () => setHeroIndex((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setHeroIndex((i) => (i + 1) % slides.length);

  // Auto-advance the hero on a timer, same pace and pause-on-interact
  // pattern as the Home hero, per client feedback ("auto-advance on a
  // timer" — confirmed, no specific interval given).
  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero || slides.length <= 1 || prefersReducedMotion()) return;
      const tl = gsap.timeline({ repeat: -1 });
      tl.to({}, { duration: 4 }).call(() => {
        setHeroIndex((cur) => (cur + 1) % slides.length);
      });
      const pause = () => tl.pause();
      const play = () => tl.play();
      hero.addEventListener("pointerenter", pause);
      hero.addEventListener("pointerleave", play);
      hero.addEventListener("focusin", pause);
      hero.addEventListener("focusout", play);
      return () => {
        hero.removeEventListener("pointerenter", pause);
        hero.removeEventListener("pointerleave", play);
        hero.removeEventListener("focusin", pause);
        hero.removeEventListener("focusout", play);
        tl.kill();
      };
    },
    { dependencies: [a.id, slides.length], scope: heroRef }
  );

  return (
    <div key={a.id}>
      <div ref={heroRef} className="detail__hero detail__hero--cover detail-reveal">
        {slide ? (
          <>
            <PreloadedImage
              key={slide}
              src={slide}
              alt=""
              className="detail__hero-img"
              prefetch={upcomingSlides}
              onClick={() => setLightboxOpen(true)}
            />
            <button
              type="button"
              className="detail__hero-expand"
              aria-label="View full image"
              onClick={() => setLightboxOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </>
        ) : (
          <div className="detail__hero-fallback" aria-hidden />
        )}
        {slides.length > 1 ? (
          <>
            <CarouselNavArrows slideSrc={slide ?? ""} onPrev={goPrev} onNext={goNext} />
            <div
              className="detail__hero-dots detail__hero-dots--artwork carousel-dots"
              data-tone={dotsTone}
              role="tablist"
              aria-label="Artwork images"
            >
              {slides.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  role="tab"
                  aria-label={`Image ${i + 1} of ${slides.length}`}
                  aria-selected={i === heroIndex}
                  className={i === heroIndex ? "is-active" : undefined}
                  onClick={() => setHeroIndex(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {lightboxOpen ? (
        <GalleryLightbox
          images={slides}
          index={heroIndex}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setHeroIndex}
        />
      ) : null}

      <div className="fig-grid detail__section">
        <p className="fig-label fig-subheading detail__label detail-reveal">Artworks Title</p>
        <h1 className="fig-c4-9 detail__title detail-reveal">
          <HighlightText text={a.title} query={highlightQuery} />
        </h1>
        <span className="fig-c10-12 detail__year detail-reveal">{a.year}</span>
      </div>

      <div className="fig-grid detail__section">
        <dl className="fig-c4-12 detail__meta detail-reveal">
          <div>
            <dt>Venue :</dt>
            <dd>
              <HighlightText text={a.venue} query={highlightQuery} />
            </dd>
          </div>
          <div>
            <dt>Materials &amp; Dimensions :</dt>
            <dd>
              <p>
                {[a.materials.filter(Boolean).join(", "), a.dimensions]
                  .filter(Boolean)
                  .join(" | ")}
              </p>
            </dd>
          </div>
        </dl>
      </div>

      <div className="fig-grid detail__section">
        <p className="fig-label fig-subheading detail__label detail-reveal">Description</p>
        <div className="fig-c4-9 fig-body detail-reveal detail__desc">
          {a.description.split(/\n\n+/).map((para, i) => (
            <p key={`${i}-${para.slice(0, 48)}`}>{para}</p>
          ))}
        </div>
      </div>

      <div className="fig-grid detail__section">
        <p className="fig-label fig-subheading detail__label detail-reveal">Artists</p>
        <div className="fig-c4-12 fig-sub-3 detail__artists detail-reveal">
          {a.artists.map((artist, i) => (
            <div key={`${i}-${artist.name}`}>
              <strong>
                <HighlightText text={artist.name} query={highlightQuery} />
              </strong>
              <span>
                <HighlightText text={artist.institution} query={highlightQuery} />
              </span>
            </div>
          ))}
        </div>
        {curated.length ? (
          <p className="fig-c4-6 detail__curated-by detail-reveal">
            <strong>Curated By</strong>
            {curated.map((c, i) => (
              <span key={c.id}>
                {i > 0 ? " and " : ""}
                <Link to={`/editions/${yearId}/curators/${c.id}`}>{c.name}</Link>
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </div>
  );
}
