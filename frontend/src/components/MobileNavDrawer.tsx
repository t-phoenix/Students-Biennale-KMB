import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "../data/site";
import {
  type ProgrammeSectionId,
  parseHomeHash,
  scrollToSection,
  scrollToId,
} from "../lib/scrollToSection";
import { getLenisInstance, glideToTop } from "../lib/lenisSingleton";
import { bindPullToDismiss } from "../lib/gesture";
import { EXIT, gsap, prefersReducedMotion } from "../lib/motion";
import "./MobileNavDrawer.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SOCIAL = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/studentsbiennale/",
    icon: "/icons/social-instagram.svg",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/KochiMuzirisBiennale",
    icon: "/icons/social-facebook.svg",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/kochi-biennale-foundation---india",
    icon: "/icons/social-linkedin.svg",
  },
] as const;

export function MobileNavDrawer({ isOpen, onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>("editions");
  // Stays mounted through the exit so closing plays the reverse of opening.
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    if (prefersReducedMotion()) {
      setMounted(false);
      return;
    }
    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, EXIT.duration * 1000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // The menu opens downward, so on touch it closes by being pulled back up.
  useEffect(() => {
    const content = contentRef.current;
    if (!mounted || !isOpen || !content) return;
    return bindPullToDismiss({
      sheet: content,
      backdrop: backdropRef.current,
      direction: "up",
      onDismiss: () => {
        // The exit animation starts from wherever the drag left it.
        const root = rootRef.current;
        const backdrop = backdropRef.current;
        if (root) {
          root.style.setProperty("--drawer-exit-from-y", `${gsap.getProperty(content, "y")}px`);
          if (backdrop) root.style.setProperty("--drawer-exit-from-opacity", String(gsap.getProperty(backdrop, "opacity")));
        }
        gsap.set(content, { clearProps: "transform" });
        if (backdrop) gsap.set(backdrop, { clearProps: "opacity,visibility" });
        onCloseRef.current();
      },
    });
  }, [mounted, isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Lock body scroll and pause Lenis when open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const lenis = getLenisInstance();
      lenis?.stop();
      return () => {
        document.body.style.overflow = prevOverflow;
        lenis?.start();
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleNavClick = useCallback(
    (to: string) => {
      document.body.style.overflow = "";
      const lenis = getLenisInstance();
      lenis?.start();
      onClose();
      if (to.startsWith("/#")) {
        const hash = to.replace("/#", "");
        const parsed = parseHomeHash(hash);
        if (location.pathname === "/") {
          if (parsed) {
            scrollToSection(parsed);
          }
          if (location.hash !== `#${hash}`) {
            navigate(to, { replace: true });
          }
        } else {
          navigate(to);
        }
      } else if (to.startsWith("/programmes#")) {
        const hash = to.replace("/programmes#", "") as ProgrammeSectionId;
        if (location.pathname === "/programmes") {
          scrollToId(hash);
          if (location.hash !== `#${hash}`) {
            navigate(to, { replace: true });
          }
        } else {
          navigate(to);
        }
      } else if (to === "/programmes") {
        if (location.pathname === "/programmes") {
          glideToTop({ reduced: prefersReducedMotion() });
          if (location.hash) {
            navigate("/programmes", { replace: true });
          }
        } else {
          navigate(to);
        }
      } else {
        navigate(to);
      }
    },
    [location.pathname, location.hash, navigate, onClose]
  );

  if (!mounted) return null;

  return (
    <div ref={rootRef} className={`mobile-drawer${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Navigation Menu" data-lenis-prevent>
      <div ref={backdropRef} className="mobile-drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={contentRef} className="mobile-drawer__content" data-lenis-prevent>
        <div className="mobile-drawer__top">
          <button
            type="button"
            className="mobile-drawer__discover"
            onClick={() => handleNavClick("/artworks")}
          >
            [DISCOVER ARTWORKS]
          </button>
        </div>

        <nav className="mobile-drawer__nav" aria-label="Mobile Main Navigation">
          {/* EDITIONS */}
          <div className={`mobile-drawer__group${expandedSection === "editions" ? " is-expanded" : ""}`}>
            <button
              type="button"
              className="mobile-drawer__group-btn"
              onClick={() => toggleSection("editions")}
              aria-expanded={expandedSection === "editions"}
            >
              <span>EDITIONS</span>
              <span className="mobile-drawer__arrow" aria-hidden="true">
                {expandedSection === "editions" ? "−" : "+"}
              </span>
            </button>
            <div className="mobile-drawer__submenu">
              <div className="mobile-drawer__submenu-inner">
                <button
                  type="button"
                  className="mobile-drawer__sublink is-current"
                  onClick={() => handleNavClick("/#editions")}
                >
                  {LATEST_EDITION.id}
                </button>
                {PREVIOUS_EDITIONS.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className="mobile-drawer__sublink"
                    onClick={() => handleNavClick(`/editions/${year}`)}
                  >
                    {year.replace("-", "–")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PROGRAMMES */}
          <div className={`mobile-drawer__group${expandedSection === "programmes" ? " is-expanded" : ""}`}>
            <button
              type="button"
              className="mobile-drawer__group-btn"
              onClick={() => toggleSection("programmes")}
              aria-expanded={expandedSection === "programmes"}
            >
              <span>PROGRAMMES</span>
              <span className="mobile-drawer__arrow" aria-hidden="true">
                {expandedSection === "programmes" ? "−" : "+"}
              </span>
            </button>
            <div className="mobile-drawer__submenu">
              <div className="mobile-drawer__submenu-inner">
                <button
                  type="button"
                  className="mobile-drawer__sublink"
                  onClick={() => handleNavClick("/programmes")}
                >
                  Workshops
                </button>
                <button
                  type="button"
                  className="mobile-drawer__sublink"
                  onClick={() => handleNavClick("/programmes#awards")}
                >
                  Awards
                </button>
                <button
                  type="button"
                  className="mobile-drawer__sublink"
                  onClick={() => handleNavClick("/programmes#residencies")}
                >
                  Residencies
                </button>
              </div>
            </div>
          </div>

          {/* PRESS */}
          <div className="mobile-drawer__group">
            <button
              type="button"
              className="mobile-drawer__group-btn mobile-drawer__group-btn--direct"
              onClick={() => handleNavClick("/press")}
            >
              <span>PRESS</span>
            </button>
          </div>

          {/* ABOUT */}
          <div className={`mobile-drawer__group${expandedSection === "about" ? " is-expanded" : ""}`}>
            <button
              type="button"
              className="mobile-drawer__group-btn"
              onClick={() => toggleSection("about")}
              aria-expanded={expandedSection === "about"}
            >
              <span>ABOUT</span>
              <span className="mobile-drawer__arrow" aria-hidden="true">
                {expandedSection === "about" ? "−" : "+"}
              </span>
            </button>
            <div className="mobile-drawer__submenu">
              <div className="mobile-drawer__submenu-inner">
                <button
                  type="button"
                  className="mobile-drawer__sublink"
                  onClick={() => handleNavClick("/#about-kbf")}
                >
                  Kochi Biennale Foundation
                </button>
                <button
                  type="button"
                  className="mobile-drawer__sublink"
                  onClick={() => handleNavClick("/#about-sb")}
                >
                  Students&apos; Biennale
                </button>
                <button
                  type="button"
                  className="mobile-drawer__sublink"
                  onClick={() => handleNavClick("/#about-team")}
                >
                  SB 2025-26 Team
                </button>
                <button
                  type="button"
                  className="mobile-drawer__sublink"
                  onClick={() => handleNavClick("/#about-sponsors")}
                >
                  Sponsors of SB 2025-26
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="mobile-drawer__footer">
          <div className="mobile-drawer__social">
            {SOCIAL.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="mobile-drawer__social-link"
              >
                <img src={item.icon} alt="" width={22} height={22} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
