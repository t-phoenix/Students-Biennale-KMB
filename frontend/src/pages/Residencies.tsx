import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { GalleryLightbox } from "../components/GalleryLightbox";
import { useProgrammes } from "../lib/programmes";
import "./Residencies.css";

export function Residencies() {
  const root = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { residencies } = useProgrammes();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".residency-reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "opacity,visibility,transform",
      });
    },
    { scope: root, dependencies: [residencies.map((item) => item.id).join("|")] }
  );

  return (
    <div ref={root} className="residencies">
      {residencies.length === 0 ? (
        <p className="fig-grid" style={{ padding: "48px var(--grid-margin)" }}>
          No residencies published yet.
        </p>
      ) : null}
      {residencies.map((residency) => {
        const descriptionParas = residency.description.split(/\n\s*\n/).filter(Boolean);
        const gallery = residency.galleryImages;
        const lightboxOpen = activeId === residency.id ? lightboxIndex : null;
        return (
          <section key={residency.id} id={residency.slug}>
            <div className="residencies__hero residency-reveal">
              <img src={residency.heroImage} alt="" className="residencies__hero-img" />
            </div>

            <div className="fig-grid residencies__content residency-reveal">
              <div className="fig-c4-9">
                <h1 className="residencies__title">{residency.title}</h1>
                <div className="residencies__meta">
                  <dl>
                    {residency.host ? (
                      <>
                        <dt>Host:</dt>
                        <dd>{residency.host}</dd>
                      </>
                    ) : null}
                    {residency.period ? (
                      <>
                        <dt>Period:</dt>
                        <dd>{residency.period}</dd>
                      </>
                    ) : null}
                    {residency.venue ? (
                      <>
                        <dt>Venue:</dt>
                        <dd>{residency.venue}</dd>
                      </>
                    ) : null}
                    {residency.awardees ? (
                      <>
                        <dt>Awardees:</dt>
                        <dd>{residency.awardees}</dd>
                      </>
                    ) : null}
                  </dl>
                </div>
              </div>
            </div>

            <div className="fig-grid residencies__description residency-reveal">
              <div className="fig-c4-9">
                <div className="residencies__text">
                  {descriptionParas.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            {gallery.length ? (
              <div className="residencies__gallery fig-grid residency-reveal">
                <div className="fig-c4-12">
                  <div className="gallery-grid">
                    {gallery.map((img, idx) => (
                      <button
                        key={img}
                        className="gallery-item"
                        onClick={() => {
                          setActiveId(residency.id);
                          setLightboxIndex(idx);
                        }}
                        aria-label={`View image ${idx + 1}`}
                        type="button"
                      >
                        <img src={img} alt="" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {lightboxOpen !== null ? (
              <GalleryLightbox
                images={gallery}
                index={lightboxOpen}
                onClose={() => {
                  setLightboxIndex(null);
                  setActiveId(null);
                }}
                onIndexChange={setLightboxIndex}
              />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
