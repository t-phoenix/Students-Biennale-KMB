import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { ResidenciesBand, type ResidencySlide } from "../components/ResidenciesBand";
import { AWARDS_INTERNATIONAL, AWARDS_NATIONAL, PAST_WORKSHOPS } from "../data/site";
import { parseProgrammeHash, scrollToId } from "../lib/scrollToSection";
import "./Programmes.css";

/* Upcoming workshops are still Lorem Ipsum in the design itself (Figma 1:1658 /
   1:1669 / 1:1680) — date and place are genuinely blank, not withheld from us. */
const WORKSHOPS = [
  {
    id: "w1",
    title: "workshop 01",
    date: "",
    place: "",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-1.jpg",
  },
  {
    id: "w2",
    title: "workshop 02",
    date: "",
    place: "",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-2.jpg",
  },
  {
    id: "w3",
    title: "workshop 03",
    date: "",
    place: "",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-3.jpg",
  },
];

const RESIDENCY_SLIDES: ResidencySlide[] = [
  {
    id: "r1",
    title: "Students' Biennale National Residency Award Programme",
    host: "KBF",
    period: "10 June – 10 July 2026",
    venue: "SMS Hall, Mattancherry, Kochi, Kerala",
    awardees: "Reppandee Lepcha & Durgesh Prajapati",
    copy:
      "As an extension of the Kochi Biennale Foundation's commitment to supporting emerging artistic practices beyond the exhibition period, the Foundation hosted two of the seven recipients of the Students' Biennale Tata Trusts National Awards through the KBF Residency Programme. Held from 10 June to 10 July 2026,",
    image: "/programmes/residency-1.jpg",
  },
  {
    id: "r2",
    title: "Pedagogy Labs Residency",
    host: "KBF Education",
    period: "12 Aug – 10 Sep 2025",
    venue: "Fort Kochi",
    awardees: "Regional cohorts",
    copy:
      "Workshops that treat the classroom as a shared ground for experiment and care, with visiting mentors and peer critique across a month-long studio residency.",
    image: "/programmes/residency-2.jpg",
  },
  {
    id: "r3",
    title: "Material Research Residency",
    host: "KBF",
    period: "2024",
    venue: "BMS Warehouse, Mattancherry",
    awardees: "Selected participants",
    copy:
      "A focused residency for collaborative material research with visiting mentors and peer exchange in the historic warehouse precincts of Mattancherry.",
    image: "/programmes/residency-3.jpg",
  },
  {
    id: "r4",
    title: "Students' Biennale National Residency Award Programme",
    host: "KBF",
    period: "20 June – 15 July 2021",
    venue: "BRP, ABC, Mattancherry, Kochi, Kerala",
    awardees: "Residencies, Kochi & Gurgaon (Haryana)",
    copy:
      "As an extension of the Kochi Biennale Foundation's commitment to supporting emerging artists, the residency programme offers focused studio time and peer exchange in Fort Kochi.",
    image: "/programmes/residency-4.jpg",
  },
  {
    id: "r5",
    title: "Inaugural Residency Exchange",
    host: "KBF",
    period: "2015",
    venue: "Mohammed Ali Warehouse",
    awardees: "Inaugural cohort",
    copy:
      "An early exchange that placed student practitioners inside the Biennale's working sites, establishing the residency as a lasting strand of the Students' Biennale.",
    image: "/programmes/residency-5.jpg",
  },
];

export function Programmes() {
  const root = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const id = parseProgrammeHash(location.hash);
    if (!id) return;

    let cancelled = false;
    const go = () => {
      if (!cancelled) scrollToId(id);
    };

    go();
    const t1 = window.setTimeout(go, 120);
    const t2 = window.setTimeout(go, 400);
    const t3 = window.setTimeout(go, 900);

    const imgs = root.current?.querySelectorAll("img") ?? [];
    const onLoad = () => go();
    imgs.forEach((img) => {
      if (!img.complete) img.addEventListener("load", onLoad, { once: true });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      imgs.forEach((img) => img.removeEventListener("load", onLoad));
    };
  }, [location.hash, location.pathname]);

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
            />
          ))}
        </div>
      </section>

      <section id="workshops" className="programmes__block fig-grid prog-reveal">
        <h1 className="fig-label">UPCOMING WORKSHOPS</h1>
        <div className="programmes__cards fig-c4-12 fig-sub-3">
          {WORKSHOPS.map((p) => (
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
              <button type="button">Know more...</button>
            </article>
          ))}
        </div>
      </section>

      <section className="programmes__block fig-grid prog-reveal">
        <h2 className="fig-label">Past WORKSHOPS</h2>
        <ul className="programmes__completed fig-c4-12">
          {PAST_WORKSHOPS.map((item) => (
            <li key={item.title}>
              <div>
                <span className="programmes__past-title">{item.title}</span>
                <span className="programmes__past-sub">Facilitators: {item.facilitators}</span>
              </div>
              <span>{item.year}</span>
            </li>
          ))}
        </ul>
        <CtaLink
          className="fig-cta-end programmes__more"
          lines={["View", "MORE"]}
          spacing={["0.26em", "0.135em"]}
        />
      </section>

      <ResidenciesBand slides={RESIDENCY_SLIDES} />

      <div id="awards">
        {(
          [
            ["INTERNATIONAL AWARDS", AWARDS_INTERNATIONAL],
            ["NATIONAL AWARDS", AWARDS_NATIONAL],
          ] as const
        ).map(([heading, awards]) => (
          <section key={heading} className="programmes__block fig-grid prog-reveal">
            <h2 className="fig-label">{heading}</h2>
            <div className="programmes__awards fig-c4-12 fig-sub-3">
              {awards.map((a) => (
                <article key={`${heading}-${a.name}`}>
                  <div className="programmes__award-media">
                    <img src="/programmes/award.jpg" alt="" />
                  </div>
                  <h3>{a.name}</h3>
                  <p>Artwork : {a.artwork}</p>
                  <p>{a.institution}</p>
                </article>
              ))}
            </div>
            <CtaLink
              className="fig-cta-end programmes__more"
              lines={["View", "MORE"]}
              spacing={["0.26em", "0.135em"]}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
