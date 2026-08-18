import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { getEditionOverview } from "../data/editions";
import { LATEST_EDITION } from "../data/site";
import { useCatalogue, useEditionCatalogue } from "../lib/catalogue";
import "./EditionOverview.css";

/**
 * Edition overview — Figma "Previous Editions Page" 1:2100.
 * Full-bleed hero, intro on cols 4-9, team and institutions on cols 4-12, and the
 * only 4-up gallery in the file: cols 1-3 / 4-6 / 7-9 / 10-12.
 */
export function EditionOverview() {
  const { yearId = LATEST_EDITION.id } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const fallback = getEditionOverview(yearId);
  const { catalogue } = useEditionCatalogue(yearId);
  const { catalogues } = useCatalogue();
  const yearIds = catalogues.map((row) => row.years);
  const yearIndex = yearIds.indexOf(yearId);
  const nextId = yearIndex > 0 ? yearIds[yearIndex - 1] : fallback.nextId;
  const intro = catalogue.overview
    ? catalogue.overview.split("\n\n").filter(Boolean)
    : fallback.intro;
  const institutions = catalogue.institutions.length
    ? catalogue.institutions
    : fallback.institutions;
  const heroImage = catalogue.heroUrl || fallback.heroImage;
  const galleryImages = catalogue.galleryUrls.length
    ? catalogue.galleryUrls
    : fallback.galleryImages;
  const edition = {
    ...fallback,
    title:
      catalogue.source === "remote" && catalogue.title
        ? catalogue.title
        : fallback.title,
    intro,
    institutions,
    heroImage,
    galleryImages,
    nextId,
    subtitle:
      catalogue.years === LATEST_EDITION.id || catalogue.isCurrent
        ? fallback.subtitle
        : yearId.replace("-", "–"),
  };

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".edition-overview__reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: root, dependencies: [yearId] }
  );

  return (
    <div ref={root} className="edition-overview">
      <div className="edition-overview__hero">
        {edition.heroImage ? (
          <img src={edition.heroImage} alt="" />
        ) : (
          <div className="edition-overview__hero-fallback" aria-hidden />
        )}
      </div>

      <div className="fig-grid edition-overview__section">
        <h1 className="fig-label fig-heading edition-overview__title edition-overview__reveal">
          {edition.title}
          <br />
          {edition.subtitle}
        </h1>
        <div className="fig-c4-9 edition-overview__intro edition-overview__reveal">
          {edition.intro.map((para) => (
            <p key={para.slice(0, 48)} className="fig-body">
              {para}
            </p>
          ))}
        </div>
      </div>

      <div className="fig-grid edition-overview__section">
        <p className="fig-label fig-label--sub edition-overview__reveal">CATALOGUE</p>
        <nav className="fig-c4-12 edition-overview__links edition-overview__reveal">
          <Link to={`/editions/${yearId}/curators`} className="fig-subheading">
            CURATORS
            <span className="fig-subheading__underline" aria-hidden />
          </Link>
          <Link to={`/editions/${yearId}/artworks`} className="fig-subheading">
            ARTWORKS
            <span className="fig-subheading__underline" aria-hidden />
          </Link>
          <Link to={`/editions/${yearId}/artists`} className="fig-subheading">
            ARTISTS
            <span className="fig-subheading__underline" aria-hidden />
          </Link>
          <Link to={`/editions/${yearId}/venue`} className="fig-subheading">
            VENUES
            <span className="fig-subheading__underline" aria-hidden />
          </Link>
        </nav>
      </div>

      {edition.team.length ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">THE TEAM</h2>
          <div className="fig-c4-12 fig-sub-3 edition-overview__team edition-overview__reveal">
            {edition.team.map((col, i) => (
              <div key={i}>
                {col.map(([role, ...people]) => (
                  <div key={role} className="edition-overview__role">
                    <strong>{role}</strong>
                    {people.map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : catalogue.teamBody ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">THE TEAM</h2>
          <div className="fig-c4-12 fig-body edition-overview__reveal" style={{ whiteSpace: "pre-line" }}>
            {catalogue.teamBody}
          </div>
        </div>
      ) : null}

      {edition.institutions.length ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">
            PARTICIPATING INSTITUTIONS
          </h2>
          <p className="fig-c4-12 fig-body edition-overview__reveal">
            {edition.institutions.join(" · ")}
          </p>
        </div>
      ) : null}

      {edition.galleryImages.length ? (
        <div className="fig-grid edition-overview__gallery">
          {edition.galleryImages.map((src) => (
            <div key={src} className="edition-overview__slot edition-overview__reveal">
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      ) : null}

      {edition.nextId ? (
        <div className="fig-grid edition-overview__nav">
          <CtaLink
            className="fig-cta-end"
            to={`/editions/${edition.nextId}`}
            lines={["Next", "Edition"]}
          />
        </div>
      ) : null}
    </div>
  );
}
