import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import {
  type HomeSectionId,
  parseHomeHash,
  scrollToSection,
} from "../lib/scrollToSection";
import "./Header.css";

const NAV: { hash: HomeSectionId; label: string; pageMatch?: string }[] = [
  { hash: "editions", label: "EDITIONS", pageMatch: "/editions" },
  { hash: "programmes", label: "programmes", pageMatch: "/programmes" },
  { hash: "press", label: "press", pageMatch: "/press" },
  { hash: "about", label: "about" },
];

function pathMatches(pathname: string, pageMatch?: string) {
  if (!pageMatch) return false;
  return pathname === pageMatch || pathname.startsWith(`${pageMatch}/`);
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === "/";
  const [activeSection, setActiveSection] = useState<HomeSectionId | null>(null);
  const discoverRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!onHome) {
      setActiveSection(null);
      return;
    }
    const fromHash = parseHomeHash(location.hash);
    if (fromHash) setActiveSection(fromHash);

    const sections = NAV.map((n) => document.getElementById(n.hash)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target;
        if (top?.id) setActiveSection(top.id as HomeSectionId);
      },
      { rootMargin: "-30% 0px -45% 0px", threshold: [0.1, 0.25, 0.5] }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [onHome, location.hash]);

  useGSAP(
    () => {
      const el = discoverRef.current;
      if (!el || prefersReducedMotion()) return;
      const enter = () => gsap.to(el, { scale: 1.04, autoAlpha: 1, duration: 0.2, ease: "power2.out" });
      const leave = () => gsap.to(el, { scale: 1, duration: 0.2, ease: "power2.out" });
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: headerRef }
  );

  const goToSection = (
    hash: HomeSectionId,
    event: MouseEvent<HTMLAnchorElement>,
    pageMatch?: string
  ) => {
    event.preventDefault();
    // Full Programmes / Press pages — not only the Home teaser sections.
    if (hash === "programmes") {
      navigate("/programmes");
      return;
    }
    if (hash === "press") {
      navigate("/press");
      return;
    }
    if (hash === "editions" && pageMatch) {
      navigate("/editions/2025-26");
      return;
    }
    if (onHome) {
      scrollToSection(hash);
      navigate({ pathname: "/", hash }, { replace: true });
      return;
    }
    navigate({ pathname: "/", hash });
  };

  return (
    <header ref={headerRef} className="site-header" data-node-id="6:287">
      <Link to="/" className="site-header__brand" aria-label="Students' Biennale home">
        <img
          className="site-header__brand-logo site-header__brand-logo--full"
          src="/logo-sb.svg"
          alt="Students' Biennale"
        />
        <img
          className="site-header__brand-logo site-header__brand-logo--icon"
          src="/logo-sb-mark.svg"
          alt="Students' Biennale"
        />
      </Link>

      <Link
        ref={discoverRef}
        to="/artworks"
        className={`site-header__discover${location.pathname === "/artworks" ? " is-active" : ""}`}
      >
        [Discover Artworks]
      </Link>

      <nav className="site-header__nav" aria-label="Primary">
        {NAV.map((item, i) => (
          <span key={item.hash} style={{ display: "contents" }}>
            {i > 0 ? <span className="site-header__sep">/</span> : null}
            <a
              href={
                item.hash === "programmes"
                  ? "/programmes"
                  : item.hash === "press"
                    ? "/press"
                    : item.hash === "editions"
                      ? "/editions/2025-26"
                      : `/#${item.hash}`
              }
              data-label={item.hash}
              className={
                (onHome && activeSection === item.hash) ||
                pathMatches(location.pathname, item.pageMatch)
                  ? "is-active"
                  : undefined
              }
              onClick={(e) => goToSection(item.hash, e, item.pageMatch)}
            >
              {item.label}
            </a>
          </span>
        ))}
      </nav>

      <a
        className="site-header__kbf"
        href="https://kochimuzirisbiennale.org/"
        target="_blank"
        rel="noreferrer"
        aria-label="Kochi Biennale Foundation"
      >
        <img
          className="site-header__kbf-logo site-header__kbf-logo--full"
          src="/logo-kbf.svg"
          alt="Kochi Biennale Foundation"
        />
        <img
          className="site-header__kbf-logo site-header__kbf-logo--icon"
          src="/logo-kbf-icon.svg"
          alt="Kochi Biennale Foundation"
        />
      </a>
    </header>
  );
}
