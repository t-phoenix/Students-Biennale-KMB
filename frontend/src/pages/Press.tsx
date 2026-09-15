import { useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { SectionEmpty } from "../components/SectionEmpty";
import { MetaGrid, MetaRow } from "../components/MetaGrid";
import { usePressItems } from "../lib/pressCms";
import "./Press.css";

export function Press() {
  const root = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const { items: articles } = usePressItems();

  const articleId = params.get("article") ?? articles[0]?.id;

  const featured = useMemo(
    () => articles.find((p) => p.id === articleId) ?? articles[0],
    [articleId, articles],
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
            <a href={featured.url} target="_blank" rel="noreferrer">
              View original
            </a>
          ) : null}
        </article>
      </div>

      {/* Related list spans cols 4–12 (Figma 1:795 / 1:829) */}
      <div className="fig-grid press__related">
        <ul className="press__list fig-c4-12">
          {articles
            .filter((p) => p.id !== featured.id)
            .map((item, index) => {
              const isFirst = index === 0;
              const handleSelect = () => {
                setParams({ article: item.id });
                window.scrollTo({ top: 0, behavior: "smooth" });
              };

              return (
                <li key={item.id} className={isFirst ? "is-teaser" : undefined}>
                  {isFirst ? (
                    <button type="button" onClick={handleSelect}>
                      <div className="press__teaser fig-band-9">
                        <div className="press__teaser-media">
                          {item.image ? <img src={item.image} alt="" /> : <div aria-hidden />}
                        </div>
                        <div className="press__teaser-copy">
                          <div className="press__teaser-head">
                            <span>{item.title}</span>
                            {item.date ? <time>{item.date}</time> : null}
                          </div>
                          {item.body ? (
                            <div className="press__teaser-body">
                              {item.body.split("\n\n").map((para, pIdx) => (
                                <p key={pIdx}>{para}</p>
                              ))}
                            </div>
                          ) : item.excerpt ? (
                            <p>{item.excerpt}</p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button type="button" onClick={handleSelect}>
                      <span>{item.title}</span>
                      {item.date ? <time>{item.date}</time> : null}
                    </button>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}
