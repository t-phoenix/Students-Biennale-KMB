import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  scrollToSection,
  type HomeSectionId,
  parseHomeHash,
} from "../lib/scrollToSection";
import "./Header.css";

const NAV: { hash: HomeSectionId; label: string; to?: string }[] = [
  { hash: "editions", label: "EDITIONS", to: "/editions/2025-26/curators" },
  { hash: "programmes", label: "PROGRAMMES", to: "/programmes" },
  { hash: "press", label: "PRESS" },
  { hash: "about", label: "ABOUT" },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === "/";
  const [activeSection, setActiveSection] = useState<HomeSectionId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!onHome) return;
    const fromHash = parseHomeHash(location.hash);
    if (fromHash) setActiveSection(fromHash);

    const sections = NAV.filter((n) => !n.to || n.hash === "programmes")
      .map((n) => document.getElementById(n.hash))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id as HomeSectionId);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [onHome, location.hash]);

  const goToSection = (hash: HomeSectionId, e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    if (onHome) {
      scrollToSection(hash);
      return;
    }
    navigate({ pathname: "/", hash });
  };

  return (
    <header ref={headerRef} className="site-header" data-node-id="6:287">
      <Link to="/" className="site-header__brand" aria-label="Students' Biennale home">
        <img
          src="/logo-sb-word.png"
          alt="Students' Biennale"
          className="site-header__logo-word"
        />
        <img
          src="/logo-sb-mark.png"
          alt=""
          aria-hidden="true"
          className="site-header__logo-mark"
        />
      </Link>

      <button
        type="button"
        className={`site-header__burger ${menuOpen ? "is-open" : ""}`}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span />
        <span />
      </button>

      <nav className="site-header__nav" aria-label="Primary">
        {NAV.map((item, i) => (
          <span key={item.hash} style={{ display: "contents" }}>
            {i > 0 ? <span className="site-header__sep">/</span> : null}
            {item.to ? (
              <Link
                to={item.to}
                data-label={item.hash}
                className={
                  location.pathname.startsWith(item.to) || (item.hash === "editions" && location.pathname.startsWith("/editions"))
                    ? "is-active"
                    : undefined
                }
              >
                {item.label}
              </Link>
            ) : (
              <a
                href={`/#${item.hash}`}
                data-label={item.hash}
                className={
                  onHome && activeSection === item.hash
                    ? "is-active"
                    : undefined
                }
                onClick={(e) => goToSection(item.hash, e)}
              >
                {item.label}
              </a>
            )}
          </span>
        ))}
      </nav>

      <div className={`site-header__drawer ${menuOpen ? "is-open" : ""}`}>
        <nav className="site-header__drawer-nav" aria-label="Mobile">
          {NAV.map((item) => (
            item.to ? (
              <Link
                key={item.hash}
                to={item.to}
                data-label={item.hash}
                className={
                  location.pathname.startsWith(item.to) || (item.hash === "editions" && location.pathname.startsWith("/editions"))
                    ? "is-active"
                    : undefined
                }
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.hash}
                href={`/#${item.hash}`}
                data-label={item.hash}
                className={
                  onHome && activeSection === item.hash
                    ? "is-active"
                    : undefined
                }
                onClick={(e) => goToSection(item.hash, e)}
              >
                {item.label}
              </a>
            )
          ))}
        </nav>
      </div>
    </header>
  );
}
