import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { preloadUrls } from "../lib/preloadImages";
import "./ResidenciesBand.css";

export type ResidencySlide = {
  id: string;
  title: string;
  host: string;
  period: string;
  venue: string;
  awardees: string;
  copy: string;
  image: string;
  /** "Learn more..." destination — the full residency detail page. */
  moreHref: string;
};

type Props = {
  slides: ResidencySlide[];
};

/**
 * Residencies band — Figma 12:2. A normal-flow (not scroll-hijacked) section:
 * the page scrolls through it like anything else, while the background image
 * parallax-scrolls at a different rate than the info card via a scrubbed
 * ScrollTrigger tween, synced to the site's Lenis smooth-scroll.
 */
export function ResidenciesBand({ slides }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgWrapRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const safeIndex = slides.length ? Math.min(index, slides.length - 1) : 0;
  const slide = slides[safeIndex];

  useEffect(() => {
    setIndex((current) => (slides.length ? Math.min(current, slides.length - 1) : 0));
  }, [slides.length]);

  useEffect(() => {
    void preloadUrls(slides.map((item) => item.image).filter(Boolean));
  }, [slides]);

  useGSAP(
    () => {
      const wrap = bgWrapRef.current;
      if (!wrap || prefersReducedMotion()) return;

      gsap.fromTo(
        wrap,
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [slides.length] }
  );

  if (!slide) return null;

  const hasMany = slides.length > 1;
  const goToSlide = (next: number) => setIndex(next);

  return (
    <section
      ref={sectionRef}
      id="residencies"
      className="residencies-band"
      aria-label="Residencies"
    >
      <h2 className="residencies-band__label">Residencies</h2>

      <div ref={bgWrapRef} className="residencies-band__bg-wrap" aria-hidden>
        {slides.map((item, i) => (
          <img
            key={item.id}
            src={item.image}
            alt=""
            className={`residencies-band__bg${i === safeIndex ? " is-active" : ""}`}
            draggable={false}
            loading="eager"
            decoding="async"
          />
        ))}
      </div>

      <div className="residencies-band__card-slot">
        <div className="residencies-band__card">
          <h3>{slide.title}</h3>
          <dl>
            {slide.host ? (
              <div>
                <dt>Host</dt>
                <dd>{slide.host}</dd>
              </div>
            ) : null}
            {slide.period ? (
              <div>
                <dt>Period</dt>
                <dd>{slide.period}</dd>
              </div>
            ) : null}
            {slide.venue ? (
              <div>
                <dt>Venue</dt>
                <dd>{slide.venue}</dd>
              </div>
            ) : null}
            {slide.awardees ? (
              <div>
                <dt>Awardees</dt>
                <dd>{slide.awardees}</dd>
              </div>
            ) : null}
          </dl>
          {slide.copy ? <p>{slide.copy}</p> : null}
          <Link to={slide.moreHref} className="residencies-band__more">
            Read more...
          </Link>
        </div>
      </div>

      {hasMany ? (
        <div className="residencies-band__dots" role="tablist" aria-label="Residency slides">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={safeIndex === i}
              aria-label={item.title}
              className={safeIndex === i ? "is-active" : undefined}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
