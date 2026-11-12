import { useEffect, useLayoutEffect, useRef, useState, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { DUR, EASE, gsap, ScrollTrigger, syncScrollTrigger, useGSAP, prefersReducedMotion } from "../lib/motion";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { SketchLayer } from "./SketchLayer";
import { observeImageSettle } from "../lib/imageMotion";
import { parseHomeHash, parseProgrammeHash, scrollToId } from "../lib/scrollToSection";
import { glideToTop, setLenisInstance } from "../lib/lenisSingleton";
import { observeHeadlines } from "../lib/headlineReveal";
import { useImageParallax } from "../lib/parallax";
import { useSplash } from "../lib/splash";
import { useHomeCms } from "../lib/homeCms";
import { preloadUrl } from "../lib/preloadImages";
import "./Layout.css";

function useHoldUntilHomeHeroReady(pathname: string) {
  const isHome = pathname === "/" || pathname === "";
  const { covers, status } = useHomeCms();
  const first = covers[0]?.image_url?.trim() ?? "";
  const shown = useRef(false);
  const [hold, setHold] = useState(isHome && !shown.current);

  useEffect(() => {
    if (!isHome || shown.current) {
      setHold(false);
      return;
    }

    let cancelled = false;
    // Release safety timeout: never block mobile view for more than 2.5 seconds
    const release = window.setTimeout(() => {
      if (cancelled) return;
      shown.current = true;
      setHold(false);
    }, 2500);

    if (!first) {
      if (status === "ready") {
        shown.current = true;
        setHold(false);
        window.clearTimeout(release);
      }
      return () => {
        cancelled = true;
        window.clearTimeout(release);
      };
    }

    void preloadUrl(first, "high").finally(() => {
      window.clearTimeout(release);
      if (cancelled) return;
      shown.current = true;
      setHold(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(release);
    };
  }, [first, isHome, status]);

  return hold;
}

export function Layout() {
  const location = useLocation();
  const { active: splashActive, willShow: splashWillShow, completed: splashCompleted } =
    useSplash();
  const holdForHero = useHoldUntilHomeHeroReady(location.pathname) && !splashActive;
  const isDiscover = location.pathname === "/artworks";
  const lenisRef = useRef<Lenis | null>(null);
  const prevPathRef = useRef(location.pathname);
  const prevProgrammesPathRef = useRef(location.pathname);
  const prevHomePathRef = useRef(location.pathname);
  const splashFadeSuppressedRef = useRef(false);

  useEffect(() => {
    if (isDiscover) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion(),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.0,
      infinite: false,
    });
    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // Synchronize Lenis with GSAP ticker for locked frame rate
    // Real time, not GSAP's lag-smoothed time: a slow frame must not make scrolling uneven.
    const updateTicker = () => {
      lenis.raf(performance.now());
    };
    gsap.ticker.add(updateTicker);
    // A busy frame, like the first frame of a new page, must not swallow the start of an
    // animation: anything over 100ms counts as one normal frame, so motion never jumps ahead.
    gsap.ticker.lagSmoothing(100, 33);

    const onScroll = () => {
      syncScrollTrigger();
    };
    lenis.on("scroll", onScroll);

    const onSpotlight = (e: Event) => {
      const open = Boolean((e as CustomEvent<{ open: boolean }>).detail?.open);
      if (open) lenis.stop();
      else lenis.start();
    };
    window.addEventListener("spotlight:change", onSpotlight);

    return () => {
      window.removeEventListener("spotlight:change", onSpotlight);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [isDiscover]);

  const mainRef = useRef<HTMLDivElement>(null);
  const prevAnimPathRef = useRef(location.pathname);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !mainRef.current) return;
      const getShellGroup = (path: string) => {
        const match = path.match(/^\/editions\/([^/]+)\/(curators|artworks|artists|venue)\/?$/);
        return match ? match[1] : null;
      };
      const prevGroup = getShellGroup(prevAnimPathRef.current);
      const currGroup = getShellGroup(location.pathname);
      prevAnimPathRef.current = location.pathname;

      if (prevGroup !== null && currGroup !== null && prevGroup === currGroup) {
        // Tab switch within the same Edition shell: keep Left Rail & Search Toolbar static!
        return;
      }

      // Splash → home handoff already reveals the page; skip the competing fade.
      if (splashWillShow && location.pathname === "/") {
        if (!splashCompleted || !splashFadeSuppressedRef.current) {
          gsap.set(mainRef.current, { autoAlpha: 1, y: 0 });
          if (splashCompleted) splashFadeSuppressedRef.current = true;
          return;
        }
      }

      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          // A curator, artwork, artist or venue opened from a card is there at once; a slow page
          // fade on top of its own entrance read as a delay after the tap.
          // An artwork opened from Editions is lighter still: there within a fifth of a second.
          duration: /^\/editions\/[^/]+\/artworks\/[^/]+/.test(location.pathname)
            ? DUR.fast
            : /^\/editions\/[^/]+\/(curators|artists|venue)\/[^/]+/.test(location.pathname)
              ? DUR.base
              : DUR.page,
          ease: EASE.reveal,
          overwrite: "auto",
          clearProps: "opacity,transform",
        }
      );
    },
    {
      dependencies: [location.pathname, splashActive, splashWillShow, splashCompleted],
      scope: mainRef,
    }
  );

  // Large titles rise from behind a mask as they reach the viewport.
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main || isDiscover) return;
    return observeHeadlines(main);
  }, [isDiscover]);

  // Apply parallax to all content images across every page
  useImageParallax(mainRef, [location.pathname, location.key]);

  // Pictures settle gently into their frames as they arrive. Not on Discover, which has its own
  // canvas motion.
  useEffect(() => {
    const main = mainRef.current;
    if (!main || isDiscover) return;
    return observeImageSettle(main);
  }, [isDiscover]);

  // Land at the top of every new page, keyed on location.key (not pathname)
  // so this also fires when navigating to the same path — e.g. clicking the
  // logo while already on "/" still resets scroll. Skipped when the
  // navigation targets a Home or Programmes section hash, since those cases
  // scroll to the section instead, below.
  useEffect(() => {
    if (location.pathname === "/" && parseHomeHash(location.hash)) return;
    if (location.pathname === "/programmes" && parseProgrammeHash(location.hash)) return;
    const samePage = prevPathRef.current === location.pathname;
    prevPathRef.current = location.pathname;

    // Same page, scrolled down (e.g. the logo tapped on Home): glide to the top, then
    // re-measure once at rest. Re-measuring during the glide resets every scroll-linked
    // animation mid-movement and stalls the frame, which shows as the hero shaking.
    if (samePage && lenisRef.current && window.scrollY > 2) {
      let cancelled = false;
      glideToTop({
        reduced: prefersReducedMotion(),
        onComplete: () => {
          if (cancelled) return;
          ScrollTrigger.refresh();
          lenisRef.current?.resize();
        },
      });
      return () => {
        cancelled = true;
      };
    }

    if (samePage && lenisRef.current) {
      lenisRef.current.scrollTo(0);
    } else {
      window.scrollTo(0, 0);
      lenisRef.current?.scrollTo(0, { immediate: true });
    }

    // Keep ScrollTrigger synchronized with reset scroll and recalculated layout
    ScrollTrigger.clearScrollMemory('manual');
    syncScrollTrigger();

    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    // Multi-stage refresh to account for lazy-loaded route chunks mounting on mobile
    const t1 = window.setTimeout(() => {
      ScrollTrigger.refresh();
      lenisRef.current?.resize();
    }, 150);
    const t2 = window.setTimeout(() => {
      ScrollTrigger.refresh();
      lenisRef.current?.resize();
    }, 450);
    const t3 = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 900);

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      }).catch(() => {});
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [location.pathname, location.key]);

  useEffect(() => {
    if (location.pathname !== "/") {
      prevHomePathRef.current = location.pathname;
      return;
    }
    const id = parseHomeHash(location.hash);
    if (!id) return;

    const crossPage = prevHomePathRef.current !== "/";
    prevHomePathRef.current = location.pathname;

    let cancelled = false;
    let attempts = 0;
    const run = () => {
      if (cancelled) return;
      if (scrollToId(id, { crossPage })) return;
      if (++attempts < 10) requestAnimationFrame(run);
    };
    requestAnimationFrame(() => requestAnimationFrame(run));

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (location.pathname !== "/programmes") {
      prevProgrammesPathRef.current = location.pathname;
      return;
    }
    const id = parseProgrammeHash(location.hash);
    if (!id) return;

    const crossPage = prevProgrammesPathRef.current !== "/programmes";
    prevProgrammesPathRef.current = location.pathname;

    if (!crossPage) return;

    let cancelled = false;
    const started = performance.now();
    const run = () => {
      if (cancelled) return;
      if (scrollToId(id, { crossPage })) return;
      // Programmes is lazy-loaded, so the anchor may not exist for the first frames.
      if (performance.now() - started < 2500) requestAnimationFrame(run);
    };
    requestAnimationFrame(() => requestAnimationFrame(run));

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.hash]);

  return (
    <div className={`site-layout${isDiscover ? " site-layout--discover" : ""}`}>
      <Header />
      <div ref={mainRef} className="site-layout__main">
        <Suspense fallback={<div className="route-fallback" aria-hidden="true" />}>
          <Outlet />
        </Suspense>
      </div>
      {isDiscover ? null : <Footer />}
      {isDiscover ? null : <SketchLayer />}
      {holdForHero ? <div className="site-hero-hold" aria-hidden /> : null}
    </div>
  );
}
