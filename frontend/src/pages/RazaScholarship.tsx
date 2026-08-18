import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { ScholarSpotlight } from "../components/ScholarSpotlight";
import { RAZA_SCHOLARS } from "../data/site";
import "./RazaScholarship.css";

export function RazaScholarship() {
  const root = useRef<HTMLDivElement>(null);
  const [openScholarId, setOpenScholarId] = useState<string | null>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".raza-reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "opacity,visibility,transform",
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="raza-scholarship">
      <div className="fig-grid raza-scholarship__content raza-reveal">
        <div className="fig-c4-9">
          <h1 className="raza-scholarship__title">Students' Biennale 2025–26 x Beaux Arts de Marseille</h1>
          <p className="raza-scholarship__subtitle">te(a)m-plurality, curatorial note by GABAA</p>

          <div className="raza-scholarship__description">
            <p>
              This edition of the Students' Biennale marks a renewed commitment to international exchange through a
              collaboration between the Kochi Biennale Foundation and Beaux-Arts de Marseille, supported by Institut
              Français and the Raza Foundation. The partnership invites two Master Practice students from Beaux-Arts de
              Marseille to develop and present new work as part of the Students' Biennale, situating their artistic
              practices within the unique cultural and social contexts of the Kochi-Muziris Biennale. Their time in
              Kochi allows them to create, install, and refine their projects in dialogue with local environments, peers,
              and the wider cohort of participating student artists from across India.
            </p>
            <p>
              An open call was established among the Master Practice students from Beaux Arts de Marseille, following
              which a jury was conducted. The two selected artist-participants who exhibited their work at the 6th
              Students' Biennale edition were:
            </p>
          </div>
        </div>

        <div className="fig-c10-12">
          <div className="raza-scholarship__scholars-list">
            <p className="raza-scholarship__scholars-label">Kaki Weiss</p>
            <p className="raza-scholarship__scholars-label">Nina Durel</p>
            <p className="raza-scholarship__scholars-text">
              This collaboration is envisioned as a two-way exchange. Once the Students' Biennale opened, a dedicated
              jury selected two student artists from among the overall exhibited projects from across institutions in
              India to undertake a residency at Beaux-Arts de Marseille in the 2026–27 academic year. Through this
              reciprocal model, the programme fosters long-term artistic relationships, new pedagogical encounters, and
              pathways for expanded learning across geographies.
            </p>
          </div>
        </div>
      </div>

      <div className="fig-grid raza-scholarship__scholars-section raza-reveal">
        <div className="fig-c4-9">
          <div className="raza-scholarship__scholar">
            <img src={RAZA_SCHOLARS[0].image} alt="" className="raza-scholarship__scholar-image" />
            <button
              type="button"
              className="raza-scholarship__scholar-link"
              onClick={() => setOpenScholarId(RAZA_SCHOLARS[0].id)}
            >
              <h2>{RAZA_SCHOLARS[0].name}</h2>
            </button>
          </div>
        </div>

        <div className="fig-c10-12">
          <div className="raza-scholarship__scholar">
            <img src={RAZA_SCHOLARS[1].image} alt="" className="raza-scholarship__scholar-image" />
            <button
              type="button"
              className="raza-scholarship__scholar-link"
              onClick={() => setOpenScholarId(RAZA_SCHOLARS[1].id)}
            >
              <h2>{RAZA_SCHOLARS[1].name}</h2>
            </button>
          </div>
        </div>
      </div>

      <ScholarSpotlight scholarId={openScholarId} onClose={() => setOpenScholarId(null)} />
    </div>
  );
}
