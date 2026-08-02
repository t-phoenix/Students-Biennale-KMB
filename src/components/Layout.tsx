import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { syncScrollTrigger } from "../lib/motion";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { parseHomeHash, scrollToSection } from "../lib/scrollToSection";
import { setLenisInstance, snapEase } from "../lib/lenisStore";
import "./Layout.css";

export function Layout() {
  const location = useLocation();
  const isDiscover = location.pathname === "/artworks";
  const isHome = location.pathname === "/";
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (isDiscover) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: snapEase,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    setLenisInstance(lenis);

    const unsubScroll = lenis.on("scroll", () => syncScrollTrigger());

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
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
      unsubScroll();
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [isDiscover]);

  useEffect(() => {
    if (location.pathname !== "/") return;
    const id = parseHomeHash(location.hash);
    if (!id) return;
    requestAnimationFrame(() => scrollToSection(id));
  }, [location.pathname, location.hash]);

  return (
    <div
      className={`site-layout${isDiscover ? " site-layout--discover" : ""}${isHome ? " site-layout--home" : ""}`}
    >
      <Header />
      <div className="site-layout__main">
        <Outlet />
      </div>
      {isDiscover ? null : <Footer />}
    </div>
  );
}
