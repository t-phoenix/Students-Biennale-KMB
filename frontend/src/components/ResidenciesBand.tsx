import { useEffect, useRef, useState, type CSSProperties } from "react";
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
};

type Props = {
  slides: ResidencySlide[];
};

const AUTO_MS = 6500;

/**
 * Residencies band — Figma 12:2.
 * Sticky full-viewport panel; card locked to the right. Advances via scroll
 * through the pin track, arrows, swipe, or autoplay. Card exits left / enters
 * from right; backgrounds crossfade with parallax.
 */
export function ResidenciesBand({ slides }: Props) {
  const pinRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const indexRef = useRef(0);
  const busyRef = useRef(false);
  const stickyActiveRef = useRef(false);
  const [index, setIndex] = useState(0);
  const reduce = prefersReducedMotion();

  const goToRef = useRef<(nextRaw: number, dir?: 1 | -1) => void>(() => {});

  goToRef.current = (nextRaw: number, dir: 1 | -1 = 1) => {
    if (!slides.length || busyRef.current) return;
    const next = ((nextRaw % slides.length) + slides.length) % slides.length;
    if (next === indexRef.current) return;

    const card = cardRef.current;
    const prevBg = bgRefs.current[indexRef.current];
    const nextBg = bgRefs.current[next];
    if (!card || !nextBg) {
      indexRef.current = next;
      setIndex(next);
      return;
    }

    if (reduce) {
      gsap.set(bgRefs.current, { autoAlpha: 0, xPercent: 0, scale: 1.05 });
      gsap.set(nextBg, { autoAlpha: 1 });
      indexRef.current = next;
      setIndex(next);
      return;
    }

    busyRef.current = true;
    const exitX = dir > 0 ? "-120%" : "120%";
    const enterFrom = dir > 0 ? "110%" : "-110%";
    const bgOutX = dir > 0 ? -7 : 7;
    const bgInFrom = dir > 0 ? 9 : -9;

    const tl = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        busyRef.current = false;
      },
    });

    tl.to(card, { x: exitX, autoAlpha: 0, duration: 0.55 }, 0)
      .to(prevBg, { autoAlpha: 0, xPercent: bgOutX, scale: 1.1, duration: 0.85 }, 0)
      .fromTo(
        nextBg,
        { autoAlpha: 0, xPercent: bgInFrom, scale: 1.14 },
        { autoAlpha: 1, xPercent: 0, scale: 1.05, duration: 0.9 },
        0.05
      )
      .set(card, { x: enterFrom, autoAlpha: 0 })
      .call(() => {
        indexRef.current = next;
        setIndex(next);
      })
      .to(card, { x: "0%", autoAlpha: 1, duration: 0.6, ease: "power3.out" });
  };

  const goTo = (nextRaw: number, dir: 1 | -1 = 1) => goToRef.current(nextRaw, dir);
  const goNext = () => goTo(indexRef.current + 1, 1);
  const goPrev = () => goTo(indexRef.current - 1, -1);

  useGSAP(
    () => {
      bgRefs.current.forEach((img, i) => {
        if (!img) return;
        gsap.set(img, {
          autoAlpha: i === 0 ? 1 : 0,
          scale: 1.05,
          xPercent: 0,
        });
      });
      if (cardRef.current) gsap.set(cardRef.current, { x: "0%", autoAlpha: 1 });
    },
    { scope: panelRef, dependencies: [slides.length] }
  );

  // Sticky scroll track → slide index (works with Lenis; no ScrollTrigger pin).
  useEffect(() => {
    const pin = pinRef.current;
    if (!pin || slides.length < 2) return;

    let raf = 0;
    const syncFromScroll = () => {
      const rect = pin.getBoundingClientRect();
      const track = pin.offsetHeight - window.innerHeight;
      if (track <= 0) return;

      const scrolled = Math.min(track, Math.max(0, -rect.top));
      stickyActiveRef.current = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;

      const progress = scrolled / track;
      const target = Math.min(
        slides.length - 1,
        Math.max(0, Math.round(progress * (slides.length - 1)))
      );
      if (target !== indexRef.current && !busyRef.current) {
        const dir: 1 | -1 = target > indexRef.current ? 1 : -1;
        goToRef.current(target, dir);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncFromScroll);
    };

    syncFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [slides.length]);

  // Autoplay + swipe while sticky panel is engaged.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || slides.length < 2) return;

    let timer = 0;
    let touchX = 0;
    let touchY = 0;

    const arm = () => {
      window.clearInterval(timer);
      if (!stickyActiveRef.current || reduce) return;
      timer = window.setInterval(() => {
        if (busyRef.current) return;
        if (indexRef.current >= slides.length - 1) {
          goToRef.current(0, 1);
          return;
        }
        goToRef.current(indexRef.current + 1, 1);
      }, AUTO_MS);
    };

    const tick = () => {
      if (stickyActiveRef.current) arm();
      else window.clearInterval(timer);
    };
    const watch = window.setInterval(tick, 400);

    const onTouchStart = (e: TouchEvent) => {
      touchX = e.changedTouches[0]?.clientX ?? 0;
      touchY = e.changedTouches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!stickyActiveRef.current) return;
      const x = e.changedTouches[0]?.clientX ?? 0;
      const y = e.changedTouches[0]?.clientY ?? 0;
      const dx = x - touchX;
      const dy = y - touchY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      window.clearInterval(timer);
      if (dx < 0) goToRef.current(indexRef.current + 1, 1);
      else goToRef.current(indexRef.current - 1, -1);
      arm();
    };

    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.clearInterval(watch);
      window.clearInterval(timer);
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchend", onTouchEnd);
    };
  }, [slides.length, reduce]);

  const current = slides[index] ?? slides[0];
  if (!current) return null;

  const trackStyle = {
    "--residency-slides": String(Math.max(slides.length, 1)),
  } as CSSProperties;

  return (
    <div
      ref={pinRef}
      id="residencies"
      className="residencies-pin"
      style={trackStyle}
    >
      <section
        ref={panelRef}
        className="residencies-band"
        aria-roledescription="carousel"
        aria-label="Residencies"
      >
        <h2 className="residencies-band__label">Residencies</h2>

        <div className="residencies-band__bgs" aria-hidden>
          {slides.map((s, i) => (
            <img
              key={s.id}
              ref={(el) => {
                bgRefs.current[i] = el;
              }}
              src={s.image}
              alt=""
              className="residencies-band__bg"
              draggable={false}
            />
          ))}
        </div>

        <button
          type="button"
          className="residencies-band__nav residencies-band__nav--prev"
          aria-label="Previous residency"
          onClick={goPrev}
        >
          <span aria-hidden>‹‹‹</span>
        </button>
        <button
          type="button"
          className="residencies-band__nav residencies-band__nav--next"
          aria-label="Next residency"
          onClick={goNext}
        >
          <span aria-hidden>›››</span>
        </button>

        <div className="residencies-band__card-slot">
          <div ref={cardRef} className="residencies-band__card">
            <h3>{current.title}</h3>
            <dl>
              <div>
                <dt>Host</dt>
                <dd>{current.host}</dd>
              </div>
              <div>
                <dt>Period</dt>
                <dd>{current.period}</dd>
              </div>
              <div>
                <dt>Venue</dt>
                <dd>{current.venue}</dd>
              </div>
              <div>
                <dt>Awardees</dt>
                <dd>{current.awardees}</dd>
              </div>
            </dl>
            <p>{current.copy}</p>
            <button type="button" className="residencies-band__more">
              Learn more...
            </button>
            <div className="residencies-band__dots" role="tablist" aria-label="Residency slides">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Residency ${i + 1}`}
                  className={i === index ? "is-active" : undefined}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
