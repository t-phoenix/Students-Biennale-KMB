import { useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { useProgrammes } from "../lib/programmes";
import "./PastWorkshops.css";

export function PastWorkshops() {
  const root = useRef<HTMLDivElement>(null);
  const { pastWorkshops } = useProgrammes();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".past-workshops-reveal", {
        autoAlpha: 0,
        y: 24,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "opacity,visibility,transform",
      });
    },
    { scope: root, dependencies: [pastWorkshops.map((item) => item.id).join("|")] }
  );

  return (
    <div ref={root} className="past-workshops">
      <div className="fig-grid past-workshops__section past-workshops-reveal">
        <h1 className="fig-label">PAST WORKSHOPS</h1>
        <ul className="past-workshops__list fig-c4-12">
          {pastWorkshops.map((item) => (
            <li key={item.id}>
              <Link to={`/programmes/past-workshops/${item.id}`}>
                <div>
                  <span className="past-workshops__title">{item.title}</span>
                  <span className="past-workshops__sub">Facilitators: {item.facilitators}</span>
                </div>
                <span className="past-workshops__year">{item.year}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
