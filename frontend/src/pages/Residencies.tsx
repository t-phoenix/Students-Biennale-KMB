import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { GalleryLightbox } from "../components/GalleryLightbox";
import { useProgrammes } from "../lib/programmes";
import { SectionEmpty } from "../components/SectionEmpty";
import { MetaGrid, MetaRow } from "../components/MetaGrid";
import type { ResidencyProgramme } from "../lib/programmes/types";
import "./Residencies.css";

function findResidency(
  residencies: ResidencyProgramme[],
  key: string,
): ResidencyProgramme | undefined {
  if (!key) return undefined;
  const lower = key.toLowerCase();
  return residencies.find((r) => r.slug.toLowerCase() === lower || r.id === key);
}

export function Residencies() {
  const root = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const { residencies } = useProgrammes();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const selectedSlug = params.get("residency");
  const featured = useMemo(() => {
    if (selectedSlug) {
      const match = findResidency(residencies, selectedSlug);
      if (match) return match;
    }
    const hash = location.hash.replace(/^#/, "");
    if (hash) {
      const match = findResidency(residencies, hash);
      if (match) return match;
    }
    return residencies[0];
  }, [selectedSlug, location.hash, residencies]);

  const selectResidency = useCallback(
    (slug: string) => {
      setParams({ residency: slug });
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

  if (!featured) {
    return (
      <div ref={root} className="residencies">
        <SectionEmpty className="residencies__empty">
          No residency programmes available yet.
        </SectionEmpty>
      </div>
    );
  }

  const descriptionParas = featured.description.split(/\n\s*\n/).filter(Boolean);
  const gallery = featured.galleryImages ?? [];
  const related = residencies.filter((r) => r.id !== featured.id);
  const hasRelated = related.length > 0;

  return (
    <div ref={root} className="residencies">
      <div className="fig-grid residencies__head">
        <div className="residencies__rail fig-rail">
          <h1>{featured.title}</h1>
          <MetaGrid className="residencies__meta-grid">
            <MetaRow
              label="Host"
              value={featured.host?.replace(/\bKBF\b/g, "Kochi Biennale Foundation")}
            />
            <MetaRow label="Period" value={featured.period} />
            <MetaRow label="Venue" value={featured.venue} />
            <MetaRow
              label="Awardees"
              value={featured.awardees?.replace(/\bKBF\b/g, "Kochi Biennale Foundation")}
            />
          </MetaGrid>
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
                        <div className="residencies__teaser-media">
                          {item.heroImage ? (
                            <img src={item.heroImage} alt="" />
                          ) : (
                            <div aria-hidden />
                          )}
                        </div>
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
