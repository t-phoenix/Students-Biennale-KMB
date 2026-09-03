import { useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { SectionEmpty } from "../components/SectionEmpty";
import { usePressItems } from "../lib/pressCms";
import { PRESS } from "../data/site";
import "./Press.css";

export function Press() {
  const root = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const { items: cmsArticles } = usePressItems();
  const articles = cmsArticles.length > 0 ? cmsArticles : PRESS;

  const articleId = params.get("article") ?? articles[0]?.id;

  const featured = useMemo(
    () =>
      articles.find(
        (p) =>
          p.id === articleId ||
          (articleId === "warm-panic" && p.id === "panic") ||
          (articleId === "power-of-peta" && p.id === "peta"),
      ) ?? articles[0],
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

  const handleSelectArticle = (id: string) => {
    setParams({ article: id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <p className="press__meta">
            <span>Author :</span>
            <em>Editorial Team</em>
          </p>
          <p className="press__meta">
            <span>Published on:</span>
            <em>{featured.date}</em>
          </p>
        </div>
        <article ref={featureRef} className="press__feature fig-c4-9">
          {featured.image ? (
            <img className="press__feature-media" src={featured.image} alt={featured.title} />
          ) : null}
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

      {/* Related list spans cols 4–12, CTA locked to col 12 right (Figma 1:795 / 1:829) */}
      <div className="fig-grid press__related">
        <ul className="press__list fig-c4-12">
          {articles
            .filter((p) => p.id !== featured.id)
            .map((item) => (
              <li key={item.id} className={item.teaser ? "is-teaser" : undefined}>
                {item.teaser ? (
                  <button type="button" onClick={() => handleSelectArticle(item.id)}>
                    <div className="press__teaser fig-band-9">
                      {item.image ? <img src={item.image} alt={item.title} /> : null}
                      <div className="press__teaser-copy">
                        <div className="press__teaser-head">
                          <span>{item.title}</span>
                          <time>{item.date}</time>
                        </div>
                        <p>{item.excerpt}</p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button type="button" onClick={() => handleSelectArticle(item.id)}>
                    <span>{item.title}</span>
                    <time>{item.date}</time>
                  </button>
                )}
              </li>
            ))}
        </ul>
        <CtaLink
          className="fig-cta-end press__more"
          to="/press"
          lines={["View", "MORE"]}
          spacing={["0.26em", "0.135em"]}
        />
      </div>
    </div>
  );
}
