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
      <div className="fig-grid past-workshop-detail__head workshop-reveal">
        <div className="past-workshop-detail__rail fig-rail">
          <h1>{workshop.title}</h1>
          <MetaGrid className="past-workshop-detail__meta">
            <MetaRow label="Facilitators" value={workshop.facilitators} />
            <MetaRow label="Location" value={workshop.location} />
            <MetaRow label="Year" value={workshop.year} />
          </MetaGrid>
        </div>

        <article className="past-workshop-detail__feature fig-c4-9">
          <div className="past-workshop-detail__feature-media">
            {workshop.heroImage ? (
              <img src={workshop.heroImage} alt="" />
            ) : (
              <div aria-hidden />
            )}
          </div>

          {descriptionParas.length ? (
            <div className="past-workshop-detail__body">
              {descriptionParas.map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="past-workshop-detail__placeholder">
              Documentation for this workshop is being archived.
            </p>
          )}
        </article>
      </div>

      {gallery.length ? (
        <div className="fig-grid past-workshop-detail__gallery workshop-reveal">
          {gallery.map((img, i) => (
            <button
              key={img}
              className="past-workshop-detail__gallery-slot"
              onClick={() => setLightboxIndex(i)}
              aria-label={`View image ${i + 1}`}
              type="button"
            >
              <img src={img} alt="" />
            </button>
          ))}
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
