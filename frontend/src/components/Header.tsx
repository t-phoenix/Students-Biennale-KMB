import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "../data/site";
import {
  type HomeSectionId,
  parseHomeHash,
  scrollToSection,
} from "../lib/scrollToSection";
import "./Header.css";

type DropdownItem = { label: string; to: string; isCurrent?: boolean };

const NAV: {
  hash: HomeSectionId;
  label: string;
  to?: string;
  dropdown?: DropdownItem[];
}[] = [
  {
    hash: "editions",
    label: "EDITIONS",
    to: "/editions/2025-26/curators",
    dropdown: [
      { label: LATEST_EDITION.id, to: `/editions/${LATEST_EDITION.id}/curators`, isCurrent: true },
      ...PREVIOUS_EDITIONS.map((year) => ({ label: year, to: `/editions/${year}` })),
    ],
  },
  {
    hash: "programmes",
    label: "PROGRAMMES",
    dropdown: [
      { label: "Workshops", to: "/programmes#workshops" },
      { label: "Awards", to: "/programmes#awards" },
      { label: "Residencies", to: "/programmes#residencies" },
    ],
  },
  { hash: "press", label: "PRESS", to: "/press" },
  {
    hash: "about",
    label: "ABOUT",
    dropdown: [
      { label: "Kochi Biennale Foundation", to: "/#about-kbf" },
      { label: "Students' Biennale", to: "/#about-sb" },
      { label: "SB 2025-26 Team", to: "/#about-team" },
      { label: "Sponsors of SB 2025-26", to: "/#about" },
    ],
  },
];

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

    const sections = NAV.filter((n) => !n.to)
      .map((n) => document.getElementById(n.hash))
      .filter((el): el is HTMLElement => Boolean(el));
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
      const enter = () =>
        gsap.to(el, { scale: 1.04, autoAlpha: 1, duration: 0.2, ease: "power2.out" });
      const leave = () =>
        gsap.to(el, { scale: 1, duration: 0.2, ease: "power2.out" });
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
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();
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

      {location.pathname === "/artworks" ? null : (
        <Link ref={discoverRef} to="/artworks" className="site-header__discover">
          [Discover Artworks]
        </Link>
      )}

      <nav className="site-header__nav" aria-label="Primary">
        {NAV.map((item, i) => (
          <span key={item.hash} className="site-header__nav-item" style={{ display: "contents" }}>
            {i > 0 ? <span className="site-header__sep">/</span> : null}
            <span className="site-header__nav-trigger">
              {item.to ? (
                <Link
                  to={item.to}
                  data-label={item.hash}
                  className={
                    (item.hash === "editions" && location.pathname.startsWith("/editions")) ||
                    (item.to && location.pathname.startsWith(item.to))
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
              {item.dropdown ? (
                <div className="site-header__dropdown">
                  {item.dropdown.map((d) => (
                    <Link
                      key={d.label}
                      to={d.to}
                      className={d.isCurrent ? "is-current" : undefined}
                    >
                      {d.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </span>
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
