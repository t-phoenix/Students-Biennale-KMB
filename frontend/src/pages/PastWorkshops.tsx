import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useReadingOrderReveal } from "../lib/sequence";
import { onAccordionKeyDown, rowClickOpensArticle, useAccordionHover, useEqualDrawerHeights } from "../lib/accordionScroll";
import { useProgrammes } from "../lib/programmes";
import { SectionEmpty } from "../components/SectionEmpty";
import "./PastWorkshops.css";

export function PastWorkshops() {
  const root = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pastWorkshops } = useProgrammes();
  // One workshop open at a time. null until the first click or hover: the first one starts open.
  const [openWorkshopId, setOpenWorkshopId] = useState<string | null>(null);
  const workshopHover = useAccordionHover(setOpenWorkshopId);
  const listRef = useRef<HTMLDivElement>(null);
  // Every workshop opens to the same height, so the section never changes height.
  useEqualDrawerHeights(listRef, ".past-workshops__drawer-content", pastWorkshops.length);
  const activeWorkshopId = openWorkshopId ?? pastWorkshops[0]?.id ?? "";

  // Rows arrive one by one in reading order.
  useReadingOrderReveal(root, { key: pastWorkshops.map((item) => item.id).join("|"), delay: 0.12 });

  return (
    <div ref={root} className="past-workshops">
      <div className="fig-grid past-workshops__section past-workshops-reveal">
        <h1 className="fig-label fig-subheading">PAST WORKSHOPS</h1>
        {pastWorkshops.length ? (
          <div ref={listRef} className="past-workshops__items fig-c4-12">
            {pastWorkshops.map((item) => {
              const isExpanded = activeWorkshopId === item.id;
              return (
                <article
                  key={item.id}
                  data-id={item.id}
                  className={`past-workshops__item${isExpanded ? " is-expanded" : ""}`}
                  onPointerMove={(e) => workshopHover.onRowPointerMove(e, item.id, isExpanded)}
                  onPointerLeave={() => workshopHover.onRowPointerLeave(item.id)}
                >
                  <button
                    type="button"
                    className="past-workshops__header"
                    aria-expanded={isExpanded}
                    onMouseDown={(e) => e.preventDefault()}
                    onKeyDown={onAccordionKeyDown}
                    onClick={(e) => {
                      workshopHover.onRowClick(item.id);
                      // Hover expands; a click opens the full workshop (touch: first tap expands).
                      if (rowClickOpensArticle(e, isExpanded)) navigate(`/programmes/past-workshops/${item.id}`);
                      else setOpenWorkshopId(item.id);
                    }}
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
