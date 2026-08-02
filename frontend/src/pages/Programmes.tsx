import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import {
  INTERNATIONAL_AWARDS,
  INTERNATIONAL_AWARDS_CONTENT_MISSING,
  NATIONAL_AWARDS,
  PAST_WORKSHOPS,
} from "../data/site";
import "./Programmes.css";

/**
 * "UPCOMING WORKSHOPS" cards (Figma 6:2326) are intentionally lorem-ipsum
 * placeholder copy in the design itself ("workshop 01/02/03" + standard
 * lorem, blank Date/Place values) — keep as placeholder, that is the
 * confirmed design intent, not a content gap.
 */
const WORKSHOPS = [
  {
    id: "w1",
    title: "workshop 01",
    date: "TBA",
    place: "TBA",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-1.jpg",
  },
  {
    id: "w2",
    title: "workshop 02",
    date: "TBA",
    place: "TBA",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-2.jpg",
  },
  {
    id: "w3",
    title: "workshop 03",
    date: "TBA",
    place: "TBA",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-3.jpg",
  },
];

/**
 * Residencies (Figma node 6:2495–6:2541): the full-bleed section is NOT
 * photo-only — it carries a real residency card (title/host/period/venue/
 * awardees + a copy paragraph). Only one residency is present in the design
 * (no carousel of multiple residencies), so RESIDENCIES_CONTENT_UNCONFIRMED
 * has been flipped to false in site.ts. The source paragraph itself trails
 * off mid-sentence ("Held from 10 June to 10 July 2026,") in the design —
 * reproduced verbatim rather than guessed/completed.
 */
const RESIDENCIES = [
  {
    id: "national-residency-2026",
    title: "Students' Biennale National Residency Award Programme",
    host: "KBF",
    period: "10 June – 10 July 2026",
    venue: "SMS Hall, Mattancherry, Kochi, Kerala",
    awardees: "Reppandee Lepcha & Durgesh Prajapati",
    copy: "As an extension of the Kochi Biennale Foundation's commitment to supporting emerging artistic practices beyond the exhibition period, the Foundation hosted two of the seven recipients of the Students' Biennale Tata Trusts National Awards through the KBF Residency Programme. Held from 10 June to 10 July 2026,",
  },
];

/**
 * "INTERNATIONAL AWARDS" section: get_design_context on 6:2326 does show
 * text positioned under this heading, but it duplicates three of the six
 * winners already captured in `NATIONAL_AWARDS` (same Indian-institution
 * winners of the "Students' Biennale Tata Trusts National Awards" mentioned
 * in the Residencies copy) rather than distinct international-award data.
 * Treated as a Figma placeholder/duplication artifact, not real content —
 * left as a generic placeholder per INTERNATIONAL_AWARDS_CONTENT_MISSING.
 */
const INTERNATIONAL_PLACEHOLDER_AWARDS = [
  { name: "Awardee Name", artwork: "Artwork title", institution: "Institution" },
  { name: "Awardee Name", artwork: "Artwork title", institution: "Institution" },
  { name: "Awardee Name", artwork: "Artwork title", institution: "Institution" },
];

export function Programmes() {
  const root = useRef<HTMLDivElement>(null);
  const [resIndex, setResIndex] = useState(0);
  const [heroSlide, setHeroSlide] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".prog-reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
      });

      const heroTl = gsap.timeline({ repeat: -1 });
      for (let i = 0; i < 5; i += 1) {
        heroTl
          .call(() => setHeroSlide(i))
          .to({}, { duration: 3.5 });
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

  useGSAP(
    () => {
      const el = slideRef.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1, x: 0 });
        return;
      }
      gsap.fromTo(
        el,
        { autoAlpha: 0, x: 24 },
        { autoAlpha: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    },
    { dependencies: [resIndex], scope: root }
  );

  const residency = RESIDENCIES[resIndex];
  const internationalAwards = INTERNATIONAL_AWARDS_CONTENT_MISSING
    ? INTERNATIONAL_PLACEHOLDER_AWARDS
    : INTERNATIONAL_AWARDS;

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
            />
          ))}
        </div>
      </section>

      <section className="programmes__block prog-reveal">
        <h1>UPCOMING WORKSHOPS</h1>
        <div className="programmes__cards">
          {WORKSHOPS.map((p) => (
            <article key={p.id}>
              <img src={p.image} alt="" className="programmes__card-media" />
              <h2>{p.title}</h2>
              <p className="programmes__meta">
                Date: {p.date}
                <br />
                Place: {p.place}
              </p>
              <p>{p.blurb}</p>
              <button type="button">Know more...</button>
            </article>
          ))}
        </div>
      </section>

      <section className="programmes__block prog-reveal">
        <h2>Past WORKSHOPS</h2>
        <ul className="programmes__completed">
          {PAST_WORKSHOPS.map((item) => (
            <li key={item.id}>
              <div>
                <span className="programmes__past-title">{item.title}</span>
                <span className="programmes__past-sub">
                  Facilitators: {item.facilitators}
                  <br />
                  {item.place}
                </span>
              </div>
              <span>{item.year}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="programmes__more">
          View MORE →
        </button>
      </section>

      <section className="programmes__residencies prog-reveal">
        <img src="/programmes/residency.jpg" alt="" className="programmes__res-bg" />
        <div ref={slideRef} className="programmes__res-slide">
          <div className="programmes__res-card">
            <h2>{residency.title}</h2>
            <dl>
              <div>
                <dt>Host</dt>
                <dd>{residency.host}</dd>
              </div>
              <div>
                <dt>Period</dt>
                <dd>{residency.period}</dd>
              </div>
              <div>
                <dt>Venue</dt>
                <dd>{residency.venue}</dd>
              </div>
              <div>
                <dt>Awardees</dt>
                <dd>{residency.awardees}</dd>
              </div>
            </dl>
            <p>{residency.copy}</p>
            <button type="button">Learn more...</button>
            {RESIDENCIES.length > 1 ? (
              <div className="programmes__dots">
                {RESIDENCIES.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    className={i === resIndex ? "is-active" : undefined}
                    aria-label={`Residency ${i + 1}`}
                    onClick={() => setResIndex(i)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="programmes__block prog-reveal">
        <h2>INTERNATIONAL AWARDS</h2>
        <div className="programmes__awards">
          {internationalAwards.map((a, i) => (
            <article key={`intl-${i}`}>
              <div className="programmes__award-media" aria-hidden />
              <h3>{a.name}</h3>
              <p>Artwork: {a.artwork}</p>
              <p>Institution: {a.institution}</p>
            </article>
          ))}
        </div>
        <button type="button" className="programmes__more">
          View MORE →
        </button>
      </section>

      <section className="programmes__block prog-reveal">
        <h2>NATIONAL AWARDS</h2>
        <div className="programmes__awards">
          {NATIONAL_AWARDS.map((a) => (
            <article key={a.id}>
              <img src="/programmes/award.jpg" alt="" className="programmes__award-media" />
              <h3>{a.name}</h3>
              <p>Artwork: {a.artwork}</p>
              <p>Institution: {a.institution}</p>
            </article>
          ))}
        </div>
        <button type="button" className="programmes__more">
          View MORE →
        </button>
      </section>
    </div>
  );
}
