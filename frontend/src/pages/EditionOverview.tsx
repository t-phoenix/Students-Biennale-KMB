import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CarouselNavArrows } from "../components/CarouselNavArrows";
import { CtaLink } from "../components/CtaLink";
import { HighlightText } from "../components/HighlightText";
import { getEditionOverview } from "../data/editions";
import { LATEST_EDITION } from "../data/site";
import { useCatalogue, useEditionCatalogue } from "../lib/catalogue";
import { buildAutoSlideTimeline, jumpToSlide } from "../lib/imageSlider";
import { useCarouselDotsTone } from "../lib/useCarouselDotsTone";
import { preloadUrls } from "../lib/preloadImages";
import "./EditionOverview.css";

/** Split "Inaugural Edition (2014 - 15)" into display lines for the title rail. */
function splitEditionSubtitle(subtitle: string): { lines: string[] } {
  const match = subtitle.match(/^(.+?)\s*(\([^)]+\))$/);
  if (match) return { lines: [match[1].trim(), match[2].trim()] };
  return { lines: [subtitle] };
}

function TeamGrid({
  team,
  highlight,
}: {
  team: readonly (readonly (readonly string[])[])[];
  highlight: string;
}) {
  return (
    <div className="edition-overview__team-grid">
      {team.map((col, i) => (
        <div key={i} className="edition-overview__team-col">
          {col.map(([role, ...people]) => (
            <div key={role} className="edition-overview__role">
              <strong>{role}</strong>
              {people.map((name) => (
                <span key={name}>
                  <HighlightText text={name} query={highlight} />
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function InstitutionsList({
  names,
  highlight,
}: {
  names: readonly string[];
  highlight: string;
}) {
  return (
    <p className="fig-c4-12 fig-body edition-overview__institutions">
      {names.map((name, index) => (
        <span key={name}>
          {index > 0 ? <span className="edition-overview__pipe"> | </span> : null}
          <HighlightText text={name} query={highlight} />
        </span>
      ))}
    </p>
  );
}

/**
 * Edition overview — Figma "Previous Editions Page" (929:4591).
 * Previous editions use the right-aligned title rail, three-column team, pipe-separated
 * institutions, and a 4×2 gallery. Cover uses a 5s auto-rotating hero carousel when
 * multiple frames are available.
 */
export function EditionOverview() {
  const { yearId = LATEST_EDITION.id } = useParams();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get("highlight") ?? "";
  const root = useRef<HTMLDivElement>(null);
  const heroTlRef = useRef<gsap.core.Timeline | null>(null);
  const slidesRef = useRef<HTMLElement[]>([]);
  const slideIndexRef = useRef(0);
  const [slide, setSlide] = useState(0);
  const fallback = getEditionOverview(yearId);
  const { catalogue } = useEditionCatalogue(yearId);
  const { catalogues } = useCatalogue();
  const isPreviousEdition = yearId !== LATEST_EDITION.id;
  const yearIds = catalogues.map((row) => row.years);
  const yearIndex = yearIds.indexOf(yearId);
  const nextId = yearIndex > 0 ? yearIds[yearIndex - 1] : fallback.nextId;
  const intro = catalogue.overview
    ? catalogue.overview.split("\n\n").filter(Boolean)
    : fallback.intro;
  const institutions = catalogue.institutions.length
    ? catalogue.institutions
    : fallback.institutions;
  const heroImages = (() => {
    if (catalogue.heroUrls.length) return catalogue.heroUrls;
    if (fallback.heroImages?.length) return [...fallback.heroImages];
    const single = catalogue.heroUrl || fallback.heroImage;
    return single ? [single] : [];
  })();
  const heroImage = heroImages[0];
  const galleryImages = catalogue.galleryUrls.length
    ? catalogue.galleryUrls
    : fallback.galleryImages;
  const edition = {
    ...fallback,
    title:
      catalogue.source === "remote" && catalogue.title
        ? catalogue.title
        : fallback.title,
    intro,
    institutions,
    heroImage,
    heroImages,
    galleryImages,
    nextId,
    subtitle: fallback.subtitle,
  };
  const subtitleLines = isPreviousEdition
    ? splitEditionSubtitle(edition.subtitle).lines
    : [edition.subtitle];
  const nextLabel = edition.nextId?.replace("-", "–") ?? "";

  useEffect(() => {
    if (heroImages.length <= 1) return;
    void preloadUrls(heroImages.slice(1));
  }, [heroImages]);

  const goToSlide = useCallback((index: number) => {
    const slides = slidesRef.current;
    if (!slides.length || index < 0 || index >= slides.length) return;
    if (index === slideIndexRef.current) return;

    heroTlRef.current?.pause();
    jumpToSlide(slides, slideIndexRef.current, index);
    slideIndexRef.current = index;
    setSlide(index);
  }, []);

  const resumeHeroTimeline = useCallback((index: number) => {
    if (prefersReducedMotion() || slidesRef.current.length <= 1) return;
    buildAutoSlideTimeline(
      slidesRef.current,
      index,
      (next) => {
        slideIndexRef.current = next;
        setSlide(next);
      },
      heroTlRef,
      5,
    );
  }, []);

  const currentHeroSrc = heroImages[slide] ?? heroImages[0] ?? "";
  const dotsTone = useCarouselDotsTone(currentHeroSrc, "right");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ".edition-overview__reveal",
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          stagger: { amount: 0.35, ease: "power2.out" },
          ease: "power3.out",
        }
      );
    },
    { scope: root, dependencies: [yearId] }
  );

  useGSAP(
    () => {
      const rootEl = root.current;
      if (!rootEl || heroImages.length <= 1) {
        heroTlRef.current?.kill();
        heroTlRef.current = null;
        return;
      }

      const slides = gsap.utils.toArray<HTMLElement>(
        rootEl.querySelectorAll(".edition-overview__hero-slide"),
      );
      slidesRef.current = slides;
      if (!slides.length) return;

      slideIndexRef.current = 0;
      setSlide(0);

      if (prefersReducedMotion()) {
        gsap.set(slides, { opacity: 0, visibility: "visible" });
        gsap.set(slides[0], { opacity: 1 });
        return;
      }

      buildAutoSlideTimeline(
        slides,
        0,
        (index) => {
          slideIndexRef.current = index;
          setSlide(index);
        },
        heroTlRef,
        5,
      );

      const onEnter = () => heroTlRef.current?.pause();
      const onLeave = () => heroTlRef.current?.resume();
      rootEl.querySelector(".edition-overview__hero")?.addEventListener("mouseenter", onEnter);
      rootEl.querySelector(".edition-overview__hero")?.addEventListener("mouseleave", onLeave);

      return () => {
        heroTlRef.current?.kill();
        heroTlRef.current = null;
        rootEl.querySelector(".edition-overview__hero")?.removeEventListener("mouseenter", onEnter);
        rootEl.querySelector(".edition-overview__hero")?.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: root, dependencies: [yearId, heroImages.join("|")] }
  );

  return (
    <div
      ref={root}
      className={`edition-overview${isPreviousEdition ? " edition-overview--previous" : ""}`}
    >
      <div className="edition-overview__hero">
        {heroImages.length ? (
          <>
            <div className="edition-overview__hero-slides">
              {heroImages.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="edition-overview__hero-slide"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                />
              ))}
            </div>
            {heroImages.length > 1 ? (
              <>
                <CarouselNavArrows
                  slideSrc={currentHeroSrc}
                  onPrev={() => {
                    const i = (slide - 1 + heroImages.length) % heroImages.length;
                    goToSlide(i);
                    resumeHeroTimeline(i);
                  }}
                  onNext={() => {
                    const i = (slide + 1) % heroImages.length;
                    goToSlide(i);
                    resumeHeroTimeline(i);
                  }}
                />
                <div
                  className="edition-overview__hero-dots carousel-dots"
                  data-tone={dotsTone}
                  role="tablist"
                  aria-label="Edition cover images"
                >
                {heroImages.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    role="tab"
                    aria-label={`Image ${i + 1} of ${heroImages.length}`}
                    aria-selected={i === slide}
                    className={i === slide ? "is-active" : undefined}
                    onClick={() => {
                      goToSlide(i);
                      resumeHeroTimeline(i);
                    }}
                  />
                ))}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <div className="edition-overview__hero-fallback" aria-hidden />
        )}
      </div>

      <div className="fig-grid edition-overview__section">
        {isPreviousEdition ? (
          <div className="fig-rail edition-overview__title-rail edition-overview__reveal">
            <h1 className="edition-overview__title-main">{edition.title}</h1>
            {subtitleLines.map((line) => (
              <p key={line} className="edition-overview__title-edition">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <h1 className="fig-label fig-heading edition-overview__title edition-overview__reveal">
            {edition.title}
            <br />
            {edition.subtitle}
          </h1>
        )}
        <div className="fig-c4-9 edition-overview__intro edition-overview__reveal">
          {edition.intro.map((para) => (
            <p key={para.slice(0, 48)} className="fig-body">
              <HighlightText text={para} query={highlight} />
            </p>
          ))}
        </div>
      </div>

      {!isPreviousEdition ? (
        <div className="fig-grid edition-overview__section">
          <p className="fig-label fig-label--sub edition-overview__reveal">CATALOGUE</p>
          <nav className="fig-c4-12 edition-overview__links edition-overview__reveal">
            <Link to={`/editions/${yearId}/curators`} className="fig-subheading">
              CURATORS
              <span className="fig-subheading__underline" aria-hidden />
            </Link>
            <Link to={`/editions/${yearId}/artworks`} className="fig-subheading">
              ARTWORKS
              <span className="fig-subheading__underline" aria-hidden />
            </Link>
            <Link to={`/editions/${yearId}/artists`} className="fig-subheading">
              ARTISTS
              <span className="fig-subheading__underline" aria-hidden />
            </Link>
            <Link to={`/editions/${yearId}/venue`} className="fig-subheading">
              VENUES
              <span className="fig-subheading__underline" aria-hidden />
            </Link>
          </nav>
        </div>
      ) : null}

      {edition.team.length ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">THE TEAM</h2>
          <div className="fig-c4-12 edition-overview__reveal">
            <TeamGrid team={edition.team} highlight={highlight} />
          </div>
        </div>
      ) : catalogue.teamBody ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">THE TEAM</h2>
          <div
            className="fig-c4-12 fig-body edition-overview__team-body edition-overview__reveal"
          >
            <HighlightText text={catalogue.teamBody} query={highlight} />
          </div>
        </div>
      ) : null}

      {edition.institutions.length ? (
        <div className="fig-grid edition-overview__section">
          <h2 className="fig-label fig-label--sub edition-overview__reveal">
            PARTICIPATING INSTITUTIONS
          </h2>
          {isPreviousEdition ? (
            <InstitutionsList names={edition.institutions} highlight={highlight} />
          ) : (
            <p className="fig-c4-12 fig-body edition-overview__reveal">
              <HighlightText text={edition.institutions.join(" · ")} query={highlight} />
            </p>
          )}
        </div>
      ) : null}

      {edition.galleryImages.length ? (
        <div className="fig-grid edition-overview__gallery">
          {edition.galleryImages.map((src) => (
            <div key={src} className="edition-overview__slot edition-overview__reveal">
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      ) : null}

      {edition.nextId ? (
        <div className="fig-grid edition-overview__nav">
          {isPreviousEdition ? (
            <CtaLink
              className="fig-cta-end"
              to={`/editions/${edition.nextId}`}
              lines={["Students' Biennale", nextLabel]}
              spacing={["0.1em", "0.1em"]}
              variant="next"
            />
          ) : (
            <CtaLink
              className="fig-cta-end"
              to={`/editions/${edition.nextId}`}
              lines={["Next", "Edition"]}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
