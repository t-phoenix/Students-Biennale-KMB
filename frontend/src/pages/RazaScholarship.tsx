import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { ScholarSpotlight } from "../components/ScholarSpotlight";
import { BrandArrow } from "../components/BrandArrow";
import { RAZA_SCHOLARS } from "../data/site";
import "./RazaScholarship.css";

const SCHOLAR_CAPTIONS: Record<string, string> = {
  "kaki-weiss":
    "Special participation - International Exchange Award supported by Institut Français India, Beaux Arts de Marseille and Kochi Biennale Foundation.",
  "nina-durel":
    "Special participation - International Exchange Award supported by Institut Français India, Beaux Arts de Marseille and Kochi Biennale Foundation.",
  "rutuja-sonawane":
    "Awarded the Raza-Students’ Biennale Scholarship - International Exchange Award supported by The Institut Français India, Raza Foundation, Beaux Arts de Marseille and Kochi Biennale Foundation.",
  "mohammad-riyaz":
    "Awarded the Raza-Students’ Biennale Scholarship - International Exchange Award supported by The Institut Français India, Raza Foundation, Beaux Arts de Marseille and Kochi Biennale Foundation.",
};

export function RazaScholarship() {
  const root = useRef<HTMLDivElement>(null);
  const [openScholarId, setOpenScholarId] = useState<string | null>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".raza-reveal", {
        autoAlpha: 0,
        y: 16,
        duration: 0.65,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "opacity,visibility,transform",
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="raza-page">
      <div className="fig-grid raza-page__grid raza-reveal">
        {/* Left Rail */}
        <aside className="fig-c1-3 raza-page__rail">
          <h1 className="raza-page__rail-title">
            STUDENTS’ BIENNALE 2025–26 X BEAUX ARTS DE MARSEILLE
          </h1>
          <div className="raza-page__rail-divider" aria-hidden />
          <p className="raza-page__rail-subtitle">
            Raza - Students&apos; Biennale Scholarship
          </p>
        </aside>

        {/* Right Main Area */}
        <div className="fig-c4-12 raza-page__main">
          {/* 2-Column Curatorial Text */}
          <div className="raza-page__editorial fig-sub-2">
            <div className="raza-page__col">
              <p>
                The 2025-26 edition marked the launch of a new, first-of-its-kind collaborative
                exchange between the Students&apos; Biennale and Beaux-Arts de Marseille; a two-phase,
                reciprocal residency model designed to build sustained artistic dialogue between
                India and France.
              </p>
              <p>
                In the first phase, Kaki Weiss and Nina Durel, selected through an open call at
                Beaux-Arts de Marseille, travelled to Kochi for a two-week residency from 1-15
                December 2025, supported jointly by the French Institute in India (IFI), the
                Kochi Biennale Foundation, and Beaux-Arts de Marseille. During their residency, they
                created new work in dialogue with the city and the wider cohort of participating
                student artists, which was exhibited as part of the 2025-26 Students&apos; Biennale.
              </p>
            </div>
            <div className="raza-page__col">
              <p>
                The exchange then turned outward: from among the participants of the Students&apos;
                Biennale, two Indian artists were selected for a fully-funded, residency-like
                semester in Marseille — the second and reciprocal half of the exchange. Following a
                rigorous two-month selection process by an independent jury, Rutuja Sonawane and
                Mohammad Riyaz were chosen from among 183 participants in the 2025-26 edition.
                Supported by IFI, the Raza Foundation, and Beaux-Arts de Marseille, this second
                phase has come to be known as the Raza-Students&apos; Biennale Scholarship.
              </p>
              <p>
                Together, these two phases form a complete, reciprocal cycle of exchange and in
                doing so, the programme aims to establish an ongoing structure for mobility,
                research, and cross-cultural learning ensuring the Students&apos; Biennale&apos;s
                reach extends well beyond Kochi.
              </p>
            </div>
          </div>

          {/* 2x2 Scholars Grid */}
          <div className="raza-page__scholars fig-sub-2">
            {RAZA_SCHOLARS.map((scholar) => (
              <article key={scholar.id} className="raza-page__scholar-card">
                <button
                  type="button"
                  className="raza-page__scholar-btn"
                  onClick={() => setOpenScholarId(scholar.id)}
                  aria-label={`View artwork by ${scholar.name}`}
                >
                  <div className="raza-page__scholar-media">
                    <img src={scholar.image} alt={scholar.name} />
                  </div>
                  <h2 className="raza-page__scholar-name">{scholar.name}</h2>
                </button>
                <p className="raza-page__scholar-caption">
                  {SCHOLAR_CAPTIONS[scholar.id]}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="fig-grid raza-page__nav raza-reveal">
        <Link className="fig-c1-3 detail__back" to="/programmes#awards">
          <BrandArrow direction="left" />
          <span>BACK</span>
        </Link>
      </div>

      <ScholarSpotlight
        scholarId={openScholarId}
        scholars={RAZA_SCHOLARS}
        onClose={() => setOpenScholarId(null)}
      />
    </div>
  );
}
