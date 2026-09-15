import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { SectionEmpty } from "../components/SectionEmpty";
import { MetaGrid, MetaRow } from "../components/MetaGrid";
import { usePressItems } from "../lib/pressCms";
import { DEFAULT_PRESS_ITEMS } from "../data/press";
import "./Press.css";

export function Press() {
  const root = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const { items: cmsPressItems } = usePressItems();
  const articles = cmsPressItems.length > 0 ? cmsPressItems : DEFAULT_PRESS_ITEMS;
  const [hoveredArticleId, setHoveredArticleId] = useState<string>("");

  const articleId = params.get("article") ?? articles[0]?.id;

  const featured = useMemo(
    () => articles.find((p) => p.id === articleId) ?? articles[0],
    [articleId, articles],
  );

  const relatedArticles = useMemo(
    () => articles.filter((p) => p.id !== featured?.id),
    [articles, featured?.id],
  );

  const activeArticleId =
    hoveredArticleId && relatedArticles.some((p) => p.id === hoveredArticleId)
      ? hoveredArticleId
      : relatedArticles[0]?.id;

  const handleSelect = useCallback(
    (id: string) => {
      setParams({ article: id });
      setHoveredArticleId("");
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [setParams],
  );

  useGSAP(
    () => {
      const el = featureRef.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
    },
    { dependencies: [featured?.id], scope: root },
  );

  if (!featured) {
    return (
      <div ref={root} className="press">
        <SectionEmpty className="press__empty">No press articles published yet.</SectionEmpty>
      </div>
    );
  }

  return (
    <div ref={root} className="press">
      {/* Title and byline on cols 1–3, article on cols 4–9 (Figma 1:789 / 1:793) */}
      <div className="fig-grid press__head">
        <div className="press__rail fig-rail">
          <h1>{featured.title}</h1>
          <MetaGrid className="press__meta">
            <MetaRow label="Author" value="Editorial Team" />
            <MetaRow label="Published on" value={featured.date} />
          </MetaGrid>
        </div>
        <article ref={featureRef} className="press__feature fig-c4-9">
          <div className="press__feature-media">
            {featured.image ? (
              <img src={featured.image} alt="" />
            ) : (
              <div aria-hidden />
            )}
          </div>
          {featured.body ? (
            <div className="press__body">
              {featured.body.split("\n\n").map((para) => (
                <p key={para.slice(0, 48)}>{para}</p>
              ))}
            </div>
          ) : (
            <p>{featured.excerpt}</p>
          )}
          {featured.url ? (
            <a
              href={featured.url}
              target="_blank"
              rel="noreferrer"
              className="home-text-btn press__read-btn"
            >
              Read article...
            </a>
          ) : null}
        </article>
      </div>

      {/* Related list spans cols 4–12 (Figma 1:795 / 1:829) */}
      {relatedArticles.length > 0 ? (
        <div className="fig-grid press__related">
          <ul className="press__list fig-c4-12">
            {relatedArticles.map((item) => {
              const isExpanded = activeArticleId === item.id;

              return (
                <li
                  key={item.id}
                  className={`press__item${isExpanded ? " is-expanded" : ""}`}
                  onMouseEnter={() => setHoveredArticleId(item.id)}
                >
                  {/* Collapsed trigger */}
                  <div className="press__collapsed-wrap" aria-hidden={isExpanded}>
                    <button
                      type="button"
                      className="press__collapsed"
                      tabIndex={isExpanded ? -1 : 0}
                      onClick={() => handleSelect(item.id)}
                    >
                      <span className="press__collapsed-title">{item.title}</span>
                      {item.date ? (
                        <time className="press__collapsed-date">{item.date}</time>
                      ) : null}
                    </button>
                  </div>

                  {/* Expanded teaser card */}
                  <div className="press__expanded-wrap" aria-hidden={!isExpanded}>
                    <div className="press__expanded-inner">
                      <div className="press__teaser">
                        <button
                          type="button"
                          className="press__teaser-media"
                          tabIndex={isExpanded ? 0 : -1}
                          onClick={() => handleSelect(item.id)}
                          aria-label={`Open article: ${item.title}`}
                        >
                          {item.image ? (
                            <img src={item.image} alt="" loading="lazy" />
                          ) : (
                            <div aria-hidden />
                          )}
                        </button>

                        <div className="press__teaser-copy">
                          <button
                            type="button"
                            className="press__teaser-head"
                            tabIndex={isExpanded ? 0 : -1}
                            onClick={() => handleSelect(item.id)}
                            aria-label={`Open article: ${item.title}`}
                          >
                            <h3>{item.title}</h3>
                            {item.date ? <time>{item.date}</time> : null}
                          </button>

                          {item.body ? (
                            <div className="press__teaser-body">
                              {item.body
                                .split("\n\n")
                                .slice(0, 1)
                                .map((para, pIdx) => (
                                  <p key={pIdx}>{para}</p>
                                ))}
                            </div>
                          ) : item.excerpt ? (
                            <p>{item.excerpt}</p>
                          ) : null}

                          <button
                            type="button"
                            className="home-text-btn press__read-btn"
                            tabIndex={isExpanded ? 0 : -1}
                            onClick={() => handleSelect(item.id)}
                          >
                            Read article...
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
