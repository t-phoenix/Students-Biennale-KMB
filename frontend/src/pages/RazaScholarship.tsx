import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { ScholarSpotlight } from "../components/ScholarSpotlight";
import { useProgrammes } from "../lib/programmes";
import "./RazaScholarship.css";

export function RazaScholarship() {
  const root = useRef<HTMLDivElement>(null);
  const [openScholarId, setOpenScholarId] = useState<string | null>(null);
  const { raza } = useProgrammes();

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
          <h1 className="raza-scholarship__title">{raza.title}</h1>
          <p className="raza-scholarship__subtitle">{raza.subtitle}</p>

          <div className="raza-scholarship__description">
            {raza.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="fig-c10-12">
          <div className="raza-scholarship__scholars-list">
            {raza.scholars.map((scholar) => (
              <p key={scholar.id} className="raza-scholarship__scholars-label">
                {scholar.name}
              </p>
            ))}
            {raza.closing.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="raza-scholarship__scholars-text">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="fig-grid raza-reveal">
        <div className="raza-scholarship__scholars-section fig-c4-12 fig-sub-2">
          {raza.scholars.map((scholar) => (
            <div className="raza-scholarship__scholar" key={scholar.id}>
              <img src={scholar.image} alt="" className="raza-scholarship__scholar-image" />
              <button
                type="button"
                className="raza-scholarship__scholar-link"
                onClick={() => setOpenScholarId(scholar.id)}
              >
                <h2>{scholar.name}</h2>
              </button>
            </div>
          ))}
        </div>
      </div>

      <ScholarSpotlight
        scholarId={openScholarId}
        scholars={raza.scholars}
        onClose={() => setOpenScholarId(null)}
      />
    </div>
  );
}
