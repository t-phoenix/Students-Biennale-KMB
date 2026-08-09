import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { syncScrollTrigger } from "../lib/motion";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { parseHomeHash, scrollToSection } from "../lib/scrollToSection";
import "./Layout.css";

export function Layout() {
  const location = useLocation();
  const isDiscover = location.pathname === "/artworks";
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (isDiscover) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

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
    };
  }, [isDiscover]);

  // Land at the top of every new page. Skipped when the navigation targets a
  // Home section (e.g. the nav's "programmes" link goes to "/#programmes"),
  // since that case scrolls to the section instead, below.
  useEffect(() => {
    if (location.pathname === "/" && parseHomeHash(location.hash)) return;
    window.scrollTo(0, 0);
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/") return;
    const id = parseHomeHash(location.hash);
    if (!id) return;
    requestAnimationFrame(() => scrollToSection(id));
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
