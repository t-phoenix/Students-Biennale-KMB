import { useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
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
  const bgRef = useRef<HTMLImageElement>(null);
  const slide = slides[0];

  useGSAP(
    () => {
      const bg = bgRef.current;
      if (!bg || prefersReducedMotion()) return;

      gsap.fromTo(
        bg,
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
    { scope: sectionRef, dependencies: [slide?.id] }
  );

  if (!slide) return null;

  return (
    <section
      ref={sectionRef}
      id="residencies"
      className="residencies-band"
      aria-label="Residencies"
    >
      <h2 className="residencies-band__label">Residencies</h2>

      <div className="residencies-band__bg-wrap" aria-hidden>
        <img ref={bgRef} src={slide.image} alt="" className="residencies-band__bg" draggable={false} />
      </div>

      <div className="residencies-band__card-slot">
        <div className="residencies-band__card">
          <h3>{slide.title}</h3>
          <dl>
            <div>
              <dt>Host</dt>
              <dd>{slide.host}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>{slide.period}</dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>{slide.venue}</dd>
            </div>
            <div>
              <dt>Awardees</dt>
              <dd>{slide.awardees}</dd>
            </div>
          </dl>
          <p>{slide.copy}</p>
          <Link to={slide.moreHref} className="residencies-band__more">
            Learn more...
          </Link>
        </div>
      </div>
    </section>
  );
}
