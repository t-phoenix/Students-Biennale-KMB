import { useRef, useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion, withMotionPreference } from "../lib/motion";
import { CtaLink } from "../components/CtaLink";
import { SpotlightModal } from "../components/SpotlightModal";
import { GalleryLightbox } from "../components/GalleryLightbox";
import {
  UpdateCardSpotlight,
  type ActiveUpdateCard,
} from "../components/UpdateCardSpotlight";
import {
  EDITION_MORE,
  EDITION_SHORT,
  SENSING_GROUNDS_NOTE,
  TEAM_COLS,
} from "../data/editions";
import { LATEST_EDITION } from "../data/site";
import { useCatalogue } from "../lib/catalogue";
import { useHomeCms } from "../lib/homeCms";
import { heroCreditVisible } from "../lib/homeCms/credits";
import {
  defaultCtaLabel,
  type UpdateCardMode,
} from "../lib/homeCms/updateCardLinks";
import { prefetchHomeDestinations } from "../lib/predictivePrefetch";
import { buildAutoSlideTimeline, jumpToSlide } from "../lib/imageSlider";
import { useProgrammes } from "../lib/programmes";
import "./Home.css";

const FALLBACK_UPDATES: ActiveUpdateCard[] = [
  {
    id: "u1",
    mode: "content",
    heading: "Update 01",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966",
    detailBody:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966.",
    imageUrl: null,
    href: null,
    ctaLabel: null,
  },
  {
    id: "u2",
    mode: "content",
    heading: "Update 02",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966",
    detailBody:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966.",
    imageUrl: null,
    href: null,
    ctaLabel: null,
  },
  {
    id: "u3",
    mode: "content",
    heading: "Update 03",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966",
    detailBody:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966.",
    imageUrl: null,
    href: null,
    ctaLabel: null,
  },
];

function normalizeCardMode(value: string | undefined | null): UpdateCardMode {
  if (value === "internal" || value === "external" || value === "content") return value;
  if (value === "programmes" || value === "news") return "internal";
  return "content";
}

/** Continuous auto-scroll strip, right→left, in the Sensing Grounds row. */
const SENSING_STRIP_IMAGES = [
  "/home/sensing-wide.jpg",
  "/home/sensing-side.jpg",
  "/artworks/absence.jpg",
  "/artworks/panopticon.jpg",
  "/artworks/dar-dara-dariya.jpg",
  "/artworks/milk-distributors.jpg",
];

const PRESS_LIST = [
  {
    id: "guide-map",
    title: "The Ultimate Guide & Map to the Kochi-Muziris Biennale 2025/26 Venues",
    date: "15 Feb 2026",
  },
  {
    id: "st-andrews",
    title: "St. Andrews Parish Hall -Students' Biennale at Kochi",
    date: "31 Mar 2026",
  },
  { id: "warm-panic", title: "A warm kind of panic", date: "31 Dec 2025" },
  { id: "power-of-peta", title: "The Power of the Peta / Honour", date: "31 Dec 2025" },
];

export function Home() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const editionMoreRef = useRef<HTMLDivElement>(null);
  const sensingTrackRef = useRef<HTMLDivElement>(null);
  const heroTlRef = useRef<gsap.core.Timeline | null>(null);
  const slidesRef = useRef<HTMLElement[]>([]);
  const slideIndexRef = useRef(0);
  const [slide, setSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editionExpanded, setEditionExpanded] = useState(false);
  const [sensingOpen, setSensingOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<ActiveUpdateCard | null>(null);
  const [dismissedCardIds, setDismissedCardIds] = useState<string[]>([]);
  const [programmesHover, setProgrammesHover] = useState<string | null>(null);
  const programmesThumbsRef = useRef<HTMLDivElement>(null);
  const programmesThumbEls = useRef<Record<string, HTMLAnchorElement | null>>({});
  const { current } = useCatalogue();
  const { upcomingWorkshops, pastWorkshops, residencies, awardsInternational, awardsNational } =
    useProgrammes();
  const { covers: dynamicCovers, cards: cmsCards } = useHomeCms();
  const covers = dynamicCovers.length
    ? dynamicCovers
    : Array.from({ length: 5 }, (_, i) => ({
        id: `fallback-${i}`,
        image_url: "/home/hero.jpg",
        artwork_name: null,
        artist: null,
        institution: null,
        show_artwork_name: false,
        show_artist: false,
        show_institution: false,
      }));
  const cards: ActiveUpdateCard[] = cmsCards.length
    ? cmsCards.map((c) => {
        const mode = normalizeCardMode(c.card_type);
        const href = c.link_url?.trim() || null;
        return {
          id: c.id,
          mode,
          heading: c.heading,
          body: c.body,
          detailBody: c.detail_body,
          imageUrl: c.image_url,
          href,
          ctaLabel: c.link_label || defaultCtaLabel(mode),
        };
      })
    : [...FALLBACK_UPDATES];
  const currentCover = covers[slide] ?? covers[0];
  const showArtwork = heroCreditVisible(currentCover?.show_artwork_name, currentCover?.artwork_name);
  const showArtist = heroCreditVisible(currentCover?.show_artist, currentCover?.artist);
  const showInstitution = heroCreditVisible(
    currentCover?.show_institution,
    currentCover?.institution,
  );
  const creditHeading = (currentCover?.artwork_name ?? "").trim();
  const creditParts = creditHeading.split(/\s+/);
  const creditArtwork =
    creditParts.length === 2 ? (
      <>
        {creditParts[0]}
        <br />
        {creditParts[1]}
      </>
    ) : (
      creditHeading
    );
  const creditArtist = (currentCover?.artist ?? "").trim();
  const creditInst = (currentCover?.institution ?? "").trim();
  const showCredits = showArtwork || showArtist || showInstitution;
  const workshopThumb =
    upcomingWorkshops[0]?.image || pastWorkshops[0]?.heroImage || "/home/thumb-workshops.jpg";
  const residencyThumb = residencies[0]?.heroImage || "/home/thumb-residencies.jpg";
  const awardsThumb =
    awardsInternational[0]?.image || awardsNational[0]?.image || "/home/thumb-awards.jpg";
  const yearId = current?.years ?? LATEST_EDITION.id;
  const overviewParas = (current?.overview || `${EDITION_SHORT}\n\n${EDITION_MORE}`)
    .split("\n\n")
    .filter(Boolean);
  const editionShort = overviewParas[0] ?? EDITION_SHORT;
  const editionMore = overviewParas.slice(1).join("\n\n") || EDITION_MORE;
  const sensingNote = current?.overallCuratorialNote
    ? {
        title: current.title || SENSING_GROUNDS_NOTE.title,
        attribution: SENSING_GROUNDS_NOTE.attribution,
        paragraphs: current.overallCuratorialNote.split("\n\n").filter(Boolean),
      }
    : SENSING_GROUNDS_NOTE;

  useEffect(() => {
    prefetchHomeDestinations(current ?? null);
  }, [current]);

  const goToSlide = useCallback((index: number) => {
    const slides = slidesRef.current;
    if (!slides.length || index < 0 || index >= slides.length) return;
    if (index === slideIndexRef.current) return;

    heroTlRef.current?.pause();
    jumpToSlide(slides, slideIndexRef.current, index);
    slideIndexRef.current = index;
    setSlide(index);
  }, []);

  const openCard = useCallback((card: ActiveUpdateCard) => {
    setActiveCard(card);
  }, []);

  const confirmCardNavigate = useCallback(
    (card: ActiveUpdateCard) => {
      const href = card.href?.trim();
      if (!href) return;
      setActiveCard(null);
      if (card.mode === "external" || /^https?:\/\//i.test(href)) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      navigate(href.startsWith("/") ? href : `/${href}`);
    },
    [navigate],
  );

  useGSAP(
    () => {
      const el = editionMoreRef.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { height: editionExpanded ? "auto" : 0 });
        return;
      }
      if (editionExpanded) {
        gsap.set(el, { height: "auto" });
        const target = el.offsetHeight;
        gsap.fromTo(
          el,
          { height: 0 },
          { height: target, duration: 0.45, ease: "power2.out" }
        );
      } else {
        gsap.to(el, { height: 0, duration: 0.32, ease: "power2.in" });
      }
    },
    { dependencies: [editionExpanded], scope: rootRef }
  );

  // Sensing Grounds image strip — continuous right-to-left auto-scroll.
  useGSAP(
    () => {
      const track = sensingTrackRef.current;
      if (!track || prefersReducedMotion()) return;

      const tween = gsap.to(track, {
        xPercent: -50,
        duration: 28,
        ease: "none",
        repeat: -1,
      });

      return () => {
        tween.kill();
      };
    },
    { scope: rootRef }
  );

  // Upcoming Programmes — hovering a rail label or its thumbnail grows that
  // image 60px on each side (120px total) and shrinks the other two by 60px
  // each, keeping the row's total width constant.
  useGSAP(
    () => {
      const container = programmesThumbsRef.current;
      if (!container) return;
      if (window.innerWidth <= 899) {
        ["workshops", "awards", "residencies"].forEach((hash) => {
          const el = programmesThumbEls.current[hash];
          if (el) gsap.set(el, { clearProps: "flexBasis" });
        });
        return;
      }
      const total = container.getBoundingClientRect().width;
      if (!total) return;
      const gap = 20;
      const base = (total - gap * 2) / 3;
      const reduce = prefersReducedMotion();

      ["workshops", "awards", "residencies"].forEach((hash) => {
        const el = programmesThumbEls.current[hash];
        if (!el) return;
        const isHovered = programmesHover === hash;
        const isDimmed = programmesHover !== null && !isHovered;
        const width = `${isHovered ? base + 120 : isDimmed ? base - 60 : base}px`;
        if (reduce) {
          gsap.set(el, { flexBasis: width });
        } else {
          gsap.to(el, { flexBasis: width, duration: 0.6, ease: "power3.out" });
        }
      });
    },
    { dependencies: [programmesHover], scope: programmesThumbsRef }
  );

  useGSAP(
    () => {
      withMotionPreference({
        animate: () => {
          gsap.utils.toArray<HTMLElement>(".home-section").forEach((section) => {
            gsap.fromTo(
              section,
              { autoAlpha: 0, y: 36 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.65,
                ease: "power2.out",
                scrollTrigger: { trigger: section, start: "top 82%", once: true },
              }
            );
          });
        },
        onReduce: () => {
          gsap.set(".home-section", { autoAlpha: 1, y: 0 });
        },
      });
    },
    { scope: rootRef }
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      let cleanupHero: (() => void) | undefined;

      withMotionPreference({
        animate: () => {
          gsap.fromTo(
            ".home-hero__card",
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              stagger: 0.08,
              duration: 0.45,
              ease: "power2.out",
              overwrite: true,
            }
          );

          const slides = gsap.utils.toArray<HTMLElement>(".home-hero__slide");
          slidesRef.current = slides;
          if (slides.length) {
            slideIndexRef.current = 0;
            const tl = buildAutoSlideTimeline(slides, 0, (index) => {
              slideIndexRef.current = index;
              setSlide(index);
            }, heroTlRef);
            const hero = root.querySelector<HTMLElement>(".home-hero");
            const pause = () => tl.pause();
            const play = () => {
              buildAutoSlideTimeline(
                slidesRef.current,
                slideIndexRef.current,
                (index) => {
                  slideIndexRef.current = index;
                  setSlide(index);
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
          }
        },
        onReduce: () => {
          gsap.set(".home-hero__card", { autoAlpha: 1 });
          gsap.set(".home-hero__slide", { opacity: 0, visibility: "visible" });
          gsap.set(".home-hero__slide:first-child", { opacity: 1 });
        },
      });

      return () => cleanupHero?.();
    },
    {
      scope: rootRef,
      dependencies: [dynamicCovers.length, cmsCards.length],
      revertOnUpdate: true,
    }
  );

  return (
    <div ref={rootRef} className="home" data-node-id="6:1016">
      {/* Hero — full viewport width; overlays on 12-col (60 / 20) */}
      <section className="home-hero" aria-label="Hero">
        <div
          className="home-hero__slides"
          aria-hidden
          onDoubleClick={() => setLightboxOpen(true)}
        >
          {covers.map((c) => (
            <img
              key={c.id}
              className="home-hero__slide home-hero__bg"
              src={c.image_url}
              alt={c.artwork_name ?? ""}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          ))}
        </div>

        {covers.length > 1 ? (
          <>
            <button
              type="button"
              className="home-hero__nav home-hero__nav--prev"
              aria-label="Previous slide"
              onClick={() => goToSlide((slide - 1 + covers.length) % covers.length)}
            >
              <img src="/icons/arrow-switch.svg" alt="" aria-hidden />
            </button>
            <button
              type="button"
              className="home-hero__nav home-hero__nav--next"
              aria-label="Next slide"
              onClick={() => goToSlide((slide + 1) % covers.length)}
            >
              <img src="/icons/arrow-switch.svg" alt="" aria-hidden />
            </button>
          </>
        ) : null}

        {/* Overlay sits on the page grid */}
        <div className="home-hero__grid">
          {cards.filter((c) => !dismissedCardIds.includes(c.id)).length > 0 ? (
            <div
              className="home-hero__stack fig-span3-plus-gutter"
              data-node-id="17:309"
              tabIndex={0}
              aria-label="Edition updates. Hover or focus to expand."
            >
              {cards
                .filter((c) => !dismissedCardIds.includes(c.id))
                .map((item, i, arr) => (
                  <article
                    key={item.id}
                    className="home-hero__card home-hero__card--interactive"
                    style={{ zIndex: arr.length - i }}
                    data-offset={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.heading}. Open update.`}
                    onClick={() => openCard(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCard(item);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="home-hero__card-close"
                      aria-label={`Dismiss ${item.heading}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedCardIds((prev) => [...prev, item.id]);
                      }}
                    >
                      ✕
                    </button>
                    <div className="home-hero__card-inner">
                      <h2 className="home-hero__card-title">{item.heading}</h2>
                      <p className="home-hero__card-body">{item.body}</p>
                    </div>
                  </article>
                ))}
            </div>
          ) : null}

          <div className="home-hero__meta">
            {showCredits ? (
              <div className="home-hero__credit">
                {showArtwork ? <p className="home-hero__artwork">{creditArtwork}</p> : null}
                {showArtist ? <p className="home-hero__artist">{creditArtist}</p> : null}
                {showInstitution ? <p className="home-hero__inst">{creditInst}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="home-hero__dots home-hero__dots--centered"
          role="tablist"
          aria-label="Hero slides"
        >
          {covers.map((cover, i) => (
            <button
              key={cover.id}
              type="button"
              role="tab"
              aria-selected={slide === i}
              className={slide === i ? "is-active" : undefined}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
      </section>

      {lightboxOpen ? (
        <GalleryLightbox
          images={covers.map((c) => c.image_url)}
          index={slide}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={goToSlide}
        />
      ) : null}

      <div className="home__main">
        {/* Edition intro — label cols 1–3, body cols 4–9 (Figma 1:955 / 1:956) */}
        <section id="editions" className="home-section home-edition">
          <div className="fig-grid">
            <h2 className="fig-label fig-heading">
              Students&apos; Biennale
              <br />
              {yearId.replace("-", "–")}
            </h2>
            <div className="home-edition__body fig-c4-9">
              {editionShort.split("\n\n").map((p) => (
                <p key={p.slice(0, 40)} className="fig-body">
                  {p}
                </p>
              ))}
              <div ref={editionMoreRef} className="home-edition__more" aria-hidden={!editionExpanded}>
                {editionMore.split("\n\n").map((p) => (
                  <p key={p.slice(0, 40)} className="fig-body">
                    {p}
                  </p>
                ))}
              </div>
              <button
                type="button"
                className="home-text-btn"
                aria-expanded={editionExpanded}
                onClick={() => setEditionExpanded((v) => !v)}
              >
                {editionExpanded ? "Read less..." : "Read more..."}
              </button>
            </div>
          </div>
        </section>

        {/* Sensing Grounds — links cols 1–3, image strip cols 4–12 */}
        <section className="home-section home-sensing">
          <div className="fig-grid home-sensing__row">
            <nav className="home-sensing__links fig-rail" aria-label="Edition links">
              <button
                type="button"
                className="fig-subheading"
                onClick={() => setSensingOpen(true)}
              >
                {sensingNote.title}
                <span className="fig-subheading__underline" aria-hidden />
              </button>
              <Link to={`/editions/${yearId}/curators`} className="fig-subheading">
                Curators
                <span className="fig-subheading__underline" aria-hidden />
              </Link>
              <Link to={`/editions/${yearId}/artworks`} className="fig-subheading">
                Artworks
                <span className="fig-subheading__underline" aria-hidden />
              </Link>
              <Link to={`/editions/${yearId}/venue`} className="fig-subheading">
                Venues
                <span className="fig-subheading__underline" aria-hidden />
              </Link>
            </nav>
            <div className="home-sensing__scroll fig-c4-12">
              <div ref={sensingTrackRef} className="home-sensing__scroll-track">
                {[...SENSING_STRIP_IMAGES, ...SENSING_STRIP_IMAGES].map((src, i) => (
                  <div className="home-sensing__scroll-item" key={`${src}-${i}`}>
                    <img src={src} alt="" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="fig-grid home-sensing__cta">
            <CtaLink
              className="fig-cta-end"
              to={`/editions/${yearId}/curators`}
              lines={["EXPLORE", "EDITION"]}
              spacing={["0.135em", "0.2em"]}
            />
          </div>
        </section>

        <SpotlightModal
          open={sensingOpen}
          onClose={() => setSensingOpen(false)}
          title={sensingNote.title}
          attribution={sensingNote.attribution}
        >
          <div className="spotlight__body--split fig-sub-2">
            <div className="spotlight__column">
              {(SENSING_GROUNDS_NOTE.paragraphsCol1 ?? sensingNote.paragraphs.slice(0, 2)).map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
            <div className="spotlight__column">
              {(SENSING_GROUNDS_NOTE.paragraphsCol2 ?? sensingNote.paragraphs.slice(2)).map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>
        </SpotlightModal>

        <UpdateCardSpotlight
          card={activeCard}
          onClose={() => setActiveCard(null)}
          onConfirmNavigate={confirmCardNavigate}
        />

        {/* Upcoming programmes */}
        <section id="programmes" className="home-section home-programmes">
          <div className="fig-grid home-programmes__top">
            <h2 className="fig-label fig-heading">
              UPCOMING
              <br />
              PROGRAMMES
            </h2>
            <div className="home-programmes__banner fig-c4-12">
              <img src="/home/programmes-banner.jpg" alt="" />
            </div>
          </div>
          <div className="fig-grid home-programmes__bottom">
            <div className="home-programmes__rail fig-rail">
              {(
                [
                  { label: "WORKSHOPS", hash: "workshops" },
                  { label: "AWARDS", hash: "awards" },
                  { label: "RESIDENCIES", hash: "residencies" },
                ] as const
              ).map((tab) => (
                <Link
                  key={tab.hash}
                  to={`/programmes#${tab.hash}`}
                  className={`fig-subheading${programmesHover === tab.hash ? " is-selected" : ""}`}
                  onMouseEnter={() => setProgrammesHover(tab.hash)}
                  onMouseLeave={() => setProgrammesHover(null)}
                >
                  {tab.label}
                  <span className="fig-subheading__underline" aria-hidden />
                </Link>
              ))}
            </div>
            <div ref={programmesThumbsRef} className="home-programmes__thumbs fig-c4-12">
              {[
                { hash: "workshops", to: "/programmes#workshops", img: workshopThumb },
                { hash: "awards", to: "/programmes#awards", img: awardsThumb },
                { hash: "residencies", to: "/programmes#residencies", img: residencyThumb },
              ].map((tab) => (
                <Link
                  key={tab.hash}
                  ref={(el) => {
                    programmesThumbEls.current[tab.hash] = el;
                  }}
                  to={tab.to}
                  onMouseEnter={() => setProgrammesHover(tab.hash)}
                  onMouseLeave={() => setProgrammesHover(null)}
                >
                  <img src={tab.img} alt="" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Press */}
        <section id="press" className="home-section home-press">
          <div className="fig-grid">
            <h2 className="fig-label fig-heading">PRESS</h2>
            <img className="home-press__featured-img fig-c4-6" src="/home/press-featured.jpg" alt="" />
            <article className="home-press__featured fig-c7-12">
              <div>
                <div className="home-press__featured-head">
                  <h3>KBF Announces Curators For Students&apos; Biennale 2025-26</h3>
                  <time>4 Dec 2025</time>
                </div>
                <p className="fig-body">
                  The Kochi Biennale Foundation (KBF) has announced the curators for Students&apos;
                  Biennale, a key educational initiative of the Kochi Biennale Foundation for budding
                  young artists. The programme works with state-funded art colleges across India,
                  encouraging emerging artists to reflect on their practice and showcase their work
                  on an international stage.
                </p>
                <Link to="/press?article=kbf-curators" className="home-text-btn">
                  Read more...
                </Link>
              </div>
            </article>
            <ul className="home-press__list fig-c4-12">
              {PRESS_LIST.map((item) => (
                <li key={item.id}>
                  <Link to={`/press?article=${item.id}`}>
                    <span>{item.title}</span>
                    <time>{item.date}</time>
                  </Link>
                </li>
              ))}
            </ul>
            <CtaLink
              className="fig-cta-end home-press__more"
              to="/press"
              lines={["VIEW", "MORE"]}
              spacing={["0.26em", "0.135em"]}
            />
          </div>
        </section>

        {/* About */}
        <section id="about" className="home-section home-about">
          <div className="fig-grid home-about__intro">
            <h2 className="fig-label fig-heading">ABOUT US</h2>
          </div>
          <div className="fig-grid home-about__block">
            <img
              className="home-about__logo-kbf fig-c1-3"
              src="/home/logo-kbf-about.svg"
              alt="Kochi Biennale Foundation"
              width={217}
              height={68}
            />
            <p className="fig-body fig-c4-9">
              The Kochi Biennale Foundation (KBF) was established in 2010 as a non-profit, charitable
              trust to promote art, culture, heritage, and education. Every two years, KBF hosts the
              Kochi-Muziris Biennale (KMB), India&apos;s first and largest contemporary art Biennale, in
              the historic port city of Kochi. It also actively contributes to the restoration and
              conservation of heritage properties and monuments, and the revival of traditional forms of
              art and culture. The Government of Kerala has been a principal supporter of the
              Foundation.
            </p>
          </div>
          <div className="fig-grid home-about__block">
            <div className="home-about__logo-sb fig-c1-3" aria-label="Students' Biennale">
              <img src="/home/logo-sb-mark-about.svg" alt="" width={72} height={100} />
              <img src="/home/logo-sb-word-about.svg" alt="Students' Biennale" width={120} height={48} />
            </div>
            <div className="home-about__sb-copy fig-c4-9">
              <p className="fig-body">
                Established by the Kochi Biennale Foundation in 2014, The Students&apos; Biennale is the
                Kochi Biennale Foundation&apos;s flagship educational initiative and one of the most
                significant platforms for emerging artists in India.
              </p>
              <p className="fig-body">
                At its core, the Students&apos; Biennale is both an exhibition platform and an evolving
                educational initiative. Through exhibitions, workshops, residencies, mentorship
                programmes, public talks, research projects, awards, and international exchanges, it
                fosters dialogue, experimentation, and collaboration while supporting the professional
                and creative development of the next generation of artists.
              </p>
              <p className="fig-body">
                The Students&apos; Biennale runs parallel to each edition of the Kochi-Muziris Biennale
                since its inception. Conceived to complement and strengthen fine arts education, it
                provides students and recent graduates with the opportunity to exhibit their work
                within the context of an international contemporary art exhibition while engaging with
                artists, curators, educators, researchers, and audiences from around the world. It
                creates a space where artistic practice, critical inquiry, and learning converge,
                enabling emerging practitioners to develop their work beyond the boundaries of the
                classroom.
              </p>
              <p className="fig-body">
                Each edition brings together participants from art institutions across India through
                curatorial research, institutional collaborations, and open calls. By connecting
                diverse artistic practices and pedagogical approaches, the programme reflects the
                breadth of contemporary art education while encouraging students to engage with the
                social, cultural, political, and ecological questions of our time.
              </p>
              <p className="fig-body">
                More than an exhibition, the Students&apos; Biennale is a long-term commitment to art
                education. It seeks to build lasting relationships between students, institutions,
                educators, and the wider contemporary art community, creating opportunities for
                exchange, critical reflection, and collective learning. Through this sustained
                engagement, the programme continues to nurture emerging artistic voices while
                contributing to the future of contemporary art education in India and beyond.
              </p>
            </div>
          </div>

          <div className="fig-grid home-about__team">
            <h3 className="fig-label fig-label--sub">
              students&apos; biennale
              <br />
              2025-26 Team
            </h3>
            <div className="home-about__team-cols fig-c4-12 fig-sub-3">
              {TEAM_COLS.map((col, i) => (
                <div key={i}>
                  {col.map(([role, ...people]) => (
                    <div key={role} className="home-about__role">
                      <strong>{role}</strong>
                      {people.map((name) => (
                        <span key={name}>{name}</span>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="fig-grid home-about__sponsors">
            <h3 className="fig-label fig-label--sub">sponsors</h3>
            <div className="home-about__sponsor-grid fig-c4-12 fig-sub-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="home-about__sponsor" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
