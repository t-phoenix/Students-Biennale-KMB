import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { getEditionOverview } from "../data/editions";
import { LATEST_EDITION } from "../data/site";
import { useCatalogue, useEditionCatalogue } from "../lib/catalogue";
import "./EditionOverview.css";

/** Split "Inaugural Edition (2014 - 15)" into display lines for the title rail. */
function splitEditionSubtitle(subtitle: string): { lines: string[] } {
  const match = subtitle.match(/^(.+?)\s*(\([^)]+\))$/);
  if (match) return { lines: [match[1].trim(), match[2].trim()] };
  return { lines: [subtitle] };
}

function TeamGrid({
  team,
}: {
  team: readonly (readonly (readonly string[])[])[];
}) {
  return (
    <div className="edition-overview__team-grid">
      {team.map((col, i) => (
        <div key={i} className="edition-overview__team-col">
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
  );
}

function InstitutionsList({ names }: { names: readonly string[] }) {
  return (
    <p className="fig-c4-12 fig-body edition-overview__institutions">
      {names.map((name, index) => (
        <span key={name}>
          {index > 0 ? <span className="edition-overview__pipe"> | </span> : null}
          {name}
        </span>
      ))}
    </p>
  );
}

/**
 * Edition overview — Figma "Previous Editions Page" (929:4591).
 * Previous editions use the right-aligned title rail, three-column team, pipe-separated
 * institutions, and a 4×2 gallery. The current edition keeps catalogue navigation links.
 */
export function EditionOverview() {
  const { yearId = LATEST_EDITION.id } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const fallback = getEditionOverview(yearId);
  const { catalogue } = useEditionCatalogue(yearId);
  const { catalogues } = useCatalogue();
  const isPreviousEdition = yearId !== LATEST_EDITION.id;
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
    subtitle: fallback.subtitle,
  };
  const subtitleLines = isPreviousEdition
    ? splitEditionSubtitle(edition.subtitle).lines
    : [edition.subtitle];
  const nextLabel = edition.nextId?.replace("-", "–") ?? "";

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
    <div
      ref={root}
      className={`edition-overview${isPreviousEdition ? " edition-overview--previous" : ""}`}
    >
      <div className="edition-overview__hero">
        {edition.heroImage ? (
          <img src={edition.heroImage} alt="" />
        ) : (
          <div className="edition-overview__hero-fallback" aria-hidden />
        )}
      </div>

      <div className="fig-grid edition-overview__section">
        {isPreviousEdition ? (
          <div className="fig-rail edition-overview__title-rail edition-overview__reveal">
            <h1 className="edition-overview__title-main">{edition.title}</h1>
            {subtitleLines.map((line) => (
              <p key={line} className="edition-overview__title-edition">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <h1 className="fig-label fig-heading edition-overview__title edition-overview__reveal">
            {edition.title}
            <br />
            {edition.subtitle}
          </h1>
        )}
        <div className="fig-c4-9 edition-overview__intro edition-overview__reveal">
          {edition.intro.map((para) => (
            <p key={para.slice(0, 48)} className="fig-body">
              {para}
            </p>
          ))}
        </div>
      </div>

      {!isPreviousEdition ? (
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
      ) : null}

      {edition.team.length ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">THE TEAM</h2>
          <div className="fig-c4-12 edition-overview__reveal">
            <TeamGrid team={edition.team} />
          </div>
        </div>
      ) : catalogue.teamBody ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">THE TEAM</h2>
          <div
            className="fig-c4-12 fig-body edition-overview__team-body edition-overview__reveal"
          >
            {catalogue.teamBody}
          </div>
        </div>
      ) : null}

      {edition.institutions.length ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">
            PARTICIPATING INSTITUTIONS
          </h2>
          {isPreviousEdition ? (
            <InstitutionsList names={edition.institutions} />
          ) : (
            <p className="fig-c4-12 fig-body edition-overview__reveal">
              {edition.institutions.join(" · ")}
            </p>
          )}
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
          {isPreviousEdition ? (
            <CtaLink
              className="fig-cta-end"
              to={`/editions/${edition.nextId}`}
              lines={["Students' Biennale", nextLabel]}
              spacing={["0.1em", "0.1em"]}
              variant="next"
            />
          ) : (
            <CtaLink
              className="fig-cta-end"
              to={`/editions/${edition.nextId}`}
              lines={["Next", "Edition"]}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
