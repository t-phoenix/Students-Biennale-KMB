import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { GalleryLightbox } from "../components/GalleryLightbox";
import { useProgrammes } from "../lib/programmes";
import { SectionEmpty } from "../components/SectionEmpty";
import type { ResidencyProgramme } from "../lib/programmes/types";
import "./Residencies.css";

function findResidency(
  residencies: ResidencyProgramme[],
  key: string,
): ResidencyProgramme | undefined {
  if (!key) return undefined;
  return (
    residencies.find((row) => row.slug === key) ??
    residencies.find((row) => row.id === key)
  );
}

export function Residencies() {
  const root = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { residencies } = useProgrammes();

  // Match Press page: query param drives the featured item. Hash links remain supported.
  const residencyKey = params.get("residency") ?? location.hash.slice(1);

  const featured = useMemo(() => {
    if (!residencies.length) return undefined;
    if (residencyKey) {
      return findResidency(residencies, residencyKey) ?? residencies[0];
    }
    return residencies[0];
  }, [residencyKey, residencies]);

  const selectResidency = useCallback(
    (slug: string) => {
      setParams({ residency: slug });
      setLightboxIndex(null);
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    },
    [setParams],
  );

  useGSAP(
    () => {
      const el = featureRef.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
    },
    { dependencies: [featured?.id], scope: root },
  );

  if (!residencies.length) {
    return (
      <div ref={root} className="residencies">
        <SectionEmpty className="residencies__empty">No residencies published yet.</SectionEmpty>
      </div>
    );
  }

  if (!featured) return null;

  const descriptionParas = featured.description.split(/\n\s*\n/).filter(Boolean);
  const gallery = featured.galleryImages;
  const related = residencies.filter((row) => row.id !== featured.id);
  const hasRelated = related.length > 0;

  return (
    <div ref={root} className="residencies">
      <div className="fig-grid residencies__head">
        <div className="residencies__rail fig-rail">
          <h1>{featured.title}</h1>
          {featured.host ? (
            <p className="residencies__meta">
              <span>Host :</span>
              <em>{featured.host}</em>
            </p>
          ) : null}
          {featured.period ? (
            <p className="residencies__meta">
              <span>Period :</span>
              <em>{featured.period}</em>
            </p>
          ) : null}
          {featured.venue ? (
            <p className="residencies__meta">
              <span>Venue :</span>
              <em>{featured.venue}</em>
            </p>
          ) : null}
          {featured.awardees ? (
            <p className="residencies__meta">
              <span>Awardees :</span>
              <em>{featured.awardees}</em>
            </p>
          ) : null}
        </div>

        <article ref={featureRef} className="residencies__feature fig-c4-9" id={featured.slug}>
          {featured.heroImage ? (
            <img className="residencies__feature-media" src={featured.heroImage} alt="" />
          ) : (
            <div className="residencies__feature-media" aria-hidden />
          )}

          {descriptionParas.length ? (
            <div className="residencies__body">
              {descriptionParas.map((para) => (
                <p key={para.slice(0, 48)}>{para}</p>
              ))}
            </div>
          ) : featured.copy ? (
            <p>{featured.copy}</p>
          ) : null}

          {gallery.length ? (
            <div className="residencies__gallery">
              <div className="residencies__gallery-grid">
                {gallery.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    className="residencies__gallery-item"
                    onClick={() => setLightboxIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </div>

      <div className="fig-grid residencies__related">
        {hasRelated ? (
          <ul className="residencies__list fig-c4-12">
            {related.map((item) => {
              const excerpt = item.copy || item.description.split(/\n\s*\n/)[0] || "";
              const useTeaser = Boolean(item.heroImage && excerpt);
              return (
                <li key={item.id} className={useTeaser ? "is-teaser" : undefined}>
                  {useTeaser ? (
                    <button type="button" onClick={() => selectResidency(item.slug)}>
                      <div className="residencies__teaser fig-band-9">
                        <img src={item.heroImage} alt="" />
                        <div className="residencies__teaser-copy">
                          <div className="residencies__teaser-head">
                            <span>{item.title}</span>
                            {item.period ? <time>{item.period}</time> : null}
                          </div>
                          <p>{excerpt}</p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button type="button" onClick={() => selectResidency(item.slug)}>
                      <span>{item.title}</span>
                      {item.period ? <time>{item.period}</time> : null}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
        <CtaLink
          className={`fig-cta-end residencies__more${hasRelated ? "" : " fig-c4-12"}`}
          to="/programmes#residencies"
          lines={["View", "MORE"]}
          spacing={["0.26em", "0.135em"]}
        />
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
