import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion, withMotionPreference, DISTANCE, DUR, EASE, EXIT, REVEAL } from "../lib/motion";
import { onAccordionKeyDown, rowClickOpensArticle, useAccordionHover, useEqualDrawerHeights } from "../lib/accordionScroll";
import { splitLinesOnScroll } from "../lib/splitTextScroll";
import { CarouselNavArrows } from "../components/CarouselNavArrows";
import { CtaLink } from "../components/CtaLink";
import { SpotlightModal } from "../components/SpotlightModal";
import { RazaSpotlightModal } from "../components/RazaSpotlightModal";
import { ScholarSpotlight } from "../components/ScholarSpotlight";
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
import { useCarouselDotsTone } from "../lib/useCarouselDotsTone";
import { prefetchHomeDestinations } from "../lib/predictivePrefetch";
import { ensureLcpImagePreload } from "../lib/preloadImages";
import { buildAutoSlideTimeline, jumpToSlide } from "../lib/imageSlider";
import { bindSwipeAway, GESTURE, useSlideGesture } from "../lib/gesture";
import { useProgrammes } from "../lib/programmes";
import { useProgrammesCovers } from "../lib/programmesCms";
import { usePressItems } from "../lib/pressCms";
import { useSplash } from "../lib/splash";
import { subscribeLenis, getLenisInstance } from "../lib/lenisSingleton";
import "./Home.css";

/** Home page entrances: quicker than the site-wide reveal, and they start a little sooner as a
 *  section scrolls in, so the page feels responsive rather than slow to arrive. Same easing,
 *  same order. Phone paragraph timing is already tuned in splitLinesOnScroll and is kept. */
const HOME_REVEAL = {
  duration: 1.0,
  stagger: 0.035,
  start: "top 88%",
  lines: () => (window.innerWidth <= 899 ? {} : { start: "top 88%", duration: 1.0, stagger: 0.06, delay: 0 }),
};

function normalizeCardMode(value: string | undefined | null): UpdateCardMode {
  if (value === "internal" || value === "external" || value === "content") return value;
  if (value === "programmes" || value === "news") return "internal";
  return "content";
}

/** Prefer catalogue covers for the Sensing Grounds strip; no local media pack. */
function sensingStripFromCatalogue(
  artworks: { image?: string }[] | undefined,
  limit = 8,
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const artwork of artworks ?? []) {
    const src = artwork.image?.trim();
    if (!src || seen.has(src)) continue;
    seen.add(src);
    urls.push(src);
    if (urls.length >= limit) break;
  }
  return urls;
}

export function Home() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const editionMoreRef = useRef<HTMLDivElement>(null);
  const sensingTrackRef = useRef<HTMLDivElement>(null);
  const heroTlRef = useRef<gsap.core.Timeline | null>(null);
  const slidesRef = useRef<HTMLElement[]>([]);
  const slideIndexRef = useRef(0);
  const heroRef = useRef<HTMLElement>(null);
  const heroAutoResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [slide, setSlide] = useState(0);
  // The slide whose caption is on screen. It trails `slide` so the caption can fade out, change
  // and fade in, instead of the words being swapped in place.
  const [creditSlide, setCreditSlide] = useState(0);
  const creditRef = useRef<HTMLDivElement>(null);
  const mobileCreditRef = useRef<HTMLDivElement>(null);
  const creditFadingIn = useRef(false);
  useEffect(() => {
    if (slide === creditSlide) return;
    const els = [creditRef.current, mobileCreditRef.current].filter((el): el is HTMLDivElement => Boolean(el));
    if (!els.length || prefersReducedMotion()) {
      setCreditSlide(slide);
      return;
    }
    // Out quickly (from wherever it is, if a fade was already running), then change.
    const out = gsap.to(els, {
      autoAlpha: 0,
      y: -4,
      duration: EXIT.micro,
      ease: EXIT.ease,
      overwrite: true,
      onComplete: () => {
        creditFadingIn.current = true;
        setCreditSlide(slide);
      },
    });
    return () => {
      out.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide]);
  useLayoutEffect(() => {
    if (!creditFadingIn.current) return;
    creditFadingIn.current = false;
    const els = [creditRef.current, mobileCreditRef.current].filter((el): el is HTMLDivElement => Boolean(el));
    if (!els.length) return;
    // In softly with the rest of the picture's crossfade.
    gsap.fromTo(
      els,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: DUR.slow, ease: EASE.fade, overwrite: true, clearProps: "opacity,visibility,transform" },
    );
  }, [creditSlide]);
  const [editionExpanded, setEditionExpanded] = useState(false);
  const [sensingOpen, setSensingOpen] = useState(false);
  const [razaModalOpen, setRazaModalOpen] = useState(false);
  const [openScholarId, setOpenScholarId] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<ActiveUpdateCard | null>(null);
  const [dismissedCardIds, setDismissedCardIds] = useState<string[]>([]);
  const [mobileCardsExpanded, setMobileCardsExpanded] = useState(false);
  const cardDraggingRef = useRef(false);
  const [programmesHover, setProgrammesHover] = useState<string | null>(null);
  // One article open at a time. null until the first click: the first article starts open.
  const [openPressId, setOpenPressId] = useState<string | null>(null);
  const pressHover = useAccordionHover(setOpenPressId);
  const pressListRef = useRef<HTMLDivElement>(null);
  const programmesLabelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Rail labels: wait a beat before reacting, and bridge the gaps between labels, so rolling the
  // pointer down the list doesn't make the thumbnails chase it.
  const labelHoverIn = (hash: string) => {
    if (programmesLabelTimer.current) clearTimeout(programmesLabelTimer.current);
    programmesLabelTimer.current = setTimeout(() => setProgrammesHover(hash), 200);
  };
  const labelHoverOut = () => {
    if (programmesLabelTimer.current) clearTimeout(programmesLabelTimer.current);
    programmesLabelTimer.current = setTimeout(() => setProgrammesHover(null), 260);
  };
  const thumbHover = (hash: string | null) => {
    if (programmesLabelTimer.current) clearTimeout(programmesLabelTimer.current);
    setProgrammesHover(hash);
  };
  const programmesThumbsRef = useRef<HTMLDivElement>(null);
  const programmesTweenRef = useRef<gsap.core.Tween | null>(null);
  const programmesThumbEls = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    if (razaModalOpen || openScholarId !== null || activeCard !== null) {
      heroTlRef.current?.pause();
    } else {
      heroTlRef.current?.play();
    }
  }, [razaModalOpen, openScholarId, activeCard]);

  // Smooth auto-collapse on mobile when scrolling, touching, or tapping outside the stack
  useEffect(() => {
    if (!mobileCardsExpanded) return;

    let touchStartY = 0;
    let touchStartX = 0;

    const collapse = () => {
      setMobileCardsExpanded(false);
    };

    const checkSwipeOrExit = (clientX: number, clientY: number) => {
      // Throwing a card away must not also collapse the stack underneath it.
      if (cardDraggingRef.current) return;
      const dx = clientX - touchStartX;
      const dy = clientY - touchStartY;
      const dist = Math.hypot(dx, dy);

      // Check if finger dragged 20% out of that section (.home-hero__stack)
      const stackEl = document.querySelector<HTMLElement>(".home-hero__stack");
      if (stackEl) {
        const rect = stackEl.getBoundingClientRect();
        const outPadX = rect.width * 0.20;
        const outPadY = rect.height * 0.20;
        const isOutOfSection =
          clientX < rect.left - outPadX ||
          clientX > rect.right + outPadX ||
          clientY < rect.top - outPadY ||
          clientY > rect.bottom + outPadY;

        if (isOutOfSection) {
          collapse();
          return;
        }

        // Swipe threshold: 20% of section/card height or > 15px gesture
        const swipeThreshold = Math.min(24, Math.max(14, rect.height * 0.15));
        if (dist > swipeThreshold) {
          collapse();
          return;
        }
      } else if (dist > 15) {
        collapse();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        checkSwipeOrExit(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      touchStartX = e.clientX;
      touchStartY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons > 0) {
        checkSwipeOrExit(e.clientX, e.clientY);
      }
    };

    window.addEventListener("scroll", collapse, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("wheel", collapse, { passive: true });
    document.addEventListener("scroll", collapse, { passive: true });

    let unLenis: (() => void) | undefined;
    const lenis = getLenisInstance();
    if (lenis) {
      lenis.on("scroll", collapse);
      unLenis = () => lenis.off("scroll", collapse);
    } else {
      unLenis = subscribeLenis((l) => {
        if (l) l.on("scroll", collapse);
      });
    }

    return () => {
      window.removeEventListener("scroll", collapse);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("wheel", collapse);
      document.removeEventListener("scroll", collapse);
      if (unLenis) unLenis();
      const currentLenis = getLenisInstance();
      if (currentLenis) {
        currentLenis.off("scroll", collapse);
      }
    };
  }, [mobileCardsExpanded]);
  const { current } = useCatalogue();
  const { upcomingWorkshops, pastWorkshops, residencies, awardsInternational, awardsNational } =
    useProgrammes();
  const { homeBannerUrl } = useProgrammesCovers();
  const { covers: dynamicCovers, cards: cmsCards } = useHomeCms();
  const { willShow: splashWillShow, completed: splashCompleted } = useSplash();
  const { items: pressItems } = usePressItems();
  const firstPressId = pressItems[0]?.id ?? "";
  const activePressId = openPressId ?? firstPressId;
  // Every article opens to the same height, so the section never changes height.
  useEqualDrawerHeights(pressListRef, ".home-press__drawer-content", pressItems.length);
  const covers = dynamicCovers;
  const cards: ActiveUpdateCard[] = cmsCards.map((c) => {
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
  });
  const currentCover = covers[slide] ?? covers[0];
  const dotsTone = useCarouselDotsTone(currentCover?.image_url ?? "", "center");
  // The caption follows the slide a beat behind: the old title fades out, then the new one
  // fades in, both within the picture's crossfade. (Swapping the text in place made it flicker.)
  const creditCover = covers[creditSlide] ?? currentCover;
  const showArtwork = heroCreditVisible(creditCover?.show_artwork_name, creditCover?.artwork_name);
  const showArtist = heroCreditVisible(creditCover?.show_artist, creditCover?.artist);
  const showInstitution = heroCreditVisible(
    creditCover?.show_institution,
    creditCover?.institution,
  );
  const creditArtwork = (creditCover?.artwork_name ?? "").trim();
  const creditArtist = (creditCover?.artist ?? "").trim();
  const creditInst = (creditCover?.institution ?? "").trim();
  const showCredits = showArtwork || showArtist || showInstitution;
  const workshopThumb =
    upcomingWorkshops[0]?.image || pastWorkshops[0]?.heroImage || "";
  const residencyThumb = residencies[0]?.heroImage || "";
  const awardsThumb =
    awardsInternational[0]?.image || awardsNational[0]?.image || "";
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
  const sensingStripImages = sensingStripFromCatalogue(current?.artworks);
  // Current org team is frontend-only (TEAM_COLS). Do not read catalogue.teamBody.
  const aboutTeamCols = TEAM_COLS;
  const sensingModalCol1 =
    sensingNote.paragraphs.length > 0
      ? sensingNote.paragraphs.slice(0, Math.ceil(sensingNote.paragraphs.length / 2))
      : (SENSING_GROUNDS_NOTE.paragraphsCol1 ?? []);
  const sensingModalCol2 =
    sensingNote.paragraphs.length > 0
      ? sensingNote.paragraphs.slice(Math.ceil(sensingNote.paragraphs.length / 2))
      : (SENSING_GROUNDS_NOTE.paragraphsCol2 ?? []);

  useEffect(() => {
    prefetchHomeDestinations(current ?? null);
  }, [current]);

  useEffect(() => {
    const first = covers[0]?.image_url;
    if (first) ensureLcpImagePreload(first);
  }, [covers]);

  const resumeHeroTimeline = useCallback((fromIndex: number) => {
    if (heroAutoResumeTimerRef.current) {
      clearTimeout(heroAutoResumeTimerRef.current);
      heroAutoResumeTimerRef.current = null;
    }
    heroAutoResumeTimerRef.current = setTimeout(() => {
      const slides = slidesRef.current;
      if (!slides.length || slides.length <= 1) return;
      buildAutoSlideTimeline(
        slides,
        fromIndex,
        (next) => {
          slideIndexRef.current = next;
          setSlide(next);
        },
        heroTlRef,
      );
    }, 5000);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      const slides = slidesRef.current;
      if (!slides.length || index < 0 || index >= slides.length) return;
      if (index === slideIndexRef.current) return;

      setMobileCardsExpanded(false);
      heroTlRef.current?.pause();
      jumpToSlide(slides, slideIndexRef.current, index);
      slideIndexRef.current = index;
      setSlide(index);
      resumeHeroTimeline(index);
    },
    [resumeHeroTimeline],
  );


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
      // Same downward reveal as every accordion: the text is already in place and the clip edge
      // lowers over it. Retargets from the current height if toggled mid-way.
      if (editionExpanded) {
        const from = el.offsetHeight;
        gsap.set(el, { height: "auto" });
        const target = el.offsetHeight;
        gsap.fromTo(
          el,
          { height: from },
          { height: target, duration: REVEAL.open, ease: REVEAL.easeOpen, overwrite: true,
            // Stays open at its natural height if the text later reflows (rotation, resize).
            onComplete: () => gsap.set(el, { height: "auto" }) }
        );
      } else {
        // A single expander, not a list: it closes on the quick exit.
        gsap.to(el, { height: 0, duration: EXIT.duration, ease: EXIT.ease, overwrite: true });
      }
    },
    { dependencies: [editionExpanded], scope: rootRef }
  );

  // Sensing Grounds image strip —
  // Unified high-performance ticker loop across Mobile, Tab, and Desktop:
  // - Auto-cruise right-to-left marquee (-50% in 28s)
  // - Desktop mouse hover slowdown (to 0.25x on mouse enter, 1x on leave)
  // - Interactive touch & swipe on Tab, Mobile, and Desktop: real-time dragging,
  //   flick momentum deceleration, 1.2s dwell pause, smooth acceleration back to cruise,
  //   and vertical scroll intent detection so vertical page scroll is never hijacked.
  useGSAP(
    () => {
      const track = sensingTrackRef.current;
      if (!track || prefersReducedMotion() || sensingStripImages.length === 0) return;

      const wrap = gsap.utils.wrap(-50, 0);
      let currentXPercent = wrap(Number(gsap.getProperty(track, "xPercent")) || 0);
      let isDragging = false;
      let isGesturing = false;
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let lastTime = 0;
      let velocityX = 0; // px / ms
      let momentumTween: gsap.core.Tween | null = null;
      let resumeTween: gsap.core.Tween | null = null;
      let resumeTimeout: ReturnType<typeof setTimeout> | null = null;
      let hoverTween: gsap.core.Tween | null = null;

      // Base cruise speed: -50% in 28 seconds => ~-1.785% per second
      const BASE_CRUISE_SPEED = -50 / 28;
      let currentSpeed = BASE_CRUISE_SPEED;
      let hoverMultiplier = 1;
      let isAutoScrolling = true;

      const updatePosition = (pct: number) => {
        currentXPercent = wrap(pct);
        gsap.set(track, { xPercent: currentXPercent });
      };

      const stopAllMotion = () => {
        isAutoScrolling = false;
        if (resumeTimeout) {
          clearTimeout(resumeTimeout);
          resumeTimeout = null;
        }
        if (momentumTween) {
          momentumTween.kill();
          momentumTween = null;
        }
        if (resumeTween) {
          resumeTween.kill();
          resumeTween = null;
        }
      };

      const scheduleAutoResume = () => {
        if (resumeTimeout) clearTimeout(resumeTimeout);
        // Dwell in stopped position for 1.2s so user can view where they scrolled to
        resumeTimeout = setTimeout(() => {
          currentSpeed = 0;
          isAutoScrolling = true;
          // Smoothly accelerate speed back to cruise speed over 1.2s
          const speedObj = { speed: 0 };
          resumeTween = gsap.to(speedObj, {
            speed: BASE_CRUISE_SPEED,
            duration: 1.2,
            ease: "power2.inOut",
            onUpdate: () => {
              currentSpeed = speedObj.speed;
            },
            onComplete: () => {
              resumeTween = null;
            },
          });
        }, 1200);
      };

      // Off-screen: stop writing transforms every frame.
      let isOnScreen = true;
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        isOnScreen = entry.isIntersecting;
      });
      visibilityObserver.observe(track);

      const tickerCallback = (_time: number, deltaTime: number) => {
        if (isDragging || !isAutoScrolling || !isOnScreen) return;
        const dt = deltaTime / 1000;
        updatePosition(currentXPercent + currentSpeed * hoverMultiplier * dt);
      };

      gsap.ticker.add(tickerCallback);

      // Desktop Hover slowdown (only on mouse pointer, never on touch tap)
      const container = track.parentElement;
      const onPointerEnter = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        hoverTween?.kill();
        const obj = { mult: hoverMultiplier };
        hoverTween = gsap.to(obj, {
          mult: 0.25,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => {
            hoverMultiplier = obj.mult;
          },
        });
      };

      const onPointerLeave = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        hoverTween?.kill();
        const obj = { mult: hoverMultiplier };
        hoverTween = gsap.to(obj, {
          mult: 1,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => {
            hoverMultiplier = obj.mult;
          },
        });
      };

      container?.addEventListener("pointerenter", onPointerEnter);
      container?.addEventListener("pointerleave", onPointerLeave);

      // Touch & Pointer drag handlers (active on Mobile, Tab, and Desktop)
      const onPointerDown = (e: PointerEvent) => {
        stopAllMotion();
        isDragging = true;
        isGesturing = false;
        startX = e.clientX;
        startY = e.clientY;
        lastX = e.clientX;
        lastTime = performance.now();
        velocityX = 0;
        try {
          track.setPointerCapture(e.pointerId);
        } catch {}
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // Check if user is scrolling vertically vs swiping the strip
        if (!isGesturing) {
          if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
            // Vertical scroll intent: release capture and don't hijack scroll
            isDragging = false;
            try {
              track.releasePointerCapture(e.pointerId);
            } catch {}
            scheduleAutoResume();
            return;
          }
          if (Math.abs(dx) > 6) {
            isGesturing = true;
            lastX = e.clientX;
            lastTime = performance.now();
          }
        }

        if (isGesturing) {
          const now = performance.now();
          const dt = Math.max(now - lastTime, 8);
          const stepDx = e.clientX - lastX;
          // Smooth velocity calculation (px / ms)
          velocityX = 0.65 * (stepDx / dt) + 0.35 * velocityX;
          lastX = e.clientX;
          lastTime = now;

          const trackWidth = track.offsetWidth || 1;
          const deltaPercent = (stepDx / trackWidth) * 100;
          updatePosition(currentXPercent + deltaPercent);
        }
      };

      const onPointerEnd = (e: PointerEvent) => {
        if (!isDragging && !isGesturing) return;
        isDragging = false;
        try {
          track.releasePointerCapture(e.pointerId);
        } catch {}

        if (!isGesturing) {
          scheduleAutoResume();
          return;
        }

        // A finger that paused before lifting has no speed left to carry.
        if (performance.now() - lastTime > GESTURE.stalePauseMs) velocityX = 0;

        // If flicked with velocity, apply decelerating momentum
        const trackWidth = track.offsetWidth || 1;
        const velocityPercentPerSec = ((velocityX * 1000) / trackWidth) * 100;

        if (Math.abs(velocityPercentPerSec) > 3) {
          const coastDistance = gsap.utils.clamp(-35, 35, velocityPercentPerSec * 0.45);
          const coastDuration = gsap.utils.clamp(0.6, 1.3, Math.abs(coastDistance) / 20 + 0.45);
          const state = { pct: currentXPercent };

          momentumTween = gsap.to(state, {
            pct: currentXPercent + coastDistance,
            duration: coastDuration,
            ease: "power2.out",
            onUpdate: () => {
              updatePosition(state.pct);
            },
            onComplete: () => {
              momentumTween = null;
              scheduleAutoResume();
            },
          });
        } else {
          scheduleAutoResume();
        }
      };

      track.addEventListener("pointerdown", onPointerDown);
      track.addEventListener("pointermove", onPointerMove);
      track.addEventListener("pointerup", onPointerEnd);
      track.addEventListener("pointercancel", onPointerEnd);

      return () => {
        stopAllMotion();
        hoverTween?.kill();
        visibilityObserver.disconnect();
        gsap.ticker.remove(tickerCallback);
        container?.removeEventListener("pointerenter", onPointerEnter);
        container?.removeEventListener("pointerleave", onPointerLeave);
        track.removeEventListener("pointerdown", onPointerDown);
        track.removeEventListener("pointermove", onPointerMove);
        track.removeEventListener("pointerup", onPointerEnd);
        track.removeEventListener("pointercancel", onPointerEnd);
      };
    },
    { scope: rootRef, dependencies: [sensingStripImages.join("|")] }
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
      const gap = parseFloat(getComputedStyle(container).columnGap) || 20;
      const room = total - gap * 2;
      const base = room / 3;
      const hashes = ["workshops", "awards", "residencies"];
      const els = hashes.map((hash) => programmesThumbEls.current[hash]);
      if (els.some((el) => !el)) return;

      const from = els.map((el) => el!.getBoundingClientRect().width);
      const to = hashes.map((hash) => {
        const isHovered = programmesHover === hash;
        const isDimmed = programmesHover !== null && !isHovered;
        return isHovered ? base + 120 : isDimmed ? base - 60 : base;
      });

      // All three widths come from one shared progress value, and the two edges between the
      // pictures land on whole pixels. Tweening each width on its own let their fractions
      // drift apart, so a picture that should stay still wobbled by a fraction of a pixel
      // every frame — the "shivering".
      const apply = (p: number) => {
        const w = from.map((f, i) => f + (to[i] - f) * p);
        const e1 = Math.round(w[0]);
        const e2 = Math.round(w[0] + w[1]);
        const widths = [e1, e2 - e1, room - e2];
        els.forEach((el, i) => {
          el!.style.flex = `0 0 ${widths[i]}px`;
        });
      };
      const settle = () => {
        if (programmesHover === null) els.forEach((el) => (el!.style.flex = ""));
      };

      programmesTweenRef.current?.kill();
      if (prefersReducedMotion()) {
        apply(1);
        settle();
        return;
      }
      const proxy = { p: 0 };
      programmesTweenRef.current = gsap.to(proxy, {
        p: 1,
        duration: DUR.page,
        ease: EASE.enterSoft,
        onUpdate: () => apply(proxy.p),
        onComplete: settle,
      });
    },
    { dependencies: [programmesHover], scope: programmesThumbsRef }
  );

  useGSAP(
    () => {
      const cleanups: (() => void)[] = [];

      withMotionPreference({
        animate: () => {
          // 1. Edition Intro (#editions)
          const edition = document.querySelector<HTMLElement>(".home-edition");
          if (edition) {
            const tl = gsap.timeline({
              scrollTrigger: { trigger: edition, start: HOME_REVEAL.start, once: true },
            });
            const label = edition.querySelector(".fig-label");
            // A large title has its own masked reveal; a second fade would make it flicker.
            if (label && !label.matches(".fig-heading")) {
              tl.fromTo(
                label,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0.08
              );
            }
            // Dense text paragraphs: Option 2 Editorial Waterfall scroll reveal
            const bodies = edition.querySelectorAll(".home-edition__body > .fig-body");
            if (bodies.length > 0) {
              cleanups.push(
                splitLinesOnScroll(bodies, { trigger: edition, ...HOME_REVEAL.lines() })
              );
            }
            const btn = edition.querySelector(".home-text-btn");
            if (btn) {
              tl.fromTo(
                btn,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0.32
              );
            }
          }

          // 2. Sensing Grounds (.home-sensing)
          const sensing = document.querySelector<HTMLElement>(".home-sensing");
          if (sensing) {
            const tl = gsap.timeline({
              scrollTrigger: { trigger: sensing, start: HOME_REVEAL.start, once: true },
            });
            const links = sensing.querySelectorAll(".home-sensing__links .fig-subheading");
            if (links.length > 0) {
              tl.fromTo(
                links,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, stagger: HOME_REVEAL.stagger, ease: EASE.reveal },
                0.08
              );
            }
            const scroll = sensing.querySelector(".home-sensing__scroll");
            if (scroll) {
              tl.fromTo(
                scroll,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0.18
              );
            }
            const cta = sensing.querySelector(".home-sensing__cta");
            if (cta) {
              tl.fromTo(
                cta,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0.28
              );
            }
          }

          // 3. Upcoming Programmes (.home-programmes)
          const programmes = document.querySelector<HTMLElement>(".home-programmes");
          if (programmes) {
            const tl = gsap.timeline({
              scrollTrigger: { trigger: programmes, start: HOME_REVEAL.start, once: true },
            });
            const topLabel = programmes.querySelector(".home-programmes__top .fig-label");
            if (topLabel) {
              tl.fromTo(
                topLabel,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0.08
              );
            }
            const banner = programmes.querySelector(".home-programmes__banner");
            if (banner) {
              tl.fromTo(
                banner,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0.16
              );
            }
            const railLinks = programmes.querySelectorAll(".home-programmes__rail .fig-subheading");
            if (railLinks.length > 0) {
              tl.fromTo(
                railLinks,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, stagger: HOME_REVEAL.stagger, ease: EASE.reveal },
                0.2
              );
            }
            const thumbs = programmes.querySelectorAll(".home-programmes__thumbs a");
            if (thumbs.length > 0) {
              tl.fromTo(
                thumbs,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, stagger: HOME_REVEAL.stagger, ease: EASE.reveal },
                0.24
              );
            }
            const mobileCards = programmes.querySelectorAll(".home-programmes__mobile-card");
            if (mobileCards.length > 0) {
              tl.fromTo(
                mobileCards,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, stagger: HOME_REVEAL.stagger, ease: EASE.reveal },
                0.22
              );
            }
          }

          // 4. Press (.home-press)
          const press = document.querySelector<HTMLElement>(".home-press");
          if (press) {
            const tl = gsap.timeline({
              scrollTrigger: { trigger: press, start: HOME_REVEAL.start, once: true },
            });
            const pressLabel = press.querySelector(".fig-label");
            if (pressLabel) {
              tl.fromTo(
                pressLabel,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0.08
              );
            }
            const pressItemsEls = press.querySelectorAll(".home-press__item");
            if (pressItemsEls.length > 0) {
              tl.fromTo(
                pressItemsEls,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, stagger: HOME_REVEAL.stagger, ease: EASE.reveal },
                0.16
              );
            }
            const pressMore = press.querySelector(".home-press__more");
            if (pressMore) {
              tl.fromTo(
                pressMore,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0.26
              );
            }
          }

          // 5. About Us (.home-about) — Smooth scroll reveals with pure opacity (NO position jump)
          const about = document.querySelector<HTMLElement>(".home-about");
          if (about) {
            // Intro ("ABOUT US")
            const introLabel = about.querySelector(".home-about__intro .fig-label");
            if (introLabel) {
              const tlAbout = gsap.timeline({
                scrollTrigger: { trigger: about, start: HOME_REVEAL.start, once: true },
              });
              tlAbout.fromTo(
                introLabel,
                { autoAlpha: 0, y: DISTANCE.rise },
                { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                0
              );
            }

            // KBF Block
            const kbfBlock = about.querySelector<HTMLElement>("#about-kbf");
            if (kbfBlock) {
              const tlKbf = gsap.timeline({
                scrollTrigger: { trigger: kbfBlock, start: HOME_REVEAL.start, once: true },
              });
              const kbfLogo = kbfBlock.querySelector(".home-about__logo-wrap");
              if (kbfLogo) {
                tlKbf.fromTo(
                  kbfLogo,
                  { autoAlpha: 0, y: DISTANCE.rise },
                  { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                  0
                );
              }
              const kbfP = kbfBlock.querySelectorAll("p");
              if (kbfP.length > 0) {
                cleanups.push(
                  splitLinesOnScroll(kbfP, { trigger: kbfBlock, ...HOME_REVEAL.lines() })
                );
              }
            }

            // Students' Biennale Block
            const sbBlock = about.querySelector<HTMLElement>("#about-sb");
            if (sbBlock) {
              const tlSb = gsap.timeline({
                scrollTrigger: { trigger: sbBlock, start: HOME_REVEAL.start, once: true },
              });
              const sbLogo = sbBlock.querySelector(".home-about__logo-wrap");
              if (sbLogo) {
                tlSb.fromTo(
                  sbLogo,
                  { autoAlpha: 0, y: DISTANCE.rise },
                  { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                  0
                );
              }
              const sbPs = sbBlock.querySelectorAll(".home-about__sb-copy p");
              if (sbPs.length > 0) {
                cleanups.push(
                  splitLinesOnScroll(sbPs, { trigger: sbBlock, ...HOME_REVEAL.lines() })
                );
              }
            }

            // Team Grid
            const team = about.querySelector<HTMLElement>("#about-team");
            if (team) {
              const tlTeam = gsap.timeline({
                scrollTrigger: { trigger: team, start: HOME_REVEAL.start, once: true },
              });
              const teamLabel = team.querySelector(".fig-label");
              if (teamLabel) {
                tlTeam.fromTo(
                  teamLabel,
                  { autoAlpha: 0, y: DISTANCE.rise },
                  { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                  0
                );
              }
              const teamCols = team.querySelectorAll(".home-about__team-cols > div");
              if (teamCols.length > 0) {
                tlTeam.fromTo(
                  teamCols,
                  { autoAlpha: 0, y: DISTANCE.rise },
                  { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, stagger: HOME_REVEAL.stagger, ease: EASE.reveal },
                  0.1
                );
              }
            }

            // Sponsors Wall
            const sponsors = about.querySelector<HTMLElement>("#about-sponsors");
            if (sponsors) {
              const tlSponsors = gsap.timeline({
                scrollTrigger: { trigger: sponsors, start: HOME_REVEAL.start, once: true },
              });
              const sponsorsLabel = sponsors.querySelector(".fig-label");
              if (sponsorsLabel) {
                tlSponsors.fromTo(
                  sponsorsLabel,
                  { autoAlpha: 0, y: DISTANCE.rise },
                  { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, ease: EASE.reveal },
                  0
                );
              }
              const sponsorItems = sponsors.querySelectorAll(".home-about__sponsor-primary, .home-about__sponsor-group");
              if (sponsorItems.length > 0) {
                tlSponsors.fromTo(
                  sponsorItems,
                  { autoAlpha: 0, y: DISTANCE.rise },
                  { autoAlpha: 1, y: 0, clearProps: "transform", duration: HOME_REVEAL.duration, stagger: HOME_REVEAL.stagger, ease: EASE.reveal },
                  0.1
                );
              }
            }
          }
        },
        onReduce: () => {
          gsap.set(
            ".home-section, .fig-label, .home-edition__body .fig-body, .home-text-btn, .home-sensing__scroll, .home-programmes__banner, .home-about__logo-wrap, .home-about__sb-copy p, #about-kbf p, .home-about__team-cols > div, .home-about__sponsor-primary, .home-about__sponsor-group",
            { autoAlpha: 1, x: 0, y: 0, scale: 1 }
          );
        },
      });

      return () => {
        cleanups.forEach((c) => c());
      };
    },
    {
      scope: rootRef,
      dependencies: [pressItems.length, homeBannerUrl, sensingStripImages.length],
      revertOnUpdate: true,
    }
  );

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || dynamicCovers.length === 0) return;
      // Defer hero entrance until immersive splash finishes (first home visit only).
      // Use opacity (not autoAlpha) so visibility stays visible — browsers may defer
      // decode of visibility:hidden images, which caused post-splash hero lag.
      // Pre-set the parallax start scale (1.12) under the splash so handoff does not
      // jump from scale 1 → 1.12 when ScrollTrigger arms (DESKTOP ONLY).
      // Mobile is strictly locked to scale 1 without any transforms.
      const isDesktop = typeof window !== "undefined" && window.innerWidth > 899;
      if (splashWillShow && !splashCompleted) {
        if (isDesktop) {
          gsap.set(".home-hero__slides", { scale: 1.12, transformOrigin: "center center" });
        } else {
          gsap.set(".home-hero__slides", { scale: 1, clearProps: "transform" });
        }
        gsap.set(".home-hero__slide", { opacity: 0, visibility: "visible" });
        gsap.set(
          ".home-hero__card, .home-hero__credit p, .home-hero .carousel-dots, .home-hero .carousel-nav-arrow",
          { autoAlpha: 0 },
        );
        return;
      }

      let cleanupHero: (() => void) | undefined;

      withMotionPreference({
        animate: () => {
          // Keep the splash handoff scale continuous — never snap 1 → 1.12 on reveal (desktop only).
          if (isDesktop) {
            if (splashWillShow) {
              gsap.set(".home-hero__slides", { scale: 1.12, transformOrigin: "center center" });
            }
          } else {
            gsap.set(".home-hero__slides", { scale: 1, clearProps: "transform" });
          }

          // 1. Initial Hero Background & Content Entrance Choreography
          const heroTl = gsap.timeline({
            defaults: { ease: EASE.enterSoft },
          });

          heroTl
            .fromTo(
              ".home-hero__slide:first-child",
              {
                opacity: 1,
                visibility: "visible",
              },
              {
                opacity: 1,
                visibility: "visible",
                duration: 0.01,
                ease: "none",
              },
              0
            )
            .fromTo(
              ".home-hero__card",
              { autoAlpha: 0, y: DISTANCE.md },
              {
                autoAlpha: 1,
                y: 0,
                stagger: HOME_REVEAL.stagger * 2,
                duration: HOME_REVEAL.duration,
                ease: EASE.reveal,
                clearProps: "transform",
              },
              0.1
            )
            .fromTo(
              ".home-hero__credit p, .home-hero__mobile-meta",
              { autoAlpha: 0, y: 14 },
              { autoAlpha: 1, y: 0, duration: HOME_REVEAL.duration, stagger: HOME_REVEAL.stagger * 2, ease: EASE.reveal },
              0.16
            )
            .fromTo(
              ".home-hero .carousel-dots, .home-hero .carousel-nav-arrow",
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: HOME_REVEAL.duration, ease: EASE.reveal },
              0.26
            );

          // 2. Setup Slideshow Auto-Slide Timeline
          const slides = gsap.utils.toArray<HTMLElement>(".home-hero__slide");
          slidesRef.current = slides;
          if (slides.length) {
            slideIndexRef.current = 0;
            buildAutoSlideTimeline(
              slides,
              0,
              (index) => {
                slideIndexRef.current = index;
                setSlide(index);
              },
              heroTlRef
            );
            const hero = root.querySelector<HTMLElement>(".home-hero");
            const onPointerEnter = (e: Event) => {
              if ((e as PointerEvent).pointerType && (e as PointerEvent).pointerType !== "mouse") return;
              if (heroAutoResumeTimerRef.current) {
                clearTimeout(heroAutoResumeTimerRef.current);
                heroAutoResumeTimerRef.current = null;
              }
              heroTlRef.current?.pause();
            };
            const onPointerLeave = (e: Event) => {
              if ((e as PointerEvent).pointerType && (e as PointerEvent).pointerType !== "mouse") return;
              buildAutoSlideTimeline(
                slidesRef.current,
                slideIndexRef.current,
                (index) => {
                  slideIndexRef.current = index;
                  setSlide(index);
                },
                heroTlRef
              );
            };
            hero?.addEventListener("pointerenter", onPointerEnter as EventListener);
            hero?.addEventListener("pointerleave", onPointerLeave as EventListener);
            hero?.addEventListener("focusin", onPointerEnter as EventListener);
            hero?.addEventListener("focusout", onPointerLeave as EventListener);
            cleanupHero = () => {
              if (heroAutoResumeTimerRef.current) {
                clearTimeout(heroAutoResumeTimerRef.current);
                heroAutoResumeTimerRef.current = null;
              }
              heroTl.kill();
              heroTlRef.current?.kill();
              heroTlRef.current = null;
              hero?.removeEventListener("pointerenter", onPointerEnter as EventListener);
              hero?.removeEventListener("pointerleave", onPointerLeave as EventListener);
              hero?.removeEventListener("focusin", onPointerEnter as EventListener);
              hero?.removeEventListener("focusout", onPointerLeave as EventListener);
            };
          }

          // 3. Scroll-linked Parallax:
          // Hero slide image slowly zooms out as user scrolls (cinematic reverse-zoom depth)
          const mm = gsap.matchMedia(root);

          // Desktop (> 899px): Parallax hero slides scale, cards, and left-side credits separately
          mm.add("(min-width: 900px)", () => {
            gsap.fromTo(
              ".home-hero__slides",
              { scale: 1.12 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: root,
                  start: "top top",
                  end: "600px top",
                  scrub: 0.3,
                  invalidateOnRefresh: true,
                },
              }
            );

            gsap.to(".home-hero__stack", {
              y: -220,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: "550px top",
                scrub: 0.25,
                invalidateOnRefresh: true,
              },
            });

            gsap.to(".home-hero__meta", {
              y: -100,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: "550px top",
                scrub: 0.25,
                invalidateOnRefresh: true,
              },
            });
          });

          // Mobile (<= 899px): Locked parallax on the entire unified group (text + cards), rock-solid scale:1 for slides
          mm.add("(max-width: 899px)", () => {
            gsap.set(".home-hero__slides", { scale: 1, clearProps: "transform" });
            gsap.to(".home-hero__mobile-group", {
              y: -220,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: "550px top",
                scrub: 0.25,
                invalidateOnRefresh: true,
              },
            });
          });
        },
        onReduce: () => {
          gsap.set(".home-hero__card", { autoAlpha: 1, clearProps: "transform,rotation" });
          gsap.set(".home-hero__stack, .home-hero__meta, .home-hero__mobile-group", { y: 0 });
          gsap.set(".home-hero__slides", { scale: 1 });
          gsap.set(".home-hero__credit p, .home-hero .carousel-dots, .home-hero .carousel-nav-arrow", {
            autoAlpha: 1,
            y: 0,
          });
          gsap.set(".home-hero__slide", { opacity: 0, visibility: "visible", scale: 1 });
          gsap.set(".home-hero__slide:first-child", { opacity: 1 });
        },
      });

      return () => cleanupHero?.();
    },
    {
      scope: rootRef,
      dependencies: [dynamicCovers.length, cmsCards.length, splashWillShow, splashCompleted],
      revertOnUpdate: true,
    }
  );

  // Update cards can be dragged or flicked away on every device.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    return bindSwipeAway(hero, {
      selector: ".home-hero__card",
      ignore: ".home-hero__card-close",
      onDragChange: (dragging) => {
        cardDraggingRef.current = dragging;
      },
      onDismiss: (card) => {
        const id = card.dataset.cardId;
        if (id) setDismissedCardIds((prev) => [...prev, id]);
      },
    });
  }, []);

  // Drag, flick or trackpad swipe between slides on every device.
  useSlideGesture(
    heroRef,
    {
      count: covers.length,
      getIndex: () => slideIndexRef.current,
      getSlides: () => {
        const slides = Array.from(
          heroRef.current?.querySelectorAll<HTMLElement>(".home-hero__slide") ?? [],
        );
        slidesRef.current = slides;
        return slides;
      },
      ignore: ".home-hero__card, .home-hero__card-close",
      onGrab: () => {
        if (heroAutoResumeTimerRef.current) {
          clearTimeout(heroAutoResumeTimerRef.current);
          heroAutoResumeTimerRef.current = null;
        }
        heroTlRef.current?.kill();
        heroTlRef.current = null;
      },
      onTargetChange: setSlide,
      onCommit: goToSlide,
      onSettle: resumeHeroTimeline,
    },
    covers.length > 1,
  );

  return (
    <div ref={rootRef} className="home" data-node-id="6:1016">
      {/* Hero — full viewport width; overlays on 12-col (60 / 20) */}
      <section
        ref={heroRef}
        className="home-hero"
        aria-label="Hero"
      >
        <div
          className="home-hero__slides"
          aria-hidden
        >
          {covers.map((c, index) => (
            <img
              key={c.id}
              className="home-hero__slide home-hero__bg"
              src={c.image_url}
              alt={c.artwork_name ?? ""}
              loading="eager"
              decoding="async"
              fetchPriority={index === 0 ? "high" : "low"}
            />
          ))}
        </div>

        {covers.length > 1 ? (
          <CarouselNavArrows
            slideSrc={currentCover.image_url}
            onPrev={() => goToSlide((slide - 1 + covers.length) % covers.length)}
            onNext={() => goToSlide((slide + 1) % covers.length)}
          />
        ) : null}

        {/* Overlay sits on the page grid */}
        <div className="home-hero__grid">
          {/* Mobile group contains unified credit text + cards stack */}
          <div className="home-hero__mobile-group">
            <div
              className="home-hero__mobile-meta"
              onClick={() => {
                if (mobileCardsExpanded) {
                  setMobileCardsExpanded(false);
                }
              }}
            >
              <div ref={mobileCreditRef} className="home-hero__mobile-credit">
                {creditArtwork ? (
                  <span className="home-hero__mobile-artwork">{creditArtwork}</span>
                ) : null}
                {creditArtist ? (
                  <span className="home-hero__mobile-artist">{creditArtist}</span>
                ) : null}
              </div>
            </div>

            {(() => {
              const visibleCards = cards.filter((c) => !dismissedCardIds.includes(c.id));
              if (visibleCards.length === 0) return null;
              return (
                <>
                  {mobileCardsExpanded ? (
                    <div
                      className="home-hero__stack-backdrop"
                      aria-hidden="true"
                      onClick={() => setMobileCardsExpanded(false)}
                    />
                  ) : null}
                  <div
                    className={`home-hero__stack fig-span3-plus-gutter${mobileCardsExpanded ? " is-mobile-expanded" : ""}`}
                    data-node-id="17:309"
                    data-count={visibleCards.length}
                    data-expanded={mobileCardsExpanded}
                    tabIndex={0}
                    aria-label="Edition updates. Tap to expand or collapse."
                    onClick={() => {
                      if (!mobileCardsExpanded) {
                        setMobileCardsExpanded(true);
                      }
                    }}
                  >
                  {visibleCards.map((item, i, arr) => (
                    <article
                      key={item.id}
                      className="home-hero__card home-hero__card--interactive"
                      data-card-id={item.id}
                      style={{ zIndex: arr.length - i }}
                      data-offset={i}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.heading}. Open update.`}
                      onClick={(e) => {
                        const isTouchOrTablet =
                          typeof window !== "undefined" &&
                          (window.innerWidth <= 1024 ||
                            window.matchMedia("(hover: none), (pointer: coarse)").matches);

                        if (isTouchOrTablet) {
                          e.stopPropagation();
                          if (!mobileCardsExpanded) {
                            setMobileCardsExpanded(true);
                          } else {
                            openCard(item);
                          }
                        } else {
                          openCard(item);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          const isTouchOrTablet =
                            typeof window !== "undefined" &&
                            (window.innerWidth <= 1024 ||
                              window.matchMedia("(hover: none), (pointer: coarse)").matches);

                          if (isTouchOrTablet) {
                            if (!mobileCardsExpanded) {
                              setMobileCardsExpanded(true);
                            } else {
                              openCard(item);
                            }
                          } else {
                            openCard(item);
                          }
                        } else {
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
                          const cardEl = e.currentTarget.closest<HTMLElement>(".home-hero__card");
                          const dismiss = () => setDismissedCardIds((prev) => [...prev, item.id]);
                          if (!cardEl || prefersReducedMotion()) {
                            dismiss();
                            return;
                          }
                          gsap.to(cardEl, {
                            autoAlpha: 0,
                            y: -DISTANCE.sm,
                            duration: EXIT.duration,
                            ease: EXIT.ease,
                            clearProps: "opacity,visibility,transform",
                            onComplete: dismiss,
                          });
                        }}
                      >
                        ✕
                      </button>
                      <div className="home-hero__card-inner">
                        {item.imageUrl ? (
                          <div className="home-hero__card-thumb">
                            <img src={item.imageUrl} alt="" width={44} height={44} />
                          </div>
                        ) : (
                          <div className="home-hero__card-thumb home-hero__card-thumb--mark">
                            <img src="/logo-sb-mark.svg" alt="" width={24} height={24} />
                          </div>
                        )}
                        <div className="home-hero__card-text">
                          <h2 className="home-hero__card-title">{item.heading}</h2>
                          <p className="home-hero__card-body">{item.body}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="home-hero__meta">
            {showCredits ? (
              <div ref={creditRef} className="home-hero__credit">
                {showArtwork ? <p className="home-hero__artwork">{creditArtwork}</p> : null}
                {showArtist ? <p className="home-hero__artist">{creditArtist}</p> : null}
                {showInstitution ? <p className="home-hero__inst">{creditInst}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="home-hero__dots home-hero__dots--centered carousel-dots"
          data-tone={dotsTone}
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

      <div className="home__main">
        {/* Edition intro & Sensing Grounds */}
        <section id="editions" className="home-edition-wrap">
          <div className="home-section home-edition">
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
          </div>

          {/* Sensing Grounds — links cols 1–3, image strip cols 4–12 */}
          <div className="home-section home-sensing" data-no-parallax="true">
            <div className="fig-grid home-sensing__row" data-no-parallax="true">
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
              <div className="home-sensing__scroll fig-c4-12" data-no-parallax="true">
                {sensingStripImages.length > 0 ? (
                  <div ref={sensingTrackRef} className="home-sensing__scroll-track" data-no-parallax="true">
                    {[...sensingStripImages, ...sensingStripImages].map((src, i) => (
                      <div className="home-sensing__scroll-item" key={`${src}-${i}`} data-no-parallax="true">
                        <img src={src} alt="" data-no-parallax="true" draggable={false} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="fig-grid home-sensing__cta">
              <CtaLink
                className="fig-cta-end"
                to={`/editions/${yearId}/curators`}
                lines={["EXPLORE", "EDITION"]}
              />
            </div>
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
              {sensingModalCol1.map((p) => (
                <p key={p.slice(0, 48)} className="fig-body">
                  {p}
                </p>
              ))}
            </div>
            <div className="spotlight__column">
              {sensingModalCol2.map((p) => (
                <p key={p.slice(0, 48)} className="fig-body">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </SpotlightModal>

        <UpdateCardSpotlight
          card={activeCard}
          onClose={() => {
            setActiveCard(null);
            setMobileCardsExpanded(false);
          }}
          onConfirmNavigate={(card) => {
            setMobileCardsExpanded(false);
            confirmCardNavigate(card);
          }}
        />

        {/* Upcoming programmes */}
        <section id="programmes" className="home-section home-programmes">
          <div className="fig-grid home-programmes__top">
            <h2 className="fig-label fig-heading">PROGRAMMES</h2>
            <div className="home-programmes__banner fig-c4-12" data-no-parallax="true">
              {homeBannerUrl ? (
                <img
                  src={homeBannerUrl}
                  alt=""
                  data-no-parallax="true"
                />
              ) : null}
            </div>
          </div>
          <div className="fig-grid home-programmes__bottom">
            <div className="home-programmes__rail fig-rail">
              {(
                [
                  { label: "WORKSHOPS", hash: "workshops", to: "/programmes" },
                  { label: "AWARDS", hash: "awards", to: "/programmes#awards" },
                  { label: "RESIDENCIES", hash: "residencies", to: "/programmes#residencies" },
                ] as const
              ).map((tab) => (
                <Link
                  key={tab.hash}
                  to={tab.to}
                  className={`fig-subheading${programmesHover === tab.hash ? " is-selected" : ""}`}
                  onMouseEnter={() => labelHoverIn(tab.hash)}
                  onMouseLeave={labelHoverOut}
                >
                  {tab.label}
                  <span className="fig-subheading__underline" aria-hidden />
                </Link>
              ))}
            </div>
            <div ref={programmesThumbsRef} className="home-programmes__thumbs fig-c4-12">
              {[
                { hash: "workshops", to: "/programmes", img: workshopThumb },
                { hash: "awards", to: "/programmes#awards", img: awardsThumb },
                { hash: "residencies", to: "/programmes#residencies", img: residencyThumb },
              ].map((tab) => (
                <Link
                  key={tab.hash}
                  ref={(el) => {
                    programmesThumbEls.current[tab.hash] = el;
                  }}
                  to={tab.to}
                  onMouseEnter={() => thumbHover(tab.hash)}
                  onMouseLeave={() => thumbHover(null)}
                >
                  {tab.img ? (
                    <img src={tab.img} alt="" />
                  ) : (
                    <span className="home-programmes__thumb-placeholder" aria-hidden />
                  )}
                </Link>
              ))}
            </div>
          </div>
          {/* Mobile programmes cards stack (Figma node 109:4) */}
          <div className="fig-grid home-programmes__mobile-list">
            {[
              { label: "WORKSHOPS", to: "/programmes", img: workshopThumb },
              { label: "AWARDS", to: "/programmes#awards", img: awardsThumb },
              { label: "RESIDENCIES", to: "/programmes#residencies", img: residencyThumb },
            ].map((prog) => (
              <Link key={prog.label} to={prog.to} className="home-programmes__mobile-card">
                <div className="home-programmes__mobile-card-img">
                  {prog.img ? (
                    <img src={prog.img} alt={prog.label} />
                  ) : (
                    <span className="home-programmes__thumb-placeholder" aria-hidden />
                  )}
                </div>
                <div className="home-programmes__mobile-card-label">{prog.label}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Press */}
        <section id="press" className="home-section home-press">
          <div className="fig-grid">
            <h2 className="fig-label fig-heading">PRESS</h2>
            <div ref={pressListRef} className="home-press__items fig-c4-12">
              {pressItems.map((item) => {
                const isExpanded = activePressId === item.id;
                return (
                  <article
                    key={item.id}
                    data-id={item.id}
                    className={`home-press__item${isExpanded ? " is-expanded" : ""}`}
                    onPointerMove={(e) => pressHover.onRowPointerMove(e, item.id, isExpanded)}
                    onPointerLeave={() => pressHover.onRowPointerLeave(item.id)}
                  >
                    <button
                      type="button"
                      className="home-press__header"
                      aria-expanded={isExpanded}
                      onMouseDown={(e) => e.preventDefault()}
                      onKeyDown={onAccordionKeyDown}
                      onClick={(e) => {
                      pressHover.onRowClick(item.id);
                      // Hover expands; a click opens the full article (touch: first tap expands).
                      if (rowClickOpensArticle(e, isExpanded)) navigate(`/press?article=${item.id}`);
                      else setOpenPressId(item.id);
                    }}
                    >
                      <span className="home-press__title">{item.title}</span>
                      <time className="home-press__date">{item.date}</time>
                    </button>

                    <div className="home-press__drawer-wrap" aria-hidden={!isExpanded}>
                      <div className="home-press__drawer-inner">
                        <div className="home-press__drawer-content">
                          {item.image ? (
                            <Link
                              to={`/press?article=${item.id}`}
                              className="home-press__drawer-media"
                              tabIndex={isExpanded ? 0 : -1}
                              aria-label={`Read ${item.title}`}
                            >
                              <img
                                className="home-press__drawer-img"
                                src={item.image}
                                alt=""
                                loading="lazy"
                              />
                            </Link>
                          ) : null}
                          <div className="home-press__drawer-copy">
                            <p className="fig-body">
                              {item.body
                                ? item.body.split(/\n\s*\n/).map((p) => p.trim()).find(Boolean) || item.excerpt
                                : item.excerpt}
                            </p>
                            <Link
                              to={`/press?article=${item.id}`}
                              className="home-text-btn home-press__read-btn"
                              tabIndex={isExpanded ? 0 : -1}
                            >
                              Read article...
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <CtaLink
              className="fig-cta-end home-press__more"
              to="/press"
              lines={["VIEW", "MORE"]}
              direction="right"
            />
          </div>
        </section>

        {/* About */}
        <section id="about" className="home-section home-about">
          <div className="fig-grid home-about__intro">
            <h2 className="fig-label fig-heading">ABOUT US</h2>
          </div>
          <div id="about-kbf" className="fig-grid home-about__block">
            <div className="home-about__logo-wrap fig-c1-3">
              <img
                className="home-about__logo-kbf"
                src="/home/logo-kbf-about.svg"
                alt="Kochi Biennale Foundation"
                width={217}
                height={68}
              />
            </div>
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
          <div id="about-sb" className="fig-grid home-about__block">
            <div className="home-about__logo-wrap fig-c1-3">
              <img
                className="home-about__logo-sb"
                src="/home/logo-sb-about.svg"
                alt="Students' Biennale"
                width={212}
                height={102}
              />
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

          <div id="about-team" className="fig-grid home-about__team">
            <h3 className="fig-label fig-label--sub">
              STUDENTS&apos; BIENNALE
              <br />
              2025-26 TEAM
            </h3>
            <div className="home-about__team-cols fig-c4-12 fig-sub-3">
              {aboutTeamCols.map((col, i) => (
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

          <div id="about-sponsors" className="fig-grid home-about__sponsors">
            <h3 className="fig-label fig-label--sub">SPONSORS</h3>
            <div className="fig-c4-12 home-about__sponsors-main">
              {/* Primary Supporter (Tata Trusts) */}
              <div className="home-about__sponsor-primary">
                <h4 className="home-about__sponsor-heading">SUPPORTED BY</h4>
                <div className="home-about__sponsor-logo-wrap">
                  <img
                    className="home-about__sponsor-logo"
                    src="/home/logo-tata-trusts.png"
                    alt="Tata Trusts"
                    width={212}
                    height={21}
                  />
                </div>
                <p className="home-about__sponsor-caption">
                  We are grateful to Tata Trusts for their continued support since 2016.
                </p>
              </div>

              {/* Other Donors & Venue Support — aligned with 3-column Team grid */}
              <div className="home-about__sponsors-grid fig-sub-3">
                <div className="home-about__sponsor-group">
                  <h4 className="home-about__sponsor-heading">OTHER DONORS</h4>
                  <ul className="home-about__sponsor-list">
                    <li>Anant Foundation for the Arts</li>
                    <li>Arthshila</li>
                    <li>Mrinalini Mukherjee Foundation</li>
                    <li>Institut Francais India</li>
                    <li>TARQ</li>
                    <li>Raza Foundation</li>
                  </ul>
                </div>

                <div className="home-about__sponsor-group">
                  <h4 className="home-about__sponsor-heading">VENUE SUPPORT</h4>
                  <ul className="home-about__sponsor-list">
                    <li>Arthshila Kochi</li>
                    <li>David Hall</li>
                    <li>VKL Warehouse</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

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
        onClose={() => setOpenScholarId(null)}
      />
    </div>
  );
}
