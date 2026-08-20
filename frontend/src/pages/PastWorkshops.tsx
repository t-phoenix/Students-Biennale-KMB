import { useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { PAST_WORKSHOPS } from "../data/site";
import "./PastWorkshops.css";

export function PastWorkshops() {
  const root = useRef<HTMLDivElement>(null);

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
    { scope: root }
  );

  return (
    <div ref={root} className="past-workshops">
      <div className="fig-grid past-workshops__section past-workshops-reveal">
        <h1 className="fig-label fig-subheading">PAST WORKSHOPS</h1>
        <ul className="past-workshops__list fig-c4-12">
          {PAST_WORKSHOPS.map((item) => {
            const isOpen = Boolean(item.description);
            return (
              <li key={item.id} className={isOpen ? "is-open" : undefined}>
                <Link to={`/programmes/past-workshops/${item.id}`}>
                  {isOpen && item.heroImage ? (
                    <span className="past-workshops__thumb">
                      <img src={item.heroImage} alt="" />
                    </span>
                  ) : null}
                  <span className="past-workshops__body">
                    <span className="past-workshops__row-head">
                      <span className="past-workshops__title">{item.title}</span>
                      <span className="past-workshops__year">{item.year}</span>
                    </span>
                    <span className="past-workshops__sub">Facilitators: {item.facilitators}</span>
                    {isOpen ? (
                      <span className="past-workshops__snippet">
                        {item.description!.length > 220
                          ? `${item.description!.slice(0, 220).trimEnd()}…`
                          : item.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
