import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { SectionEmpty } from "../components/SectionEmpty";
import { MetaGrid, MetaRow } from "../components/MetaGrid";
import { BrandArrow } from "../components/BrandArrow";
import { CtaLink } from "../components/CtaLink";
import { GalleryLightbox } from "../components/GalleryLightbox";
import { usePressItems } from "../lib/pressCms";
import type { PressItem } from "../lib/pressCms/types";
import "./Press.css";

function findArticle(articles: PressItem[], key: string): PressItem | undefined {
  if (!key) return undefined;
  const lower = key.toLowerCase();
  return articles.find(
    (p) =>
      p.id.toLowerCase() === lower ||
      p.slug?.toLowerCase() === lower ||
      p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === lower ||
      p.id.toLowerCase().includes(lower) ||
      lower.includes(p.id.toLowerCase()),
  );
}

export function Press() {
  const root = useRef<HTMLDivElement>(null);
  const featureRef = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const { items: articles } = usePressItems();
  const [hoveredArticleId, setHoveredArticleId] = useState<string>("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const articleParam = params.get("article");

  const featured = useMemo(() => {
    if (articleParam) {
      const match = findArticle(articles, articleParam);
      if (match) return match;
    }
    return articles[0];
  }, [articleParam, articles]);

  const relatedArticles = useMemo(
    () => articles.filter((p) => p.id !== featured?.id),
    [articles, featured?.id],
  );

  const articleIndex = useMemo(
    () => articles.findIndex((p) => p.id === featured?.id),
    [articles, featured?.id],
  );

  const nextArticle =
    articleIndex >= 0 && articles.length > 1
      ? articles[(articleIndex + 1) % articles.length]
      : undefined;

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

  const gallery = (featured as { galleryImages?: string[] }).galleryImages ?? [];

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

      {/* Edge-to-edge 4-column gallery if images exist */}
      {gallery.length ? (
        <div className="fig-grid press__gallery">
          {gallery.map((img, idx) => (
            <button
              key={img}
              type="button"
              className="press__gallery-slot"
              onClick={() => setLightboxIndex(idx)}
              aria-label={`View image ${idx + 1}`}
            >
              <img src={img} alt="" />
            </button>
          ))}
        </div>
      ) : null}

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

      {/* Navigation */}
      <div className="fig-grid press__nav">
        <Link className="fig-c1-3 press__back" to="/#press">
          <BrandArrow direction="left" />
          <span>BACK</span>
        </Link>
        {nextArticle ? (
          <CtaLink
            className="press__next"
            variant="next"
            to={`/press?article=${nextArticle.id}`}
            lines={["NEXT"]}
            ariaLabel={`Next article: ${nextArticle.title}`}
          />
        ) : null}
      </div>

      {lightboxIndex !== null ? (
        <GalleryLightbox
          images={gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </div>
  );
}
