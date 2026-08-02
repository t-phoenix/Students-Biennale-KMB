import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import "./Programmes.css";

const WORKSHOPS = [
  {
    id: "w1",
    title: "workshop 01",
    date: "TBA",
    time: "TBA",
    blurb:
      "Material practice and peer critique sessions with mid-career mentors across Fort Kochi venues.",
    image: "/programmes/workshop-1.jpg",
  },
  {
    id: "w2",
    title: "workshop 02",
    date: "TBA",
    time: "TBA",
    blurb: "Collaborative making labs that treat the classroom as shared ground for experiment.",
    image: "/programmes/workshop-2.jpg",
  },
  {
    id: "w3",
    title: "workshop 03",
    date: "TBA",
    time: "TBA",
    blurb: "Short intensive sessions supporting research, publishing, and collective work.",
    image: "/programmes/workshop-3.jpg",
  },
];

const PAST = [
  { title: "Peer Critique Intensive", facilitators: "Facilitators · Kochi", year: "2019" },
  { title: "Regional Mentorship Circles", facilitators: "Collectives · Multi-city", year: "2018" },
  { title: "Material Residencies", facilitators: "Visiting mentors", year: "2018" },
  { title: "Pedagogy Labs", facilitators: "Educators network", year: "2017" },
];

const RESIDENCIES = [
  {
    id: "r1",
    title: "Students' Biennale National Residency Award Programme",
    host: "Kochi Biennale Foundation",
    period: "2025–26",
    venue: "Fort Kochi",
    awardees: "Selected participants",
    copy: "A focused residency for collaborative material research with visiting mentors and peer exchange.",
  },
  {
    id: "r2",
    title: "Pedagogy Labs Residency",
    host: "KBF Education",
    period: "2024",
    venue: "Kochi",
    awardees: "Regional cohorts",
    copy: "Workshops that treat the classroom as a shared ground for experiment and care.",
  },
];

const AWARDS = [
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
                Time: {p.time}
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
          {PAST.map((item) => (
            <li key={item.title}>
              <div>
                <span className="programmes__past-title">{item.title}</span>
                <span className="programmes__past-sub">{item.facilitators}</span>
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
          </div>
        </div>
      </section>

      {(["INTERNATIONAL AWARDS", "NATIONAL AWARDS"] as const).map((heading) => (
        <section key={heading} className="programmes__block prog-reveal">
          <h2>{heading}</h2>
          <div className="programmes__awards">
            {AWARDS.map((a, i) => (
              <article key={`${heading}-${i}`}>
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
      ))}
    </div>
  );
}
