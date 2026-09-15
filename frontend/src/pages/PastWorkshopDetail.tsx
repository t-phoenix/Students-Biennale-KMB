import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { BrandArrow } from "../components/BrandArrow";
import { GalleryLightbox } from "../components/GalleryLightbox";
import { MetaGrid, MetaRow } from "../components/MetaGrid";
import { usePastWorkshop } from "../lib/programmes";
import "./PastWorkshopDetail.css";

export function PastWorkshopDetail() {
  const { id = "" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { workshop, next, status } = usePastWorkshop(id);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".workshop-reveal", {
        autoAlpha: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    },
    { scope: root, dependencies: [id] }
  );

  if (status === "loading") {
    return (
      <div className="past-workshop-detail">
        <div className="fig-grid past-workshop-detail__section">
          <p className="fig-c4-12">Loading workshop documentation...</p>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="past-workshop-detail">
        <div className="fig-grid past-workshop-detail__section">
          <Link className="fig-c1-3 past-workshop-detail__back" to="/programmes#workshops">
            <BrandArrow direction="left" />
            <span>BACK</span>
          </Link>
          <p className="fig-c4-12">Workshop not found.</p>
        </div>
      </div>
    );
  }

  const descriptionParas = (workshop.description ?? "").split(/\n\s*\n/).filter(Boolean);
  const gallery = workshop.galleryImages ?? [];

  return (
    <div ref={root} className="past-workshop-detail" key={workshop.id}>
      {workshop.heroImage ? (
        <div className="past-workshop-detail__hero workshop-reveal">
          <img src={workshop.heroImage} alt="" className="past-workshop-detail__hero-img" />
        </div>
      ) : (
        <div className="past-workshop-detail__hero past-workshop-detail__hero--fallback workshop-reveal" aria-hidden />
      )}

      <div className="fig-grid past-workshop-detail__section workshop-reveal">
        <div className="fig-c4-9">
          <h1 className="past-workshop-detail__title">{workshop.title}</h1>
          <MetaGrid className="past-workshop-detail__meta">
            <MetaRow label="Facilitators" value={workshop.facilitators} />
            <MetaRow label="Location" value={workshop.location} />
            <MetaRow label="Year" value={workshop.year} />
          </MetaGrid>
        </div>
      </div>

      <div className="fig-grid past-workshop-detail__section workshop-reveal">
        <div className="fig-c4-9">
          {descriptionParas.length ? (
            <div className="past-workshop-detail__description">
              {descriptionParas.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="past-workshop-detail__placeholder">
              Documentation for this workshop is being archived.
            </p>
          )}
        </div>
      </div>

      {gallery.length ? (
        <div className="fig-grid past-workshop-detail__section workshop-reveal">
          <div className="fig-c4-12">
            <div className="gallery-grid">
              {gallery.map((img, i) => (
                <button
                  key={img}
                  className="gallery-item"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  type="button"
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="fig-grid past-workshop-detail__nav">
        <Link className="fig-c1-3 past-workshop-detail__back" to="/programmes/past-workshops">
          <BrandArrow direction="left" />
          <span>BACK</span>
        </Link>
        {next ? (
          <CtaLink
            className="past-workshop-detail__next"
            variant="next"
            to={`/programmes/past-workshops/${next.id}`}
            lines={["NEXT"]}
          />
        ) : null}
      </div>

      {lightboxIndex !== null ? (
        <GalleryLightbox
          images={gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}
