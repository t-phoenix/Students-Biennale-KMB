import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { EDITION_OVERVIEWS } from "../data/site";
import "./EditionOverview.css";

export function EditionOverview() {
  const { yearId = "2014-15" } = useParams();
  const root = useRef<HTMLDivElement>(null);
  const overview = EDITION_OVERVIEWS[yearId];

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".eo-reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: root, dependencies: [yearId] }
  );

  if (!overview) {
    return (
      <div ref={root} className="edition-overview">
        <section className="eo__row eo-reveal">
          <p className="fig-label">Not found</p>
          <p className="fig-body">
            There's no overview yet for this edition. <Link to="/editions">Back to editions</Link>
          </p>
        </section>
      </div>
    );
  }

  const hasTeam =
    (overview.curators && overview.curators.length > 0) ||
    (overview.advisors && overview.advisors.length > 0) ||
    Boolean(
      overview.curatorialAdvisor ||
        overview.projectAdvisor ||
        overview.directorOfProgrammes ||
        overview.programmeCoordinator
    );
  const hasInstitutions = Boolean(overview.institutions && overview.institutions.length > 0);
  const workshopRows =
    overview.workshopImages && overview.workshopImages.length > 0
      ? [overview.workshopImages.slice(0, 4), overview.workshopImages.slice(4, 8)]
      : [];

  return (
    <div ref={root} className="edition-overview">
      <section className="eo__hero eo-reveal" aria-label={`${overview.title} — ${overview.editionLabel}`}>
        {overview.heroImage ? (
          <img src={overview.heroImage} alt="" className="eo__hero-media" />
        ) : (
          <div className="eo__hero-media eo__hero-media--placeholder" aria-hidden />
        )}
      </section>

      <section className="eo__row eo-reveal">
        <div className="eo__title">
          <p className="fig-label">{overview.title}</p>
          <p className="fig-label fig-label--sub eo__title-sub">{overview.editionLabel}</p>
        </div>
        <p className="fig-body eo__history">{overview.history}</p>
      </section>

      {hasTeam ? (
        <section className="eo__row eo-reveal">
          <p className="fig-label fig-label--sub">THE TEAM</p>
          <div className="eo__team">
            {overview.curators && overview.curators.length > 0 ? (
              <div className="eo__team-col">
                <h3>Curators</h3>
                <ul>
                  {overview.curators.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {overview.curatorialAdvisor ||
            overview.projectAdvisor ||
            overview.directorOfProgrammes ||
            overview.programmeCoordinator ? (
              <div className="eo__team-col eo__team-col--roles">
                {overview.curatorialAdvisor ? (
                  <div>
                    <h3>Curatorial Advisor</h3>
                    <p>{overview.curatorialAdvisor}</p>
                  </div>
                ) : null}
                {overview.projectAdvisor ? (
                  <div>
                    <h3>Project Advisor</h3>
                    <p>{overview.projectAdvisor}</p>
                  </div>
                ) : null}
                {overview.directorOfProgrammes ? (
                  <div>
                    <h3>Director of Programmes</h3>
                    <p>{overview.directorOfProgrammes}</p>
                  </div>
                ) : null}
                {overview.programmeCoordinator ? (
                  <div>
                    <h3>Programme Coordinator</h3>
                    <p>{overview.programmeCoordinator}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {overview.advisors && overview.advisors.length > 0 ? (
              <div className="eo__team-col">
                <h3>Advisors</h3>
                <ul>
                  {overview.advisors.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasInstitutions ? (
        <section className="eo__row eo-reveal">
          <p className="fig-label fig-label--sub">Participating Institutions</p>
          <ul className="eo__institutions">
            {overview.institutions!.map((inst) => (
              <li key={inst}>{inst}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {workshopRows.length > 0 ? (
        <section className="eo__row eo-reveal">
          <p className="fig-label fig-label--sub">Workshops</p>
          <div className="eo__workshops">
            {workshopRows.map((row, rowIndex) => (
              <div className="eo__workshop-grid" key={rowIndex}>
                {row.map((src, i) => {
                  const isLastTile = rowIndex === workshopRows.length - 1 && i === row.length - 1;
                  return isLastTile ? (
                    <Link key={src} to="/programmes" className="eo__workshop-tile eo__workshop-tile--more">
                      <img src={src} alt="" />
                      <span className="eo__workshop-more">View more →</span>
                    </Link>
                  ) : (
                    <div className="eo__workshop-tile" key={src}>
                      <img src={src} alt="" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {overview.nextEditionYearId && overview.nextEditionLabel ? (
        <section className="eo__row eo__row--next eo-reveal">
          <div aria-hidden />
          <Link to={`/editions/${overview.nextEditionYearId}/about`} className="fig-link-more eo__next-link">
            <span>{overview.nextEditionLabel} →</span>
          </Link>
        </section>
      ) : null}

      {overview.closerImage ? (
        <section className="eo__closer eo-reveal">
          <img src={overview.closerImage} alt="" className="eo__closer-media" />
        </section>
      ) : null}
    </div>
  );
}
