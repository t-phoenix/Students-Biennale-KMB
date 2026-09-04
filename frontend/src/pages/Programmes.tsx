import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { buildAutoSlideTimeline, jumpToSlide, initSlideStack } from "../lib/imageSlider";
import { useProgrammesCovers } from "../lib/programmesCms";
import { useCarouselDotsTone } from "../lib/useCarouselDotsTone";
import { CarouselNavArrows } from "../components/CarouselNavArrows";
import { CtaLink } from "../components/CtaLink";
import { ResidenciesBand } from "../components/ResidenciesBand";
import { RazaSpotlightModal } from "../components/RazaSpotlightModal";
import { ScholarSpotlight } from "../components/ScholarSpotlight";
import { SectionEmpty } from "../components/SectionEmpty";
import { toResidencySlides, useProgrammes } from "../lib/programmes";
import { DEFAULT_RAZA, EMPTY_PROGRAMMES } from "../lib/programmes/fallbacks";
import { LATEST_EDITION } from "../data/site";
import "./Programmes.css";

export function Programmes() {
  const root = useRef<HTMLDivElement>(null);
  const heroTlRef = useRef<gsap.core.Timeline | null>(null);
  const slidesRef = useRef<HTMLElement[]>([]);
  const slideIndexRef = useRef(0);
  const [heroSlide, setHeroSlide] = useState(0);
  const [openScholarId, setOpenScholarId] = useState<string | null>(null);
  const [razaModalOpen, setRazaModalOpen] = useState(false);
  const [expandedPast, setExpandedPast] = useState(false);
  const [expandedIntlAwards, setExpandedIntlAwards] = useState(false);
  const [expandedNationalAwards, setExpandedNationalAwards] = useState(false);
  const { heroCovers } = useProgrammesCovers();
  const currentHeroSrc = heroCovers[heroSlide]?.image_url ?? heroCovers[0]?.image_url ?? "";
  const dotsTone = useCarouselDotsTone(currentHeroSrc, "right");
  const { upcomingWorkshops, pastWorkshops, awardsInternational, awardsNational, raza, residencies } =
    useProgrammes();

  const visiblePastWorkshops = expandedPast ? pastWorkshops : pastWorkshops.slice(0, 2);
  const awardsPreviewCount = 3;
  const intlAwardsEffective =
    awardsInternational.length > 0 ? awardsInternational : EMPTY_PROGRAMMES.awardsInternational;
  const nationalAwardsEffective =
    awardsNational.length > 0 ? awardsNational : EMPTY_PROGRAMMES.awardsNational;

  const razaIds = useMemo(() => new Set(["kaki-weiss", "nina-durel", "rutuja-sonawane", "mohammad-riyaz"]), []);
  const standardIntlAwards = useMemo(
    () => intlAwardsEffective.filter((a) => !razaIds.has(a.artworkId)),
    [intlAwardsEffective, razaIds],
  );
  const visibleStandardAwards = expandedIntlAwards
    ? standardIntlAwards
    : standardIntlAwards.slice(0, awardsPreviewCount);

  const visibleNationalAwards = expandedNationalAwards
    ? nationalAwardsEffective
    : nationalAwardsEffective.slice(0, awardsPreviewCount);

  const razaAwardCards = [
    {
      id: "kaki-weiss",
      name: "Kaki Weiss",
      artwork: "Tabut",
      institution: "Beaux Arts de Marseille, France",
      image: "/programmes/raza-kaki-weiss.jpg",
    },
    {
      id: "nina-durel",
      name: "Nina Durel",
      artwork: "Inseamm",
      institution: "Beaux Arts de Marseille, France",
      image: "/programmes/raza-nina-durel.jpg",
    },
    {
      id: "rutuja-sonawane",
      name: "Rutuja Sonawane",
      artwork: "The People’s Orchestra",
      institution: "Sir J. J. School of Art, Mumbai, Maharashtra",
      image: "/programmes/raza-rutuja-sonawane.jpg",
    },
    {
      id: "mohammad-riyaz",
      name: "Mohammad Riyaz",
      artwork: "Inheritance of the hand",
      institution: "Govt. Institute of Fine Arts, Gwalior, Madhya Pradesh",
      image: "/programmes/raza-mohammad-riyaz.jpg",
    },
  ];

  const razaEffective = {
    title: raza.title || DEFAULT_RAZA.title,
    subtitle: raza.subtitle || DEFAULT_RAZA.subtitle,
    intro: raza.intro?.length ? raza.intro : DEFAULT_RAZA.intro,
    scholars: raza.scholars?.length ? raza.scholars : DEFAULT_RAZA.scholars,
    closing: raza.closing?.length ? raza.closing : DEFAULT_RAZA.closing,
  };

  const goToSlide = useCallback((index: number) => {
    const slides = slidesRef.current;
    if (!slides.length || index < 0 || index >= slides.length) return;
    if (index === slideIndexRef.current) return;
    heroTlRef.current?.pause();
    jumpToSlide(slides, slideIndexRef.current, index);
    slideIndexRef.current = index;
    setHeroSlide(index);
  }, []);

  useEffect(() => {
    if (window.location.hash === "#raza") {
      setRazaModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (razaModalOpen || openScholarId !== null) {
      heroTlRef.current?.pause();
    } else {
      heroTlRef.current?.play();
    }
  }, [razaModalOpen, openScholarId]);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();
      if (!reduced) {
        gsap.fromTo(
          ".prog-reveal",
          { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            stagger: { amount: 0.35, ease: "power2.out" },
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
          }
        );
      }

      let cleanupHero: (() => void) | undefined;
      const slides = gsap.utils.toArray<HTMLElement>(".programmes__hero-slide");
      slidesRef.current = slides;

      if (reduced) {
        if (slides.length) initSlideStack(slides, 0);
        return;
      }

      if (slides.length > 1) {
        slideIndexRef.current = 0;
        const tl = buildAutoSlideTimeline(slides, 0, (index) => {
          slideIndexRef.current = index;
          setHeroSlide(index);
        }, heroTlRef);
        const hero = root.current?.querySelector<HTMLElement>(".programmes__hero");
        const pause = () => tl.pause();
        const play = () => {
          buildAutoSlideTimeline(
            slidesRef.current,
            slideIndexRef.current,
            (index) => {
              slideIndexRef.current = index;
              setHeroSlide(index);
            },
            heroTlRef,
          );
        };
        hero?.addEventListener("pointerenter", pause);
        hero?.addEventListener("pointerleave", play);
        hero?.addEventListener("focusin", pause);
        hero?.addEventListener("focusout", play);
        cleanupHero = () => {
          heroTlRef.current?.kill();
          heroTlRef.current = null;
          hero?.removeEventListener("pointerenter", pause);
          hero?.removeEventListener("pointerleave", play);
          hero?.removeEventListener("focusin", pause);
          hero?.removeEventListener("focusout", play);
        };
      } else if (slides.length === 1) {
        initSlideStack(slides, 0);
        slideIndexRef.current = 0;
        setHeroSlide(0);
      }

      return () => {
        cleanupHero?.();
      };
    },
    { scope: root, dependencies: [heroCovers.length, heroCovers.map((c) => c.id).join(",")] },
  );

  return (
    <div ref={root} className="programmes">
      {heroCovers.length > 0 ? (
      <section className="programmes__hero prog-reveal" aria-label="Programmes hero">
        <div className="programmes__hero-slides" aria-hidden={heroCovers.length > 1}>
          {heroCovers.map((cover) => (
            <img
              key={cover.id}
              className="programmes__hero-slide"
              src={cover.image_url}
              alt=""
              loading="eager"
            />
          ))}
        </div>
        {heroCovers.length > 1 ? (
          <>
            <CarouselNavArrows
              slideSrc={currentHeroSrc}
              onPrev={() => goToSlide((heroSlide - 1 + heroCovers.length) % heroCovers.length)}
              onNext={() => goToSlide((heroSlide + 1) % heroCovers.length)}
            />
            <div
              className="programmes__hero-dots carousel-dots"
              data-tone={dotsTone}
              role="tablist"
              aria-label="Hero slides"
            >
            {heroCovers.map((cover, i) => (
              <button
                key={cover.id}
                type="button"
                role="tab"
                aria-selected={heroSlide === i}
                className={heroSlide === i ? "is-active" : undefined}
                onClick={() => goToSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
            </div>
          </>
        ) : null}
      </section>
      ) : null}

      {upcomingWorkshops.length ? (
        <section id="workshops" className="programmes__block fig-grid prog-reveal">
          <h1 className="fig-label fig-subheading">UPCOMING WORKSHOPS</h1>
          <div className="programmes__cards fig-c4-12 fig-sub-3">
            {upcomingWorkshops.map((p) => (
              <article key={p.id}>
                <div className="programmes__card-media-wrap">
                  <img src={p.image} alt="" className="programmes__card-media" />
                </div>
                <h2>{p.title}</h2>
                <p className="programmes__meta">
                  Date : {p.date}
                  <br />
                  Facilitator : {p.place}
                </p>
                <p>{p.blurb}</p>
                <button type="button" className="programmes__card-button">
                  KNOW MORE...
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="programmes__block fig-grid prog-reveal">
        <h2 className="fig-label fig-subheading">PAST WORKSHOPS</h2>
        {pastWorkshops.length ? (
        <ul className="programmes__completed fig-c4-12">
          {visiblePastWorkshops.map((item) => {
            const isOpen = Boolean(item.description);
            return (
              <li key={item.id} className={isOpen ? "is-open" : undefined}>
                <Link to={`/programmes/past-workshops/${item.id}`}>
                  {isOpen && item.heroImage ? (
                    <span className="programmes__past-thumb">
                      <img src={item.heroImage} alt="" />
                    </span>
                  ) : null}
                  <div className="programmes__past-body">
                    <div className="programmes__past-head">
                      <span className="programmes__past-title">{item.title}</span>
                      <span>{item.year}</span>
                    </div>
                    <span className="programmes__past-sub">Facilitators: {item.facilitators}</span>
                    {isOpen ? (
                      <span className="programmes__past-snippet">
                        {item.description!.length > 180
                          ? `${item.description!.slice(0, 180).trimEnd()}…`
                          : item.description}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        ) : (
          <SectionEmpty>No past workshops published yet.</SectionEmpty>
        )}
        {pastWorkshops.length > 2 ? (
          <CtaLink
            className={`fig-cta-end programmes__more${expandedPast ? " programmes__more--collapse" : ""}`}
            lines={expandedPast ? ["VIEW", "LESS"] : ["VIEW", "MORE"]}
            spacing={["0.26em", "0.135em"]}
            onClick={() => setExpandedPast((open) => !open)}
          />
        ) : null}
      </section>

      {/* Order: International Awards, with Raza Scholarship nested right after
          it, then National Awards. */}
      <div id="awards">
        <section className="programmes__block fig-grid prog-reveal">
          <h2 className="fig-label fig-subheading">INTERNATIONAL AWARDS</h2>
          {intlAwardsEffective.length ? (
          <div className="programmes__awards fig-c4-12 fig-sub-3">
            {visibleStandardAwards.map((a) => (
              <Link
                key={a.id ?? `international-${a.name}-${a.artwork}`}
                className="programmes__award"
                to={`/editions/${LATEST_EDITION.id}/artworks/${a.artworkId}`}
              >
                <div className="programmes__award-media">
                  <img src={a.image || "/programmes/award.jpg"} alt="" />
                </div>
                <h3>
                  {a.artists?.length ? a.artists.map((artist) => artist.name).join(" · ") : a.name}
                </h3>
                <p>Artwork : {a.artwork}</p>
                <p>
                  {a.artists?.length
                    ? a.artists.map((artist) => artist.institution).filter(Boolean).join(" · ") ||
                      a.institution
                    : a.institution}
                </p>
              </Link>
            ))}

            {/* Raza - Students' Biennale Scholarship Subsection (Figma 50:1773 & 50:2228) — always visible */}
            <div className="programmes__raza-heading-row" id="raza">
              <button
                type="button"
                className="programmes__raza-title-btn"
                onClick={() => setRazaModalOpen(true)}
                aria-label="Open Raza - Students' Biennale Scholarship Spotlight"
                title="Click to spotlight Raza - Students' Biennale Scholarship"
              >
                <span>RAZA - STUDENTS&apos; BIENNALE SCHOLARSHIP</span>
                <span className="programmes__raza-title-arrow" aria-hidden>↗</span>
              </button>
            </div>

            {razaAwardCards.map((s) => (
              <button
                key={s.id}
                type="button"
                className="programmes__award"
                onClick={() => {
                  if (s.id === "kaki-weiss" || s.id === "nina-durel") {
                    setOpenScholarId(s.id);
                  } else {
                    setRazaModalOpen(true);
                  }
                }}
              >
                <div className="programmes__award-media">
                  <img src={s.image} alt={s.name} />
                </div>
                <h3>{s.name}</h3>
                <p>Artwork : {s.artwork}</p>
                <p>{s.institution}</p>
              </button>
            ))}
          </div>
          ) : (
            <SectionEmpty>No international awards published yet.</SectionEmpty>
          )}
          {standardIntlAwards.length + razaAwardCards.length > awardsPreviewCount ? (
            <CtaLink
              className={`fig-cta-end programmes__more${expandedIntlAwards ? " programmes__more--collapse" : ""}`}
              lines={expandedIntlAwards ? ["VIEW", "LESS"] : ["VIEW", "MORE"]}
              spacing={["0.26em", "0.135em"]}
              onClick={() => setExpandedIntlAwards((open) => !open)}
            />
          ) : null}
        </section>

        <section className="programmes__block fig-grid prog-reveal">
          <h2 className="fig-label fig-subheading">NATIONAL AWARDS</h2>
          {awardsNational.length ? (
          <div className="programmes__awards fig-c4-12 fig-sub-3">
            {visibleNationalAwards.map((a) => (
              <Link
                key={a.id ?? `national-${a.name}-${a.artwork}`}
                className="programmes__award"
                to={`/editions/${LATEST_EDITION.id}/artworks/${a.artworkId}`}
              >
                <div className="programmes__award-media">
                  <img src={a.image || "/programmes/award.jpg"} alt="" />
                </div>
                <h3>
                  {a.artists?.length ? a.artists.map((artist) => artist.name).join(" · ") : a.name}
                </h3>
                <p>Artwork : {a.artwork}</p>
                <p>
                  {a.artists?.length
                    ? a.artists.map((artist) => artist.institution).filter(Boolean).join(" · ") ||
                      a.institution
                    : a.institution}
                </p>
              </Link>
            ))}
          </div>
          ) : (
            <SectionEmpty>No national awards published yet.</SectionEmpty>
          )}
          {awardsNational.length > awardsPreviewCount ? (
            <CtaLink
              className={`fig-cta-end programmes__more${expandedNationalAwards ? " programmes__more--collapse" : ""}`}
              lines={expandedNationalAwards ? ["VIEW", "LESS"] : ["VIEW", "MORE"]}
              spacing={["0.26em", "0.135em"]}
              onClick={() => setExpandedNationalAwards((open) => !open)}
            />
          ) : null}
        </section>
      </div>

      {residencies.length === 0 ? (
        <section id="residencies" className="programmes__block fig-grid prog-reveal">
          <SectionEmpty>No residencies published yet.</SectionEmpty>
        </section>
      ) : null}

      <ResidenciesBand slides={toResidencySlides(residencies)} />

      <RazaSpotlightModal
        open={razaModalOpen}
        onClose={() => setRazaModalOpen(false)}
        onSelectScholar={(scholarId) => {
          setRazaModalOpen(false);
          setOpenScholarId(scholarId);
        }}
      />

      <ScholarSpotlight
        scholarId={openScholarId}
        scholars={razaEffective.scholars}
        onClose={() => setOpenScholarId(null)}
      />
    </div>
  );
}
