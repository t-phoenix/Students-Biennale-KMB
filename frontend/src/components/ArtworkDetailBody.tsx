import { useEffect, useState } from "react";
import { artworkImages, curatorsForArtwork, type ArtworkCard } from "../data/site";
import "../pages/Detail.css";

type Props = {
  artwork: ArtworkCard;
};

/** Shared artwork content — hero carousel through artists/curated-by — reused by
 *  the standalone artwork page (Detail.tsx) and the Discover Artworks canvas
 *  expand overlay (CanvasExpand.tsx). Page-level chrome (BACK/NEXT nav) stays
 *  with each caller since it differs by context. */
export function ArtworkDetailBody({ artwork: a }: Props) {
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    setHeroIndex(0);
  }, [a.id]);

  const slides = artworkImages(a);
  const slide = slides[Math.min(heroIndex, Math.max(slides.length - 1, 0))];
  const curated = curatorsForArtwork(a);

  return (
    <div key={a.id}>
      <div className="detail__hero detail__hero--cover detail-reveal">
        {slide ? (
          <img src={slide} alt="" className="detail__hero-img" />
        ) : (
          <div className="detail__hero-fallback" aria-hidden />
        )}
        <div className="detail__hero-scrim" aria-hidden />
        <div className="fig-grid detail__hero-caption">
          <p className="fig-label fig-subheading detail__label detail-reveal">Artworks Title</p>
          <h1 className="fig-c4-9 detail__title detail-reveal">{a.title}</h1>
          <span className="fig-c10-12 detail__year detail-reveal">{a.year}</span>
        </div>
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
              {a.materials.map((m, i) => (
                <p key={`${i}-${m}`}>{m}</p>
              ))}
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
              <strong>{artist.name}</strong>
              <span>{artist.institution}</span>
            </div>
          ))}
        </div>
        {curated.length ? (
          <p className="fig-c4-6 detail__curated-by detail-reveal">
            <strong>Curated By</strong>
            {curated.map((c) => c.name).join(" and ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
