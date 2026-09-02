import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { gsap, syncScrollTrigger, useGSAP, prefersReducedMotion } from "../lib/motion";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { parseHomeHash, parseProgrammeHash, scrollToId } from "../lib/scrollToSection";
import { setLenisInstance } from "../lib/lenisSingleton";
import "./Layout.css";

export function Layout() {
  const location = useLocation();
  const isDiscover = location.pathname === "/artworks";
  const lenisRef = useRef<Lenis | null>(null);
  const prevPathRef = useRef(location.pathname);
  const prevProgrammesPathRef = useRef(location.pathname);
  const prevHomePathRef = useRef(location.pathname);

  useEffect(() => {
    if (isDiscover) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // Synchronize Lenis with GSAP ticker for locked frame rate
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

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

  useGSAP(
    () => {
      if (prefersReducedMotion() || !mainRef.current) return;
      gsap.fromTo(
        mainRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.65, ease: "power3.out", overwrite: "auto" }
      );
    },
    { dependencies: [location.pathname], scope: mainRef }
  );

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

    if (samePage && lenisRef.current) {
      lenisRef.current.scrollTo(0);
      return;
    }
    window.scrollTo(0, 0);
    lenisRef.current?.scrollTo(0, { immediate: true });
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

    let cancelled = false;
    let attempts = 0;
    const run = () => {
      if (cancelled) return;
      if (scrollToId(id, { crossPage })) return;
      if (++attempts < 10) requestAnimationFrame(run);
    };
    // Two frames give the Programmes page time to mount before we measure.
    requestAnimationFrame(() => requestAnimationFrame(run));

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.hash]);

  return (
    <div className={`site-layout${isDiscover ? " site-layout--discover" : ""}`}>
      <Header />
      <div ref={mainRef} className="site-layout__main">
        <Outlet />
      </div>
      {isDiscover ? null : <Footer />}
    </div>
  );
}
