import { useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { PRESS } from "../data/site";
import "./Press.css";

export function Press() {
  const root = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const articleId = params.get("article") ?? PRESS[0].id;

  const featured = useMemo(
    () => PRESS.find((p) => p.id === articleId) ?? PRESS[0],
    [articleId]
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
    { dependencies: [featured.id], scope: root }
  );

  return (
    <div ref={root} className="press">
      <div className="press__layout">
        <aside>
          <p className="press__meta">
            <span>Author :</span>
            <em>Editorial Team</em>
          </p>
          <p className="press__meta">
            <span>Published on:</span>
            <em>{featured.date}</em>
          </p>
        </aside>
        <div>
          <article ref={featureRef} className="press__feature">
            {featured.image ? (
              <img className="press__feature-media" src={featured.image} alt="" />
            ) : (
              <div className="press__feature-media" aria-hidden />
            )}
            <h1>{featured.title}</h1>
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

          <ul className="press__list">
            {PRESS.filter((p) => p.id !== featured.id).map((item) => (
              <li key={item.id} className={item.teaser ? "is-teaser" : undefined}>
                {item.teaser ? (
                  <button type="button" onClick={() => setParams({ article: item.id })}>
                    <div className="press__teaser">
                      {item.image ? <img src={item.image} alt="" /> : <div aria-hidden />}
                      <div>
                        <div className="press__teaser-head">
                          <span>{item.title}</span>
                          <time>{item.date}</time>
                        </div>
                        <p>{item.excerpt}</p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button type="button" onClick={() => setParams({ article: item.id })}>
                    <span>{item.title}</span>
                    <time>{item.date}</time>
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button type="button" className="press__more">
            View MORE →
          </button>
        </div>
      </div>
    </div>
  );
}
