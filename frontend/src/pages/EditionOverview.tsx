import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { getEditionOverview } from "../data/editions";
import { LATEST_EDITION } from "../data/site";
import "./EditionOverview.css";

/**
 * Edition overview — Figma "Previous Editions Page" 1:2626.
 * Full-bleed hero, intro on cols 4-9, team and institutions on cols 4-12, and the
 * only 4-up gallery in the file: cols 1-3 / 4-6 / 7-9 / 10-12.
 */
export function EditionOverview() {
  const { yearId = LATEST_EDITION.id } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const edition = getEditionOverview(yearId);

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
      <div className="edition-overview__hero" aria-hidden />

      <div className="fig-grid edition-overview__section">
        <h1 className="fig-label fig-heading edition-overview__title edition-overview__reveal">
          {edition.title}
          <br />
          {edition.subtitle}
        </h1>
        {edition.intro.length ? (
          <div className="fig-c4-9 edition-overview__intro edition-overview__reveal">
            {edition.intro.map((para) => (
              <p key={para.slice(0, 48)} className="fig-body">
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p className="fig-c4-9 fig-body edition-overview__reveal">
            Catalogue records for this edition are available in the sections below.
          </p>
        )}
      </div>

      <div className="fig-grid edition-overview__section">
        <p className="fig-label fig-label--sub edition-overview__reveal">Catalogue</p>
        <nav className="fig-c4-12 edition-overview__links edition-overview__reveal">
          <Link to={`/editions/${yearId}/curators`} className="fig-subheading">
            Curators
            <span className="fig-subheading__underline" aria-hidden />
          </Link>
          <Link to={`/editions/${yearId}/artworks`} className="fig-subheading">
            Artworks
            <span className="fig-subheading__underline" aria-hidden />
          </Link>
          <Link to={`/editions/${yearId}/artists`} className="fig-subheading">
            Artists
            <span className="fig-subheading__underline" aria-hidden />
          </Link>
          <Link to={`/editions/${yearId}/venue`} className="fig-subheading">
            Venues
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
      ) : null}

      {edition.institutions.length ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">
            Participating Institutions
          </h2>
          <p className="fig-c4-12 fig-body edition-overview__reveal">
            {edition.institutions.join(" · ")}
          </p>
        </div>
      ) : null}

      {/* 4-up gallery across all 12 columns — the one full-width card grid in the file. */}
      <div className="fig-grid edition-overview__gallery">
        {Array.from({ length: edition.gallerySlots }).map((_, i) => (
          <div key={i} className="edition-overview__slot edition-overview__reveal" aria-hidden />
        ))}
      </div>

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
