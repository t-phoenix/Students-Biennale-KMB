import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion, DUR, EASE } from "../lib/motion";
import { onAccordionKeyDown, rowClickOpensArticle, useAccordionHover, useEqualDrawerHeights } from "../lib/accordionScroll";
import { useReadingOrderReveal } from "../lib/sequence";
import { buildAutoSlideTimeline, jumpToSlide, initSlideStack } from "../lib/imageSlider";
import { useSlideGesture } from "../lib/gesture";
import { preloadUrl } from "../lib/preloadImages";
import { useProgrammesCovers } from "../lib/programmesCms";
import { useCarouselDotsTone } from "../lib/useCarouselDotsTone";
import { CarouselNavArrows } from "../components/CarouselNavArrows";
import { ResidenciesBand } from "../components/ResidenciesBand";
import { RazaSpotlightModal } from "../components/RazaSpotlightModal";
import { ScholarSpotlight } from "../components/ScholarSpotlight";
import { SectionEmpty } from "../components/SectionEmpty";
import { MetaGrid, MetaRow } from "../components/MetaGrid";
import { toResidencySlides, useProgrammes } from "../lib/programmes";
import { DEFAULT_RAZA } from "../lib/programmes/fallbacks";
import { LATEST_EDITION, RAZA_CATALOGUE_ARTWORK_IDS } from "../data/site";
import "./Programmes.css";

function catalogueArtworkHref(scholarId: string): string | null {
  const artworkId = RAZA_CATALOGUE_ARTWORK_IDS[scholarId];
  if (!artworkId) return null;
  return `/editions/${LATEST_EDITION.id}/artworks/${artworkId}?from=awards`;
}


export function Programmes() {
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const heroTlRef = useRef<gsap.core.Timeline | null>(null);
  const slidesRef = useRef<HTMLElement[]>([]);
  const heroSectionRef = useRef<HTMLElement>(null);
  const [contentWaitOver, setContentWaitOver] = useState(false);
  const slideIndexRef = useRef(0);
  const [heroSlide, setHeroSlide] = useState(0);
  const [openScholarId, setOpenScholarId] = useState<string | null>(null);
  const [razaModalOpen, setRazaModalOpen] = useState(false);
  // One workshop open at a time. null until the first click or hover: the first one starts open.
  const [openWorkshopId, setOpenWorkshopId] = useState<string | null>(null);
  const workshopHover = useAccordionHover(setOpenWorkshopId);
  const pastListRef = useRef<HTMLDivElement>(null);
  const { heroCovers, status: coversStatus } = useProgrammesCovers();
  const currentHeroSrc = heroCovers[heroSlide]?.image_url ?? heroCovers[0]?.image_url ?? "";
  const dotsTone = useCarouselDotsTone(currentHeroSrc, "center");
  const { upcomingWorkshops, pastWorkshops, awardsInternational, awardsNational, raza, residencies, status: programmesStatus } =
    useProgrammes();
  // The hero banner arrives separately and pushes everything down, so wait for both.
  const firstCover = heroCovers[0]?.image_url ?? "";
  const [loadedCover, setLoadedCover] = useState("");
  useEffect(() => {
    if (!firstCover) return;
    let cancelled = false;
    const done = () => {
      if (!cancelled) setLoadedCover(firstCover);
    };
    void preloadUrl(firstCover, "high").then(done, done);
    return () => {
      cancelled = true;
    };
  }, [firstCover]);
  // The banner has no height until its image loads, so the page waits for it too.
  const holdForContent =
    (programmesStatus === "loading" ||
      coversStatus === "loading" ||
      (firstCover !== "" && loadedCover !== firstCover)) &&
    !contentWaitOver;
  const wasHeldRef = useRef(false);
  // Before paint, so the content never shows for a frame before fading in.
  useLayoutEffect(() => {
    if (holdForContent) {
      wasHeldRef.current = true;
      return;
    }
    // Content that waited fades in rather than appearing all at once.
    if (wasHeldRef.current && root.current && !prefersReducedMotion()) {
      wasHeldRef.current = false;
      gsap.fromTo(
        root.current,
        { opacity: 0 },
        { opacity: 1, duration: DUR.emphasis, ease: EASE.enter, clearProps: "opacity" },
      );
    }
  }, [holdForContent]);
  useEffect(() => {
    const timer = window.setTimeout(() => setContentWaitOver(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);
  const activePastWorkshopId = openWorkshopId ?? pastWorkshops[0]?.id ?? "";
  // Every workshop opens to the same height, so the section never changes height.
  useEqualDrawerHeights(pastListRef, ".programmes__past-drawer-content", pastWorkshops.length);
  const razaIds = useMemo(() => new Set(["kaki-weiss", "nina-durel", "rutuja-sonawane", "mohammad-riyaz"]), []);
  const standardIntlAwards = useMemo(
    () => awardsInternational.filter((a) => !razaIds.has(a.artworkId)),
    [awardsInternational, razaIds],
  );

  const razaEffective = {
    title: raza.title || DEFAULT_RAZA.title,
    subtitle: raza.subtitle || DEFAULT_RAZA.subtitle,
    intro: raza.intro?.length ? raza.intro : DEFAULT_RAZA.intro,
    scholars: raza.scholars?.length ? raza.scholars : DEFAULT_RAZA.scholars,
    closing: raza.closing?.length ? raza.closing : DEFAULT_RAZA.closing,
  };

  const razaAwardCards = [
    {
      id: "kaki-weiss",
      name: "Kaki Weiss",
      artwork: "Tabut",
      institution: "Beaux Arts de Marseille, France",
    },
    {
      id: "nina-durel",
      name: "Nina Durel",
      artwork: "Inseamm",
      institution: "Beaux Arts de Marseille, France",
    },
    {
      id: "rutuja-sonawane",
      name: "Rutuja Sonawane",
      artwork: "The People’s Orchestra",
      institution: "Sir J. J. School of Art, Mumbai, Maharashtra",
    },
    {
      id: "mohammad-riyaz",
      name: "Mohammad Riyaz",
      artwork: "Inheritance of the hand",
      institution: "Govt. Institute of Fine Arts, Gwalior, Madhya Pradesh",
    },
  ].map((card) => ({
    ...card,
    image: razaEffective.scholars.find((s) => s.id === card.id)?.image || "",
  }));

  const goToSlide = useCallback((index: number) => {
    const slides = slidesRef.current;
    if (!slides.length || index < 0 || index >= slides.length) return;
    if (index === slideIndexRef.current) return;
    heroTlRef.current?.pause();
    jumpToSlide(slides, slideIndexRef.current, index);
    slideIndexRef.current = index;
    setHeroSlide(index);
  }, []);

  // Drag, flick or trackpad swipe between slides on every device.
  useSlideGesture(
    heroSectionRef,
    {
      count: heroCovers.length,
      getIndex: () => slideIndexRef.current,
      getSlides: () => {
        const slides = Array.from(
          heroSectionRef.current?.querySelectorAll<HTMLElement>(".programmes__hero-slide") ?? [],
        );
        slidesRef.current = slides;
        return slides;
      },
      onGrab: () => {
        heroTlRef.current?.kill();
        heroTlRef.current = null;
      },
      onTargetChange: setHeroSlide,
      onCommit: goToSlide,
      onSettle: (index) => {
        if (prefersReducedMotion()) return;
        buildAutoSlideTimeline(
          slidesRef.current,
          index,
          (next) => {
            slideIndexRef.current = next;
            setHeroSlide(next);
          },
          heroTlRef,
        );
      },
    },
    heroCovers.length > 1,
  );

  // Deep-link #raza opens the spotlight modal
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash !== "#raza") return;
      setRazaModalOpen(true);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    if (razaModalOpen || openScholarId !== null) {
      heroTlRef.current?.pause();
    } else {
      heroTlRef.current?.play();
    }
  }, [razaModalOpen, openScholarId]);

  // Once the content has arrived (so positions are real), every section's paragraphs, rows,
  // cards and images arrive one by one in reading order as they reach the screen, once.
  // The hero slider and the residencies band keep their own motion.
  useReadingOrderReveal(root, {
    enabled: !holdForContent,
    skip: ".residencies-band",
    delay: 0.1,
  });

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();
      let cleanupHero: (() => void) | undefined;
      const slides = gsap.utils.toArray<HTMLElement>(".programmes__hero-slide");
      slidesRef.current = slides;

      if (reduced) {
        if (slides.length) initSlideStack(slides, 0);
        return;
      }

      if (slides.length > 1) {
        slideIndexRef.current = 0;
        buildAutoSlideTimeline(slides, 0, (index) => {
          slideIndexRef.current = index;
          setHeroSlide(index);
        }, heroTlRef);
        const hero = root.current?.querySelector<HTMLElement>(".programmes__hero");
        const pause = () => heroTlRef.current?.pause();
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
    <div
      ref={root}
      className="programmes"
      // Sections would jump down the page as their content arrives, so they wait for it.
      style={holdForContent ? { opacity: 0, pointerEvents: "none" } : undefined}
    >
      {heroCovers.length > 0 ? (
      <section ref={heroSectionRef} className="programmes__hero prog-reveal" aria-label="Programmes hero" data-no-parallax="true">
        <div className="programmes__hero-slides" aria-hidden={heroCovers.length > 1} data-no-parallax="true">
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
          {upcomingWorkshops.length === 1 ? (
            (() => {
              const single = upcomingWorkshops[0];
              return (
                <article className="programmes__single-workshop fig-c4-12">
                  <div className="programmes__single-media-wrap">
                    <img
                      src={single.image}
                      alt={single.title || "Upcoming workshop"}
                      className="programmes__single-media"
                    />
                  </div>
                  <div className="programmes__single-content">
                    <h2 className="programmes__single-title">{single.title}</h2>
                    <MetaGrid className="programmes__meta meta-grid--compact meta-grid--tight-colon">
                      <MetaRow label="Date" value={single.date} />
                      <MetaRow label="Facilitators" value={single.place} />
                    </MetaGrid>
                    {single.blurb ? (
                      <p className="programmes__single-blurb">{single.blurb}</p>
                    ) : null}
                    <button type="button" className="home-text-btn programmes__card-button">
                      Know more...
                    </button>
                  </div>
                </article>
              );
            })()
          ) : (
            <div className="programmes__cards fig-c4-12 fig-sub-3">
              {upcomingWorkshops.map((p) => (
                <article key={p.id}>
                  <div className="programmes__card-media-wrap">
                    <img src={p.image} alt="" className="programmes__card-media" />
                  </div>
                  <h2>{p.title}</h2>
                  <MetaGrid className="programmes__meta meta-grid--compact meta-grid--tight-colon">
                    <MetaRow label="Date" value={p.date} />
                    <MetaRow label="Facilitator" value={p.place} />
                  </MetaGrid>
                  <p>{p.blurb}</p>
                  <button type="button" className="home-text-btn programmes__card-button">
                    Know more...
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section id="past-workshops" className="programmes__block fig-grid prog-reveal">
        <h2 className="fig-label fig-subheading">PAST WORKSHOPS</h2>
        {pastWorkshops.length ? (
          <div ref={pastListRef} className="programmes__past-items fig-c4-12">
            {pastWorkshops.map((item) => {
              const isExpanded = activePastWorkshopId === item.id;
              return (
                <article
                  key={item.id}
                  data-id={item.id}
                  className={`programmes__past-item${isExpanded ? " is-expanded" : ""}`}
                  onPointerMove={(e) => workshopHover.onRowPointerMove(e, item.id, isExpanded)}
                  onPointerLeave={() => workshopHover.onRowPointerLeave(item.id)}
                >
                  <button
                    type="button"
                    className="programmes__past-header"
                    aria-expanded={isExpanded}
                    onMouseDown={(e) => e.preventDefault()}
                    onKeyDown={onAccordionKeyDown}
                    onClick={(e) => {
                      workshopHover.onRowClick(item.id);
                      // Hover expands; a click opens the full workshop (touch: first tap expands).
                      if (rowClickOpensArticle(e, isExpanded)) navigate(`/programmes/past-workshops/${item.id}`);
                      else setOpenWorkshopId(item.id);
                    }}
                  >
                    <span className="programmes__past-title">{item.title}</span>
                    <time className="programmes__past-date">{item.year}</time>
                  </button>

                  <div className="programmes__past-drawer-wrap" aria-hidden={!isExpanded}>
                    <div className="programmes__past-drawer-inner">
                      <div className="programmes__past-drawer-content">
                        {item.heroImage ? (
                          <Link
                            to={`/programmes/past-workshops/${item.id}`}
                            className="programmes__past-drawer-media"
                            tabIndex={isExpanded ? 0 : -1}
                            aria-label={`Read ${item.title}`}
                          >
                            <img
                              className="programmes__past-drawer-img"
                              src={item.heroImage}
                              alt=""
                              loading="lazy"
                            />
                          </Link>
                        ) : (
                          <div
                            className="programmes__past-drawer-media programmes__past-drawer-placeholder"
                            aria-hidden
                          />
                        )}
                        <div className="programmes__past-drawer-copy">
                          {item.facilitators ? (
                            <span className="programmes__past-facilitators">
                              Facilitators : {item.facilitators}
                            </span>
                          ) : null}
                          {item.description ? (
                            <p className="fig-body programmes__past-description">
                              {item.description.length > 220
                                ? `${item.description.slice(0, 220).trimEnd()}…`
                                : item.description}
                            </p>
                          ) : null}
                          <Link
                            to={`/programmes/past-workshops/${item.id}`}
                            className="home-text-btn programmes__past-more-btn"
                            tabIndex={isExpanded ? 0 : -1}
                          >
                            Read more...
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <SectionEmpty hidden={programmesStatus === "loading"}>No past workshops published yet.</SectionEmpty>
        )}
      </section>

      {/* Order: International Awards, with Raza Scholarship nested right after
          it, then National Awards. */}
      <div id="awards">
        <section className="programmes__block fig-grid prog-reveal">
          <h2 className="fig-label fig-subheading">TATA TRUSTS SB INTERNATIONAL AWARDS</h2>
          {standardIntlAwards.length ? (
            <div className="programmes__awards fig-c4-12 fig-sub-3">
              {standardIntlAwards.map((a) => (
                <Link
                  key={a.id ?? `international-${a.name}-${a.artwork}`}
                  className="programmes__award"
                  to={`/editions/${LATEST_EDITION.id}/artworks/${a.artworkId}?from=awards`}
                >
                  <div className="programmes__award-media">
                    {a.image ? <img src={a.image} alt="" /> : null}
                  </div>
                  <h3>
                    {a.artists?.length ? a.artists.map((artist) => artist.name).join(" · ") : a.name}
                  </h3>
                  {a.artwork ? (
                    <MetaGrid className="programmes__award-meta meta-grid--compact meta-grid--tight-colon">
                      <MetaRow label="Artwork" value={a.artwork} />
                    </MetaGrid>
                  ) : null}
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
            <SectionEmpty hidden={programmesStatus === "loading"}>No international awards published yet.</SectionEmpty>
          )}
        </section>

        <section className="programmes__block fig-grid prog-reveal">
          <h2 className="fig-label fig-subheading">TATA TRUSTS SB NATIONAL AWARDS</h2>
          {awardsNational.length ? (
            <div className="programmes__awards fig-c4-12 fig-sub-3">
              {awardsNational.map((a) => (
                <Link
                  key={a.id ?? `national-${a.name}-${a.artwork}`}
                  className="programmes__award"
                  to={`/editions/${LATEST_EDITION.id}/artworks/${a.artworkId}?from=awards`}
                >
                  <div className="programmes__award-media">
                    {a.image ? <img src={a.image} alt="" /> : null}
                  </div>
                  <h3>
                    {a.artists?.length ? a.artists.map((artist) => artist.name).join(" · ") : a.name}
                  </h3>
                  {a.artwork ? (
                    <MetaGrid className="programmes__award-meta meta-grid--compact meta-grid--tight-colon">
                      <MetaRow label="Artwork" value={a.artwork} />
                    </MetaGrid>
                  ) : null}
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
            <SectionEmpty hidden={programmesStatus === "loading"}>No national awards published yet.</SectionEmpty>
          )}
        </section>
      </div>

      {/* 4) SB 2025-26 X BEAUX ARTS DE MARSEILLE */}
      <section id="raza" className="programmes__block fig-grid prog-reveal">
        <h2 className="fig-label fig-subheading">
          <button
            type="button"
            className="programmes__subheading-btn"
            onClick={() => setRazaModalOpen(true)}
            aria-label="Open SB 2025-26 x Beaux Arts de Marseille Spotlight"
            title="Click to spotlight SB 2025-26 x Beaux Arts de Marseille"
          >
            <span>SB 2025–26 X BEAUX ARTS DE MARSEILLE</span>
            <span className="programmes__subheading-arrow" aria-hidden>↗</span>
          </button>
        </h2>
        {razaAwardCards.length ? (
          <div className="programmes__awards fig-c4-12 fig-sub-3">
            {razaAwardCards.map((s) => {
              const href = catalogueArtworkHref(s.id);
              const card = (
                <>
                  <div className="programmes__award-media">
                    <img src={s.image} alt={s.name} />
                  </div>
                  <h3>{s.name}</h3>
                  {s.artwork ? (
                    <MetaGrid className="programmes__award-meta meta-grid--compact meta-grid--tight-colon">
                      <MetaRow label="Artwork" value={s.artwork} />
                    </MetaGrid>
                  ) : null}
                  {s.institution ? <p>{s.institution}</p> : null}
                </>
              );
              if (href) {
                return (
                  <Link key={s.id} className="programmes__award" to={href}>
                    {card}
                  </Link>
                );
              }
              return (
                <button
                  key={s.id}
                  type="button"
                  className="programmes__award"
                  onClick={() => setOpenScholarId(s.id)}
                >
                  {card}
                </button>
              );
            })}
          </div>
        ) : (
          <SectionEmpty hidden={programmesStatus === "loading"}>No exchange awards published yet.</SectionEmpty>
        )}
      </section>

      {/* 5) Residencies */}
      <section id="residencies" className="programmes__block programmes__block--residencies prog-reveal">
        <div className="fig-grid">
          <h2 className="fig-label fig-subheading">RESIDENCIES</h2>
        </div>
        {residencies.length ? (
          <ResidenciesBand slides={toResidencySlides(residencies)} />
        ) : (
          <div className="fig-grid">
            <SectionEmpty className="fig-c4-12">No residencies published yet.</SectionEmpty>
          </div>
        )}
      </section>

      <RazaSpotlightModal
        open={razaModalOpen}
        onClose={() => setRazaModalOpen(false)}
        onSelectScholar={(scholarId) => {
          setRazaModalOpen(false);
          const href = catalogueArtworkHref(scholarId);
          if (href) {
            if (window.location.hash === "#raza") {
              navigate("/programmes#raza", { replace: true });
            }
            navigate(href);
            return;
          }
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
