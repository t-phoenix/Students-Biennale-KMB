import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { CarouselNavArrows } from "../components/CarouselNavArrows";
import { CtaLink } from "../components/CtaLink";
import { BrandArrow } from "../components/BrandArrow";
import { HighlightText } from "../components/HighlightText";
import {
  getEditionOverview,
  getEditionSearchTags,
  type CuratorBio,
  type EditionDownload,
  type InstitutionWithArtists,
} from "../data/editions";
import { LATEST_EDITION } from "../data/site";
import { useCatalogue, useEditionCatalogue } from "../lib/catalogue";
import { buildAutoSlideTimeline, jumpToSlide } from "../lib/imageSlider";
import { useCarouselDotsTone } from "../lib/useCarouselDotsTone";
import { preloadUrls } from "../lib/preloadImages";
import "./EditionOverview.css";

/** Split subtitle/title lines for the right-aligned title rail in previous editions. */
function splitEditionSubtitle(title: string, subtitle: string): { lines: string[] } {
  if (subtitle.includes("\n")) {
    const lines = subtitle.split("\n").map((l) => l.trim()).filter(Boolean);
    return { lines };
  }
  const match = subtitle.match(/^(.+?)\s*(\([^)]+\))$/);
  if (match) return { lines: [match[1].trim(), match[2].trim()] };
  return { lines: [title, subtitle].filter(Boolean) };
}

function CuratorBiosGrid({
  bios,
  highlight,
}: {
  bios: CuratorBio[];
  highlight: string;
}) {
  return (
    <div className="edition-overview__curators-wrapper">
      <h3 className="edition-overview__team-category">Curators</h3>
      <div className="edition-overview__curator-bios">
        {bios.map((profile) => (
          <div key={profile.name} className="edition-overview__bio-card">
            <h4 className="edition-overview__bio-name">
              <HighlightText text={profile.name} query={highlight} />
            </h4>
            <p className="edition-overview__bio-text fig-body">
              <HighlightText text={profile.bio} query={highlight} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamGrid({
  team,
  highlight,
}: {
  team: readonly (readonly (readonly string[])[])[];
  highlight: string;
}) {
  const colsCount = Math.min(Math.max(team.length, 1), 3);
  const colsClass = `edition-overview__team-grid--cols-${colsCount}`;
  return (
    <div className={`edition-overview__team-grid ${colsClass}`}>
      {team.map((col, colIdx) => (
        <div key={colIdx} className="edition-overview__team-col">
          {col.map(([role, ...members]) => (
            <div key={role} className="edition-overview__role">
              <strong className="edition-overview__role-title">
                <HighlightText text={role} query={highlight} />
              </strong>
              {members.map((person) => (
                <span key={person} className="edition-overview__role-member">
                  <HighlightText text={person} query={highlight} />
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CuratorialNoteSection({
  note,
  highlight,
  isPreviousEdition,
}: {
  note: { title: string; paragraphs: string[] };
  highlight: string;
  isPreviousEdition: boolean;
}) {
  return (
    <div className="fig-grid edition-overview__section edition-overview__curatorial-note">
      <div
        className={
          isPreviousEdition
            ? "fig-rail edition-overview__rail-label edition-overview__reveal"
            : "fig-label fig-label--sub edition-overview__reveal"
        }
      >
        {note.title.toUpperCase()}
      </div>
      <div className="fig-c4-9 edition-overview__curatorial-body edition-overview__reveal">
        {note.paragraphs.map((para, i) => (
          <p key={i} className="fig-body">
            <HighlightText text={para} query={highlight} />
          </p>
        ))}
      </div>
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

function InstitutionsAndArtistsList({
  items,
  highlight,
}: {
  items: InstitutionWithArtists[];
  highlight: string;
}) {
  return (
    <p className="fig-c4-12 fig-body edition-overview__institutions-artists">
      {items.map((item, idx) => (
        <span key={idx}>
          {idx > 0 ? <span className="edition-overview__pipe"> | </span> : null}
          <strong className="edition-overview__inst-name">
            <HighlightText text={item.institution} query={highlight} />
          </strong>
          {item.artists ? (
            <span className="edition-overview__artists-names">
              {" — "}<HighlightText text={item.artists} query={highlight} />
            </span>
          ) : null}
        </span>
      ))}
    </p>
  );
}

function EditionDownloadsList({
  downloads,
}: {
  downloads: EditionDownload[];
}) {
  return (
    <div className="fig-grid edition-overview__section edition-overview__downloads-section">
      <div className="fig-rail" />
      <div className="fig-c4-12 edition-overview__downloads-grid edition-overview__reveal">
        {downloads.map((item) => (
          <a
            key={item.title}
            href={item.href || "#"}
            className="edition-overview__download-card"
            target={item.href && item.href !== "#" ? "_blank" : undefined}
            rel="noopener noreferrer"
          >
            <span className="edition-overview__download-title">{item.title}</span>
            <span className="edition-overview__download-action">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/** Pipe-separated credit names from edition search tags. */
function TaggedCreditsList({
  names,
  highlight,
}: {
  names: readonly string[];
  highlight: string;
}) {
  if (!names.length) return null;
  return <InstitutionsList names={names} highlight={highlight} />;
}

/**
 * Dynamic Edition overview — Loads all content, titles, notes, and credits with CMS-first priority
 * and comprehensive static fallback data for previous editions.
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
  const searchTags = getEditionSearchTags(yearId);

  // Extract dynamic sections with fallback to static data
  const title =
    catalogue.title && catalogue.title !== "Students' Biennale"
      ? catalogue.title
      : fallback.title;

  const subtitle = isPreviousEdition
    ? (fallback.subtitle ||
      (catalogue.title !== "Students' Biennale"
        ? `${catalogue.title}\n${yearId.replace("-", "–")}`
        : yearId.replace("-", "–")))
    : "2025–26";

  const subtitleLines = isPreviousEdition
    ? (fallback.titleLines || splitEditionSubtitle(title, subtitle).lines)
    : [subtitle];

function cleanIntroParagraphs(
  paragraphs: string[],
  isPreviousEdition: boolean,
  title: string,
  subtitle: string,
): string[] {
  if (!isPreviousEdition) return paragraphs;
  return paragraphs.filter((p) => {
    const trimmed = p.trim();
    if (!trimmed) return false;
    if (
      /^(The\s+)?Students['’]?\s*Biennale\s*(Inaugural\s*Edition)?\s*(\(\s*\d{4}\s*[-–]\s*\d{2}\s*\)|\d{4}\s*[-–]\s*\d{2})?$/i.test(
        trimmed,
      )
    ) {
      return false;
    }
    if (
      /^(The\s+)?(Inaugural\s*Edition|Later the atelier ate her|Making as Thinking|States of Disarray:?\s*Practice as Restitution|In the Making)\s*(\(\s*\d{4}\s*[-–]\s*\d{2}\s*\)|\d{4}\s*[-–]\s*\d{2})?$/i.test(
        trimmed,
      )
    ) {
      return false;
    }
    if (
      trimmed.toLowerCase() === title.toLowerCase() ||
      trimmed.toLowerCase() === subtitle.toLowerCase()
    ) {
      return false;
    }

    // Filter out Participating Institutions headings and pipe-separated lists
    if (/^Participating\s+Institutions/i.test(trimmed)) {
      return false;
    }
    if ((trimmed.match(/\|/g) || []).length >= 2) {
      return false;
    }

    // Filter out Team headers / dumps
    if (/^(THE\s+TEAM|Curators|Curatorial\s+Advisor|Project\s+Advisor|Advisors)/i.test(trimmed)) {
      return false;
    }

    return true;
  });
}

  const rawIntro = isPreviousEdition
    ? (fallback.intro.length ? fallback.intro : catalogue.overview ? catalogue.overview.split("\n\n").map((p) => p.trim()).filter(Boolean) : [])
    : (catalogue.overview
        ? catalogue.overview.split("\n\n").map((p) => p.trim()).filter(Boolean)
        : fallback.intro);

  const intro = cleanIntroParagraphs(rawIntro, isPreviousEdition, title, subtitle);

  const heroImages = (() => {
    if (isPreviousEdition) {
      if (fallback.heroImages?.length) return fallback.heroImages;
      if (fallback.heroImage) return [fallback.heroImage];
      if (catalogue.heroUrls.length) return catalogue.heroUrls;
      if (catalogue.heroUrl) return [catalogue.heroUrl];
      return [];
    }
    if (catalogue.heroUrls.length) return catalogue.heroUrls;
    if (catalogue.heroUrl) return [catalogue.heroUrl];
    if (fallback.heroImages?.length) return fallback.heroImages;
    if (fallback.heroImage) return [fallback.heroImage];
    return [];
  })();

  const galleryImages = isPreviousEdition
    ? (fallback.galleryImages?.length ? fallback.galleryImages : catalogue.galleryUrls)
    : (catalogue.galleryUrls.length ? catalogue.galleryUrls : fallback.galleryImages);

  // Curators with bios: from CMS if present, else from fallback
  const cmsCuratorBios: CuratorBio[] = catalogue.curators
    .filter((c) => Boolean(c.bio))
    .map((c) => ({ name: c.name, bio: c.bio! }));
  const curatorBios =
    cmsCuratorBios.length > 0 ? cmsCuratorBios : (fallback.curatorBios ?? []);

  // Curatorial note
  const curatorialNoteSection = catalogue.sections?.find(
    (s) => s.section_key === "curatorial_note",
  );
  const curatorialNote = catalogue.overallCuratorialNote
    ? {
        title: "Curatorial Note",
        paragraphs: catalogue.overallCuratorialNote
          .split("\n\n")
          .filter(Boolean),
      }
    : curatorialNoteSection?.body
      ? {
          title: curatorialNoteSection.title || "Curatorial Note",
          paragraphs: curatorialNoteSection.body.split("\n\n").filter(Boolean),
        }
      : fallback.curatorialNote;

  // Participating Institutions
  const institutions = isPreviousEdition
    ? fallback.institutions
    : catalogue.institutions.length
      ? catalogue.institutions
      : fallback.institutions;

  const institutionsWithArtists = fallback.institutionsWithArtists ?? [];

  // Downloads
  const downloadsSection = catalogue.sections?.find(
    (s) => s.section_key === "downloads",
  );
  const cmsDownloads: EditionDownload[] = (downloadsSection?.items ?? [])
    .filter((i) => Boolean(i.label || i.url))
    .map((i) => ({
      title: i.label || "Publication",
      label: "Download",
      href: i.url || "#",
    }));
  const downloads =
    cmsDownloads.length > 0 ? cmsDownloads : (fallback.downloads ?? []);

  const team = fallback.team;

  const showTaggedCredits =
    isPreviousEdition &&
    !curatorBios.length &&
    !catalogue.teamBody &&
    (!team || team.length === 0) &&
    (searchTags.curators.length > 0 ||
      searchTags.team.length > 0 ||
      searchTags.artists.length > 0 ||
      searchTags.venues.length > 0 ||
      searchTags.artworks.length > 0);

  useEffect(() => {
    const q = highlight.trim();
    if (!q || !root.current) return;
    const timer = window.setTimeout(() => {
      const mark = root.current?.querySelector("mark");
      mark?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "center",
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [
    highlight,
    yearId,
    catalogue.teamBody,
    catalogue.institutions,
    showTaggedCredits,
  ]);

  const yearIds = catalogues.map((row) => row.years);
  const yearIndex = yearIds.indexOf(yearId);
  const nextId =
    fallback.nextId || (yearIndex > 0 ? yearIds[yearIndex - 1] : undefined);
  const nextLabel = nextId ? nextId.replace("-", "–") : "";

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
  const dotsTone = useCarouselDotsTone(currentHeroSrc, "center");

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
        },
      );
    },
    { scope: root, dependencies: [yearId] },
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
      rootEl
        .querySelector(".edition-overview__hero")
        ?.addEventListener("mouseenter", onEnter);
      rootEl
        .querySelector(".edition-overview__hero")
        ?.addEventListener("mouseleave", onLeave);

      return () => {
        heroTlRef.current?.kill();
        heroTlRef.current = null;
        rootEl
          .querySelector(".edition-overview__hero")
          ?.removeEventListener("mouseenter", onEnter);
        rootEl
          .querySelector(".edition-overview__hero")
          ?.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: root, dependencies: [yearId, heroImages.join("|")] },
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
                    const i =
                      (slide - 1 + heroImages.length) % heroImages.length;
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
            {subtitleLines.map((line, idx) => (
              <p
                key={line + idx}
                className={
                  idx === 0
                    ? "edition-overview__title-main"
                    : "edition-overview__title-edition"
                }
              >
                {line}
              </p>
            ))}
          </div>
        ) : (
          <h1 className="fig-label fig-heading edition-overview__title edition-overview__reveal">
            {title}
            <br />
            {subtitle}
          </h1>
        )}
        <div className="fig-c4-9 edition-overview__intro edition-overview__reveal">
          {intro.map((para, i) => (
            <p key={i} className="fig-body">
              <HighlightText text={para} query={highlight} />
            </p>
          ))}
        </div>
      </div>

      {!isPreviousEdition ? (
        <div className="fig-grid edition-overview__section">
          <p className="fig-label fig-label--sub edition-overview__reveal">
            CATALOGUE
          </p>
          <nav className="fig-c4-12 edition-overview__links edition-overview__reveal">
            <Link
              to={`/editions/${yearId}/curators`}
              className="fig-subheading"
            >
              CURATORS
              <span className="fig-subheading__underline" aria-hidden />
            </Link>
            <Link
              to={`/editions/${yearId}/artworks`}
              className="fig-subheading"
            >
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

      {/* Curator Bios (2020-21, 2022-23 or CMS curator bios) */}
      {curatorBios.length > 0 ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            THE TEAM
          </div>
          <div className="fig-c4-12 edition-overview__reveal">
            <CuratorBiosGrid bios={curatorBios} highlight={highlight} />
          </div>
        </div>
      ) : catalogue.teamBody ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            THE TEAM
          </div>
          <div className="fig-c4-12 fig-body edition-overview__team-body edition-overview__reveal">
            <HighlightText text={catalogue.teamBody} query={highlight} />
          </div>
        </div>
      ) : team && team.length > 0 ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            THE TEAM
          </div>
          <div className="fig-c4-12 edition-overview__reveal">
            <TeamGrid team={team} highlight={highlight} />
          </div>
        </div>
      ) : showTaggedCredits &&
        (searchTags.curators.length || searchTags.team.length) ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            CURATORS & TEAM
          </div>
          <div className="fig-c4-12 edition-overview__reveal">
            <TaggedCreditsList
              names={[...searchTags.curators, ...searchTags.team]}
              highlight={highlight}
            />
          </div>
        </div>
      ) : null}

      {/* Curatorial Note (2018-19 or from CMS) */}
      {curatorialNote ? (
        <CuratorialNoteSection
          note={curatorialNote}
          highlight={highlight}
          isPreviousEdition={isPreviousEdition}
        />
      ) : null}

      {/* Participating Institutions & Artists (2022-23) or Participating Institutions (2014-15, 2016-17, 2018-19, 2020-21) */}
      {institutionsWithArtists.length > 0 ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            PARTICIPATING INSTITUTIONS AND ARTISTS
          </div>
          <InstitutionsAndArtistsList
            items={institutionsWithArtists}
            highlight={highlight}
          />
        </div>
      ) : institutions.length > 0 ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            PARTICIPATING INSTITUTIONS
          </div>
          {isPreviousEdition ? (
            <InstitutionsList names={institutions} highlight={highlight} />
          ) : (
            <p className="fig-c4-12 fig-body edition-overview__reveal">
              <HighlightText
                text={institutions.join(" · ")}
                query={highlight}
              />
            </p>
          )}
        </div>
      ) : null}

      {/* Downloads (2018-19, 2022-23 or CMS downloads) */}
      {downloads.length > 0 ? (
        <EditionDownloadsList downloads={downloads} />
      ) : null}

      {/* Tagged Credits Fallbacks */}
      {showTaggedCredits && searchTags.artists.length ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            ARTISTS
          </div>
          <div className="fig-c4-12 edition-overview__reveal">
            <TaggedCreditsList
              names={searchTags.artists}
              highlight={highlight}
            />
          </div>
        </div>
      ) : null}

      {showTaggedCredits && searchTags.venues.length ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            VENUES
          </div>
          <div className="fig-c4-12 edition-overview__reveal">
            <TaggedCreditsList
              names={searchTags.venues}
              highlight={highlight}
            />
          </div>
        </div>
      ) : null}

      {showTaggedCredits && searchTags.artworks.length ? (
        <div className="fig-grid edition-overview__section">
          <div
            className={
              isPreviousEdition
                ? "fig-rail edition-overview__rail-label edition-overview__reveal"
                : "fig-label fig-label--sub edition-overview__reveal"
            }
          >
            PROJECTS
          </div>
          <div className="fig-c4-12 edition-overview__reveal">
            <TaggedCreditsList
              names={searchTags.artworks}
              highlight={highlight}
            />
          </div>
        </div>
      ) : null}

      {/* Workshop / Photographic Gallery */}
      {galleryImages.length > 0 ? (
        <div className="fig-grid edition-overview__gallery">
          {galleryImages.map((src, i) => (
            <div
              key={src + i}
              className="edition-overview__slot edition-overview__reveal"
            >
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      ) : null}

      {/* Bottom Nav / Next Edition CTA */}
      <div className="fig-grid edition-overview__nav">
        <Link className="fig-c1-3 detail__back" to="/#editions">
          <BrandArrow direction="left" />
          <span>BACK</span>
        </Link>
        {nextId ? (
          isPreviousEdition ? (
            <CtaLink
              className="fig-cta-end"
              to={`/editions/${nextId}`}
              lines={["Students' Biennale", nextLabel]}
              spacing={["0.1em", "0.1em"]}
              direction="right"
            />
          ) : (
            <CtaLink
              className="fig-cta-end"
              to={`/editions/${nextId}`}
              lines={["Next", "Edition"]}
              direction="right"
            />
          )
        ) : null}
      </div>
    </div>
  );
}
