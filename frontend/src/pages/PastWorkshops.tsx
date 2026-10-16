import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { useProgrammes } from "../lib/programmes";
import { SectionEmpty } from "../components/SectionEmpty";
import "./PastWorkshops.css";

export function PastWorkshops() {
  const root = useRef<HTMLDivElement>(null);
  const { pastWorkshops } = useProgrammes();
  const [clickedWorkshopId, setClickedWorkshopId] = useState<string>("");
  const [hoveredWorkshopId, setHoveredWorkshopId] = useState<string>("");
  const workshopHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDesktopHover = useCallback(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth > 899 &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    [],
  );

  const handleWorkshopPointerEnter = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (e.pointerType !== "mouse" || !isDesktopHover()) return;
      if (workshopHoverTimerRef.current) clearTimeout(workshopHoverTimerRef.current);
      workshopHoverTimerRef.current = setTimeout(() => {
        setHoveredWorkshopId(id);
      }, 35);
    },
    [isDesktopHover],
  );

  const handleWorkshopPointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || !isDesktopHover()) return;
      if (workshopHoverTimerRef.current) clearTimeout(workshopHoverTimerRef.current);
      workshopHoverTimerRef.current = setTimeout(() => {
        setHoveredWorkshopId("");
      }, 80);
    },
    [isDesktopHover],
  );

  const handleToggleWorkshop = useCallback((id: string) => {
    if (workshopHoverTimerRef.current) clearTimeout(workshopHoverTimerRef.current);
    setHoveredWorkshopId("");
    setClickedWorkshopId((prev) => (prev === id ? "" : id));
  }, []);

  const activeWorkshopId = clickedWorkshopId || hoveredWorkshopId;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ".past-workshops-reveal",
        { autoAlpha: 0, y: 44 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.45,
          stagger: 0.12,
          ease: "cubic-bezier(0.12, 0.8, 0.25, 1)",
          clearProps: "opacity,visibility,transform",
        }
      );
    },
    { scope: root, dependencies: [pastWorkshops.map((item) => item.id).join("|")] }
  );

  return (
    <div ref={root} className="past-workshops">
      <div className="fig-grid past-workshops__section past-workshops-reveal">
        <h1 className="fig-label fig-subheading">PAST WORKSHOPS</h1>
        {pastWorkshops.length ? (
          <div
            className="past-workshops__items fig-c4-12"
            onPointerLeave={handleWorkshopPointerLeave}
          >
            {pastWorkshops.map((item) => {
              const isExpanded = activeWorkshopId === item.id;
              return (
                <article
                  key={item.id}
                  data-id={item.id}
                  className={`past-workshops__item${isExpanded ? " is-expanded" : ""}`}
                  onPointerEnter={(e) => handleWorkshopPointerEnter(e, item.id)}
                >
                  <button
                    type="button"
                    className="past-workshops__header"
                    aria-expanded={isExpanded}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleToggleWorkshop(item.id)}
                  >
                    <span className="past-workshops__title">{item.title}</span>
                    <time className="past-workshops__date">{item.year}</time>
                  </button>

                  <div className="past-workshops__drawer-wrap" aria-hidden={!isExpanded}>
                    <div className="past-workshops__drawer-inner">
                      <div className="past-workshops__drawer-content">
                        {item.heroImage ? (
                          <Link
                            to={`/programmes/past-workshops/${item.id}`}
                            className="past-workshops__drawer-media"
                            tabIndex={isExpanded ? 0 : -1}
                            aria-label={`Read ${item.title}`}
                          >
                            <img
                              className="past-workshops__drawer-img"
                              src={item.heroImage}
                              alt=""
                              loading="lazy"
                            />
                          </Link>
                        ) : (
                          <div
                            className="past-workshops__drawer-media past-workshops__drawer-placeholder"
                            aria-hidden
                          />
                        )}
                        <div className="past-workshops__drawer-copy">
                          {item.facilitators ? (
                            <span className="past-workshops__facilitators">
                              Facilitators : {item.facilitators}
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
                            tabIndex={isExpanded ? 0 : -1}
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
