import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
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

const DROPDOWNS: Record<
  string,
  { align: "left" | "right"; items: DropdownItem[] }
> = {
  editions: {
    align: "left",
    items: [
      { label: LATEST_EDITION.id, to: `/editions/${LATEST_EDITION.id}/curators`, isCurrent: true },
      ...PREVIOUS_EDITIONS.map((year) => ({ label: year.replace("-", "–"), to: `/editions/${year}` })),
    ],
  },
  programmes: {
    align: "left",
    items: [
      { label: "Workshops", to: "/programmes#workshops" },
      { label: "Awards", to: "/programmes#awards" },
      { label: "Residencies", to: "/programmes#residencies" },
    ],
  },
  about: {
    align: "right",
    items: [
      { label: "Kochi Biennale Foundation", to: "/#about-kbf" },
      { label: "Students' Biennale", to: "/#about-sb" },
      { label: "SB 2025-26 Team", to: "/#about-team" },
      { label: "Sponsors of SB 2025-26", to: "/#about" },
    ],
  },
};

const NAV: {
  hash: HomeSectionId;
  label: string;
  to?: string;
  hasDropdown?: boolean;
}[] = [
  { hash: "editions", label: "EDITIONS", to: "/editions/2025-26/curators", hasDropdown: true },
  { hash: "programmes", label: "PROGRAMMES", hasDropdown: true },
  { hash: "press", label: "PRESS", to: "/press", hasDropdown: false },
  { hash: "about", label: "ABOUT", hasDropdown: true },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === "/";
  const [activeSection, setActiveSection] = useState<HomeSectionId | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const discoverRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLElement | null>>({});
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpenRef = useRef(false);

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

  // Synchronize dropdown panel animation, height morph, and slot placement
  useGSAP(
    () => {
      const panel = dropdownPanelRef.current;
      const navEl = navRef.current;
      if (!panel || !navEl) return;

      if (!activeDropdown) {
        if (isOpenRef.current) {
          isOpenRef.current = false;
          if (prefersReducedMotion()) {
            gsap.set(panel, { autoAlpha: 0 });
          } else {
            gsap.killTweensOf(panel);
            gsap.to(panel, {
              autoAlpha: 0,
              y: -8,
              duration: 0.22,
              ease: "power2.in",
            });
          }
        }
        return;
      }

      const activeSlot = slotRefs.current[activeDropdown];
      const tabEl = tabRefs.current[activeDropdown];
      if (!activeSlot || !tabEl) return;

      const navRect = navEl.getBoundingClientRect();
      const tabRect = tabEl.getBoundingClientRect();

      // Position active slot precisely
      if (activeDropdown === "about") {
        const rightOffset = Math.max(12, navRect.right - tabRect.right);
        activeSlot.style.right = `${rightOffset}px`;
        activeSlot.style.left = "auto";
      } else {
        const leftOffset = Math.max(12, tabRect.left - navRect.left);
        activeSlot.style.left = `${leftOffset}px`;
        activeSlot.style.right = "auto";
      }

      // Hide all slots except the active one
      Object.entries(slotRefs.current).forEach(([key, el]) => {
        if (!el) return;
        if (key === activeDropdown) {
          el.style.display = "flex";
        } else {
          el.style.display = "none";
          gsap.set(el, { autoAlpha: 0 });
        }
      });

      // Calculate required height
      const targetHeight = activeSlot.scrollHeight + 28; // 14px top + 14px bottom padding

      const wasOpen = isOpenRef.current;
      isOpenRef.current = true;

      if (!wasOpen) {
        // Initial entrance
        if (prefersReducedMotion()) {
          gsap.set(panel, { autoAlpha: 1, y: 0, height: targetHeight });
          gsap.set(activeSlot, { autoAlpha: 1 });
        } else {
          gsap.killTweensOf(panel);
          gsap.set(panel, { height: targetHeight });
          gsap.fromTo(
            panel,
            { autoAlpha: 0, y: -10, scaleY: 0.94 },
            {
              autoAlpha: 1,
              y: 0,
              scaleY: 1,
              duration: 0.35,
              ease: "power3.out",
              transformOrigin: "top center",
            }
          );
          gsap.fromTo(
            activeSlot,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.25, ease: "power2.out" }
          );
          gsap.fromTo(
            activeSlot.querySelectorAll(".site-header__dropdown-item"),
            { autoAlpha: 0, y: 6 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.28,
              stagger: 0.025,
              ease: "power2.out",
            }
          );
        }
      } else {
        // Smooth tab switch with fluid height tween and item cross-fade
        if (prefersReducedMotion()) {
          gsap.set(panel, { height: targetHeight });
          gsap.set(activeSlot, { autoAlpha: 1 });
        } else {
          gsap.to(panel, {
            height: targetHeight,
            duration: 0.35,
            ease: "power3.out",
            overwrite: "auto",
          });
          gsap.fromTo(
            activeSlot,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.22, ease: "power2.out" }
          );
          gsap.fromTo(
            activeSlot.querySelectorAll(".site-header__dropdown-item"),
            { autoAlpha: 0, y: 4 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.24,
              stagger: 0.02,
              ease: "power2.out",
            }
          );
        }
      }
    },
    { dependencies: [activeDropdown], scope: navRef }
  );

  const openDropdown = useCallback((hash: string) => {
    if (!DROPDOWNS[hash]) {
      closeDropdown();
      return;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setActiveDropdown(hash);
  }, []);

  const closeDropdown = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 140);
  }, []);

  const closeImmediate = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const panelEl = dropdownPanelRef.current;
    if (panelEl) {
      gsap.killTweensOf(panelEl);
      gsap.set(panelEl, { autoAlpha: 0 });
    }
    setActiveDropdown(null);
    isOpenRef.current = false;
  }, []);

  const goToSection = (
    hash: HomeSectionId,
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();
    closeImmediate();
    if (onHome) {
      scrollToSection(hash);
      navigate({ pathname: "/", hash }, { replace: true });
      return;
    }
    navigate({ pathname: "/", hash });
  };

  return (
    <header ref={headerRef} className="site-header" data-node-id="6:287">
      <Link to="/" className="site-header__brand" aria-label="Students' Biennale home" onClick={closeImmediate}>
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
        <Link ref={discoverRef} to="/artworks" className="site-header__discover" onClick={closeImmediate}>
          [Discover Artworks]
        </Link>
      )}

      <nav
        ref={navRef}
        className="site-header__nav"
        aria-label="Primary"
        onMouseLeave={closeDropdown}
      >
        {NAV.map((item, i) => (
          <span key={item.hash} className="site-header__nav-item" style={{ display: "contents" }}>
            {i > 0 ? <span className="site-header__sep">/</span> : null}
            <span
              ref={(el) => {
                tabRefs.current[item.hash] = el;
              }}
              className="site-header__nav-trigger"
              onMouseEnter={() => {
                if (item.hasDropdown) openDropdown(item.hash);
                else closeDropdown();
              }}
              onFocus={() => {
                if (item.hasDropdown) openDropdown(item.hash);
                else closeDropdown();
              }}
            >
              {item.to ? (
                <Link
                  to={item.to}
                  data-label={item.hash}
                  className={
                    (item.hash === "editions" && location.pathname.startsWith("/editions")) ||
                    (item.to && location.pathname.startsWith(item.to)) ||
                    activeDropdown === item.hash
                      ? "is-active"
                      : undefined
                  }
                  onClick={closeImmediate}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href={`/#${item.hash}`}
                  data-label={item.hash}
                  className={
                    (onHome && activeSection === item.hash) || activeDropdown === item.hash
                      ? "is-active"
                      : undefined
                  }
                  onClick={(e) => goToSection(item.hash, e)}
                >
                  {item.label}
                </a>
              )}
            </span>
          </span>
        ))}

        {/* Unified full-width dropdown panel */}
        <div
          ref={dropdownPanelRef}
          className="site-header__dropdown-panel"
          onMouseEnter={() => {
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
          }}
          onMouseLeave={closeDropdown}
          aria-hidden={!activeDropdown}
        >
          {Object.entries(DROPDOWNS).map(([key, config]) => (
            <div
              key={key}
              ref={(el) => {
                slotRefs.current[key] = el;
              }}
              className={`site-header__dropdown-slot site-header__dropdown-slot--${key} site-header__dropdown-slot--${config.align}`}
              style={{ display: "none" }}
            >
              {config.items.map((d) => (
                <Link
                  key={d.label}
                  to={d.to}
                  className={`site-header__dropdown-item${d.isCurrent ? " is-current" : ""}`}
                  onClick={closeImmediate}
                >
                  {d.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <a
        className="site-header__kbf"
        href="https://kochimuzirisbiennale.org/"
        target="_blank"
        rel="noreferrer"
        aria-label="Kochi Biennale Foundation"
        onClick={closeImmediate}
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
