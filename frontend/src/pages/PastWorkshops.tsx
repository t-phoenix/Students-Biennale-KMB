import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { useProgrammes } from "../lib/programmes";
import { SectionEmpty } from "../components/SectionEmpty";
import "./PastWorkshops.css";

export function PastWorkshops() {
  const root = useRef<HTMLDivElement>(null);
  const { pastWorkshops } = useProgrammes();
  const [hoveredWorkshopId, setHoveredWorkshopId] = useState<string>("");

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
        <h1 className="fig-label fig-subheading">PAST WORKSHOPS</h1>
        {pastWorkshops.length ? (
          <div className="past-workshops__items fig-c4-12">
            {pastWorkshops.map((item) => {
              const isExpanded = (hoveredWorkshopId || pastWorkshops[0]?.id) === item.id;
              return (
                <article
                  key={item.id}
                  className={`past-workshops__item${isExpanded ? " is-expanded" : ""}`}
                  onMouseEnter={() => setHoveredWorkshopId(item.id)}
                >
                  <div className="past-workshops__collapsed-wrap" aria-hidden={isExpanded}>
                    <Link
                      to={`/programmes/past-workshops/${item.id}`}
                      className="past-workshops__collapsed"
                      tabIndex={isExpanded ? -1 : 0}
                      onClick={() => setHoveredWorkshopId(item.id)}
                    >
                      <span className="past-workshops__collapsed-title">{item.title}</span>
                      <time className="past-workshops__collapsed-date">{item.year}</time>
                    </Link>
                  </div>

                  <div className="past-workshops__expanded-wrap" aria-hidden={!isExpanded}>
                    <div className="past-workshops__expanded-inner">
                      <div className="past-workshops__expanded">
                        {item.heroImage ? (
                          <div className="past-workshops__featured-img-wrap">
                            <img
                              className="past-workshops__featured-img"
                              src={item.heroImage}
                              alt=""
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="past-workshops__featured-img-wrap past-workshops__featured-placeholder" aria-hidden />
                        )}
                        <div className="past-workshops__featured-copy">
                          <div className="past-workshops__featured-head">
                            <h3>{item.title}</h3>
                            <time>{item.year}</time>
                          </div>
                          {item.facilitators ? (
                            <span className="past-workshops__facilitators">
                              Facilitators: {item.facilitators}
                            </span>
                          ) : null}
                          {item.description ? (
                            <p className="fig-body past-workshops__description">
                              {item.description.length > 220
                                ? `${item.description.slice(0, 220).trimEnd()}…`
                                : item.description}
                            </p>
                          ) : null}
                          <Link
                            to={`/programmes/past-workshops/${item.id}`}
                            className="home-text-btn past-workshops__more-btn"
                          >
                            Read more...
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <SectionEmpty>No past workshops published yet.</SectionEmpty>
        )}
      </div>
    </div>
  );
}
