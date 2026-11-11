import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { prefersReducedMotion } from "../lib/motion";
import { useReadingOrderReveal } from "../lib/sequence";
import { glideToTop } from "../lib/lenisSingleton";
import { onAccordionKeyDown, rowClickOpensArticle, useAccordionHover, useEqualDrawerHeights } from "../lib/accordionScroll";
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
  const { items: articles, status } = usePressItems();
  const [clickedArticleId, setClickedArticleId] = useState<string>("");
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

  const nextArticle = useMemo(() => {
    if (articleIndex < 0 || articleIndex >= articles.length - 1) return undefined;
    return articles[articleIndex + 1];
  }, [articles, articleIndex]);

  const articleHover = useAccordionHover(setClickedArticleId);
  const relatedListRef = useRef<HTMLUListElement>(null);
  // Every article opens to the same height, so the section never changes height.
  useEqualDrawerHeights(relatedListRef, ".press__drawer-content", `${featured?.id}-${articles.length}`);

  const activeArticleId = clickedArticleId;

  const handleSelect = useCallback(
    (id: string) => {
      setParams({ article: id });
      setClickedArticleId("");
      glideToTop({ reduced: prefersReducedMotion() });
    },
    [setParams],
  );

  // Paragraphs, images and links arrive one by one in reading order, once the articles are in
  // (so nothing is placed before the content above it has landed).
  useReadingOrderReveal(root, { key: featured?.id, delay: 0.12, enabled: status !== "loading" });

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
        {featured.image ? (
          <div className="press__feature-media press__feature-media--mobile">
            <img src={featured.image} alt="" />
          </div>
        ) : null}
        <div className="press__rail fig-rail">
          <h1>{featured.title}</h1>
          <MetaGrid className="press__meta">
            <MetaRow label="Author" value="Editorial Team" />
            <MetaRow label="Published on" value={featured.date} />
          </MetaGrid>
        </div>
        <article ref={featureRef} className="press__feature fig-c4-9">
          <div className="press__feature-media press__feature-media--desktop">
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

      {/* Article Navigation placed directly at the bottom of the article area */}
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

      {/* Related list spans cols 4–12 (Figma 1:795 / 1:829) */}
      {relatedArticles.length > 0 ? (
        <div className="fig-grid press__related">
          <ul ref={relatedListRef} className="press__list fig-c4-12">
            {relatedArticles.map((item) => {
              const isExpanded = activeArticleId === item.id;

              return (
                <li
                  key={item.id}
                  data-id={item.id}
                  className={`press__item${isExpanded ? " is-expanded" : ""}`}
                  onPointerMove={(e) => articleHover.onRowPointerMove(e, item.id, isExpanded)}
                  onPointerLeave={() => articleHover.onRowPointerLeave(item.id)}
                >
                  <button
                    type="button"
                    className="press__header"
                    aria-expanded={isExpanded}
                    onMouseDown={(e) => e.preventDefault()}
                    onKeyDown={onAccordionKeyDown}
                    onClick={(e) => {
                      articleHover.onRowClick(item.id);
                      // Hover expands; a click opens the full article (touch: first tap expands).
                      if (rowClickOpensArticle(e, isExpanded)) handleSelect(item.id);
                      else setClickedArticleId(item.id);
                    }}
                  >
                    <span className="press__title">{item.title}</span>
                    {item.date ? (
                      <time className="press__date">{item.date}</time>
                    ) : null}
                  </button>

                  <div className="press__drawer-wrap" aria-hidden={!isExpanded}>
                    <div className="press__drawer-inner">
                      <div className="press__drawer-content">
                        <button
                          type="button"
                          className="press__drawer-media"
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

                        <div className="press__drawer-copy">
                          {item.body ? (
                            <div className="press__drawer-body">
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
