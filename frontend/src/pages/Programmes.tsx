import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { ResidenciesBand, type ResidencySlide } from "../components/ResidenciesBand";
import { ScholarSpotlight } from "../components/ScholarSpotlight";
import { AWARDS_INTERNATIONAL, AWARDS_NATIONAL, PAST_WORKSHOPS, RAZA_SCHOLARS } from "../data/site";
import "./Programmes.css";

/* The Residencies band on Figma 10:701 (node 10:998) shows exactly one
   residency — no other slides exist in the design, so this stays a single-item
   array rather than inventing additional ones. */
const RESIDENCY_SLIDES: ResidencySlide[] = [
  {
    id: "national-residency-2026",
    title: "Students' Biennale National Residency Award Programme",
    host: "KBF",
    period: "10 June – 10 July 2026",
    venue: "SMS Hall, Mattancherry, Kochi, Kerala",
    awardees: "Reppandee Lepcha & Durgesh Prajapati",
    copy:
      "As an extension of the Kochi Biennale Foundation's commitment to supporting emerging artistic practices beyond the exhibition period, the Foundation hosted two of the seven recipients of the Students' Biennale Tata Trusts National Awards through the KBF Residency Programme. Held from 10 June to 10 July 2026,",
    image: "/programmes/residency-1.jpg",
    moreHref: "/programmes/residencies",
  },
];

const WORKSHOPS = [
  {
    id: "w1",
    title: "WORKSHOP 01",
    date: "",
    facilitator: "",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-1.jpg",
  },
  {
    id: "w2",
    title: "WORKSHOP 02",
    date: "",
    facilitator: "",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-2.jpg",
  },
  {
    id: "w3",
    title: "WORKSHOP 03",
    date: "",
    facilitator: "",
    blurb:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966,",
    image: "/programmes/workshop-3.jpg",
  },
];

export function Programmes() {
  const root = useRef<HTMLDivElement>(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const [openScholarId, setOpenScholarId] = useState<string | null>(null);

  // The one workshop with real content (description/heroImage) leads the
  // preview so its "half open" treatment is actually visible here, not just
  // on the full listing — a plain slice(0, 2) would miss it since it's kept
  // at the end of PAST_WORKSHOPS.
  const pastWorkshopsPreview = (() => {
    const rich = PAST_WORKSHOPS.find((w) => w.description);
    const rest = PAST_WORKSHOPS.filter((w) => w !== rich);
    return (rich ? [rich, ...rest] : PAST_WORKSHOPS).slice(0, 2);
  })();

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
        <h1 className="fig-label fig-subheading">UPCOMING WORKSHOPS</h1>
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
                Facilitator : {p.facilitator}
              </p>
              <p>{p.blurb}</p>
              <button type="button" className="programmes__card-button">KNOW MORE...</button>
            </article>
          ))}
        </div>
      </section>

      <section className="programmes__block fig-grid prog-reveal">
        <h2 className="fig-label fig-subheading">PAST WORKSHOPS</h2>
        <ul className="programmes__completed fig-c4-12">
          {pastWorkshopsPreview.map((item) => {
            const isOpen = Boolean(item.description);
            return (
              <li key={item.id} className={isOpen ? "is-open" : undefined}>
                <Link to={`/programmes/past-workshops/${item.id}`}>
                  {isOpen && item.heroImage ? (
                    <span className="programmes__past-thumb">
                      <img src={item.heroImage} alt="" />
                    </span>
                  ) : null}
                  <div className="programmes__past-body">
                    <div className="programmes__past-head">
                      <span className="programmes__past-title">{item.title}</span>
                      <span>{item.year}</span>
                    </div>
                    <span className="programmes__past-sub">Facilitators: {item.facilitators}</span>
                    {isOpen ? (
                      <span className="programmes__past-snippet">
                        {item.description!.length > 180
                          ? `${item.description!.slice(0, 180).trimEnd()}…`
                          : item.description}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link to="/programmes/past-workshops" className="fig-cta-end programmes__more">
          <CtaLink
            lines={["VIEW", "MORE"]}
            spacing={["0.26em", "0.135em"]}
          />
        </Link>
      </section>

      {/* Order: International Awards, with Raza Scholarship nested right after
          it, then National Awards. */}
      <div id="awards">
        <section className="programmes__block fig-grid prog-reveal">
          <h2 className="fig-label fig-subheading">INTERNATIONAL AWARDS</h2>
          <div className="programmes__awards fig-c4-12 fig-sub-3">
            {AWARDS_INTERNATIONAL.map((a) => (
              <Link
                key={`international-${a.name}`}
                className="programmes__award"
                to={`/editions/2025-26/artworks/${a.artworkId}`}
              >
                <div className="programmes__award-media">
                  <img src="/programmes/award.jpg" alt="" />
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

        <section className="programmes__block fig-grid prog-reveal">
          <Link to="/programmes/raza-scholarship" className="fig-c4-12 programmes__raza-heading">
            <h2 className="programmes__raza-title">{`Raza - Students' Biennale Scholarship`}</h2>
          </Link>
          <div className="programmes__raza-cards fig-c4-12 fig-sub-2">
            {RAZA_SCHOLARS.map((scholar) => (
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

        <section className="programmes__block fig-grid prog-reveal">
          <h2 className="fig-label fig-subheading">NATIONAL AWARDS</h2>
          <div className="programmes__awards fig-c4-12 fig-sub-3">
            {AWARDS_NATIONAL.map((a) => (
              <Link
                key={`national-${a.name}`}
                className="programmes__award"
                to={`/editions/2025-26/artworks/${a.artworkId}`}
              >
                <div className="programmes__award-media">
                  <img src="/programmes/award.jpg" alt="" />
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
      </div>

      <ResidenciesBand slides={RESIDENCY_SLIDES} />

      <ScholarSpotlight scholarId={openScholarId} onClose={() => setOpenScholarId(null)} />
    </div>
  );
}
