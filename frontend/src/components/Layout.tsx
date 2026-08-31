import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { syncScrollTrigger } from "../lib/motion";
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
      duration: 1.1,
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    setLenisInstance(lenis);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      syncScrollTrigger();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onSpotlight = (e: Event) => {
      const open = Boolean((e as CustomEvent<{ open: boolean }>).detail?.open);
      if (open) lenis.stop();
      else lenis.start();
    };
    window.addEventListener("spotlight:change", onSpotlight);

    return () => {
      window.removeEventListener("spotlight:change", onSpotlight);
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
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
      <div className="site-layout__main">
        <Outlet />
      </div>
      {isDiscover ? null : <Footer />}
    </div>
  );
}
