import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { ResidenciesBand } from "../components/ResidenciesBand";
import { ScholarSpotlight } from "../components/ScholarSpotlight";
import { toResidencySlides, useProgrammes } from "../lib/programmes";
import { LATEST_EDITION } from "../data/site";
import "./Programmes.css";

export function Programmes() {
  const root = useRef<HTMLDivElement>(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const [openScholarId, setOpenScholarId] = useState<string | null>(null);
  const { upcomingWorkshops, pastWorkshops, awardsInternational, awardsNational, raza, residencies } =
    useProgrammes();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".prog-reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "opacity,visibility,transform",
      });

      const heroTl = gsap.timeline({ repeat: -1 });
      for (let i = 0; i < 5; i += 1) {
        heroTl.call(() => setHeroSlide(i)).to({}, { duration: 3.5 });
      }
      const hero = root.current?.querySelector<HTMLElement>(".programmes__hero");
      const pause = () => heroTl.pause();
      const play = () => heroTl.play();
      hero?.addEventListener("pointerenter", pause);
      hero?.addEventListener("pointerleave", play);
      return () => {
        hero?.removeEventListener("pointerenter", pause);
        hero?.removeEventListener("pointerleave", play);
      };
    },
    { scope: root }
  );

  return (
    <div ref={root} className="programmes">
      <section className="programmes__hero prog-reveal" aria-label="Programmes hero">
        <img src="/programmes/hero.jpg" alt="" className="programmes__hero-media" />
        <div className="programmes__hero-dots" role="tablist" aria-label="Hero slides">
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={heroSlide === i}
              className={heroSlide === i ? "is-active" : undefined}
              onClick={() => setHeroSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      <section id="workshops" className="programmes__block fig-grid prog-reveal">
        <h1 className="fig-label">UPCOMING WORKSHOPS</h1>
        {upcomingWorkshops.length ? (
          <div className="programmes__cards fig-c4-12 fig-sub-3">
            {upcomingWorkshops.map((p) => (
              <article key={p.id}>
                <div className="programmes__card-media-wrap">
                  <img src={p.image} alt="" className="programmes__card-media" />
                </div>
                <h2>{p.title}</h2>
                <p className="programmes__meta">
                  Date : {p.date}
                  <br />
                  Place : {p.place}
                </p>
                <p>{p.blurb}</p>
                <button type="button" className="programmes__card-button">KNOW MORE...</button>
              </article>
            ))}
          </div>
        ) : (
          <p className="fig-c4-12">No upcoming workshops at the moment. Please check back later.</p>
        )}
      </section>

      <section className="programmes__block fig-grid prog-reveal">
        <h2 className="fig-label">PAST WORKSHOPS</h2>
        <ul className="programmes__completed fig-c4-12">
          {pastWorkshops.slice(0, 2).map((item) => (
            <li key={item.id}>
              <Link to={`/programmes/past-workshops/${item.id}`}>
                <div>
                  <span className="programmes__past-title">{item.title}</span>
                  <span className="programmes__past-sub">Facilitators: {item.facilitators}</span>
                </div>
                <span>{item.year}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/programmes/past-workshops" className="fig-cta-end programmes__more">
          <CtaLink
            lines={["VIEW", "MORE"]}
            spacing={["0.26em", "0.135em"]}
          />
        </Link>
      </section>

      <section className="programmes__block fig-grid prog-reveal">
        <Link to="/programmes/raza-scholarship" className="fig-c4-12 programmes__raza-heading">
          <h2 className="programmes__raza-title">{`Raza - Students' Biennale Scholarship`}</h2>
        </Link>
        <div className="programmes__raza-cards fig-c4-12 fig-sub-2">
          {raza.scholars.map((scholar) => (
            <article key={scholar.id}>
              <button
                type="button"
                className="programmes__scholar-link"
                onClick={() => setOpenScholarId(scholar.id)}
              >
                <div className="programmes__card-media-wrap">
                  <img src={scholar.image} alt={scholar.name} className="programmes__card-media" />
                </div>
                <h3>{scholar.name}</h3>
              </button>
            </article>
          ))}
        </div>
      </section>

      <div id="awards">
        {(
          [
            ["INTERNATIONAL AWARDS", awardsInternational],
            ["NATIONAL AWARDS", awardsNational],
          ] as const
        ).map(([heading, awards]) => (
          <section key={heading} className="programmes__block fig-grid prog-reveal">
            <h2 className="fig-label">{heading}</h2>
            <div className="programmes__awards fig-c4-12 fig-sub-3">
              {awards.map((a) => (
                <Link
                  key={`${heading}-${a.name}`}
                  className="programmes__award"
                  to={`/editions/${LATEST_EDITION.id}/artworks/${a.artworkId}`}
                >
                  <div className="programmes__award-media">
                    <img src={a.image} alt="" />
                  </div>
                  <h3>{a.name}</h3>
                  <p>Artwork : {a.artwork}</p>
                  <p>{a.institution}</p>
                </Link>
              ))}
            </div>
            <CtaLink
              className="fig-cta-end programmes__more"
              lines={["VIEW", "MORE"]}
              spacing={["0.26em", "0.135em"]}
            />
          </section>
        ))}
      </div>

      <ResidenciesBand slides={toResidencySlides(residencies)} />

      <ScholarSpotlight
        scholarId={openScholarId}
        scholars={raza.scholars}
        onClose={() => setOpenScholarId(null)}
      />
    </div>
  );
}
