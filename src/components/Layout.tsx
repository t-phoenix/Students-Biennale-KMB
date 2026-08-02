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

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isDiscover]);

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
