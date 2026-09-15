import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "../data/site";
import { parseHomeHash, scrollToSection } from "../lib/scrollToSection";
import "./MobileNavDrawer.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SOCIAL = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/kochibiennale/",
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

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
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
      onClose();
      if (to.startsWith("/#")) {
        const hash = to.replace("/#", "");
        const parsed = parseHomeHash(hash);
        if (location.pathname === "/") {
          if (parsed) {
            scrollToSection(parsed);
          }
        } else {
          navigate(to);
        }
      } else {
        navigate(to);
      }
    },
    [location.pathname, navigate, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation Menu">
      <div className="mobile-drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mobile-drawer__content">
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
              <button
                type="button"
                className="mobile-drawer__sublink"
                onClick={() => handleNavClick("/programmes#workshops")}
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
