import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useLocation, useMatch, useParams } from "react-router-dom";
import { EditionSearchResultsPanel } from "../components/EditionSearchResults";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "../data/site";
import { useCatalogue } from "../lib/catalogue";
import { useModalPortal } from "../lib/useModalPortal";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";
import { EditionSearchProvider, useEditionSearch } from "./EditionSearchContext";
import "./EditionShell.css";
import "./EditionViews.css";

const TABS = [
  { to: "curators", label: "CURATORS" },
  { to: "artworks", label: "Artworks" },
  { to: "artists", label: "Artists" },
  { to: "venue", label: "Venues" },
] as const;

function EditionSearchToolbar() {
  const { query, setQuery, view, setView } = useEditionSearch();
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || Boolean(query);

  return (
    <div className="edition-toolbar fig-band-9">
      <div className={`edition-search${isActive ? " is-active" : ""}`}>
        <label htmlFor="edition-search-input" className="edition-search__label">
          Search
        </label>
        <input
          id="edition-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Search this edition"
          autoComplete="off"
        />
        <button
          type="button"
          className={`edition-search__clear${query ? " is-visible" : ""}`}
          onClick={() => setQuery("")}
          aria-label="Clear search"
          tabIndex={query ? 0 : -1}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="edition-view-toggle" role="group" aria-label="View mode">
        <button
          type="button"
          className={view === "grid" ? "is-active" : undefined}
          onClick={() => setView("grid")}
          aria-pressed={view === "grid"}
          aria-label="Grid view"
        >
          <img src="/icons/grid-view.svg" alt="" width={36} height={36} />
        </button>
        <button
          type="button"
          className={view === "list" ? "is-active" : undefined}
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          aria-label="List view"
        >
          <img src="/icons/list-view.svg" alt="" width={36} height={36} />
        </button>
      </div>
    </div>
  );
}

function EditionCatalogueMain() {
  const { isSearching, query, results } = useEditionSearch();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !contentRef.current) return;
      gsap.fromTo(
        contentRef.current,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto",
        }
      );
    },
    { dependencies: [location.pathname], scope: contentRef }
  );

  return (
    <div className="edition-view">
      <EditionSearchToolbar />
      {isSearching ? (
        <EditionSearchResultsPanel query={query} results={results} />
      ) : (
        <div ref={contentRef} className="edition-content-wrapper">
          <Outlet />
        </div>
      )}
    </div>
  );
}

function PreviousEditionsModal({
  open,
  onClose,
  currentYearId,
}: {
  open: boolean;
  onClose: () => void;
  currentYearId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useModalPortal({
    open,
    onClose,
    panelRef,
    initialFocusRef: closeBtnRef,
  });

  if (!open || typeof document === "undefined") return null;

  const editionsList = [
    {
      id: LATEST_EDITION.id,
      title: "Students' Biennale 2025–26",
      subtitle: "Sensing Grounds",
      isCurrent: true,
    },
    {
      id: "2022-23",
      title: "Students' Biennale 2022–23",
      subtitle: "In the Making",
    },
    {
      id: "2020-21",
      title: "Students' Biennale 2020–21",
      subtitle: "Words are Thinking Marks",
    },
    {
      id: "2018-19",
      title: "Students' Biennale 2018–19",
      subtitle: "Making as Learning",
    },
    {
      id: "2016-17",
      title: "Students' Biennale 2016–17",
      subtitle: "Second Edition",
    },
    {
      id: "2014-15",
      title: "Students' Biennale 2014–15",
      subtitle: "Inaugural Edition",
    },
  ];

  return createPortal(
    <div className="edition-modal" role="presentation" data-lenis-prevent>
      <button
        type="button"
        className="edition-modal__scrim"
        aria-label="Close Previous Editions modal"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="edition-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edition-modal-title"
      >
        <div className="edition-modal__handle" aria-hidden="true" />
        <div className="edition-modal__header">
          <div>
            <p className="edition-modal__kicker">Students&apos; Biennale</p>
            <h2 id="edition-modal-title" className="edition-modal__title">
              Previous Editions
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="edition-modal__close-btn"
            onClick={onClose}
            aria-label="Close Previous Editions modal"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="edition-modal__list" aria-label="Available editions">
          {editionsList.map((ed) => {
            const isSelected = ed.id === currentYearId;
            return (
              <NavLink
                key={ed.id}
                to={`/editions/${ed.id}`}
                onClick={onClose}
                className={`edition-modal__item${isSelected ? " is-selected" : ""}`}
              >
                <div className="edition-modal__item-content">
                  <div className="edition-modal__item-heading-row">
                    <span className="edition-modal__item-year">
                      {ed.id.replace("-", "–")}
                    </span>
                    {ed.isCurrent && (
                      <span className="edition-modal__current-pill">
                        Current Edition
                      </span>
                    )}
                    {isSelected && (
                      <span className="edition-modal__active-pill">
                        Viewing
                      </span>
                    )}
                  </div>
                  {ed.subtitle && (
                    <span className="edition-modal__item-subtitle">
                      {ed.subtitle}
                    </span>
                  )}
                </div>
                <div className="edition-modal__item-arrow" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>,
    document.body
  );
}

function EditionShellLayout() {
  const { yearId = LATEST_EDITION.id } = useParams();
  const location = useLocation();
  const { catalogues, current } = useCatalogue();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  useEffect(() => {
    setIsArchiveOpen(false);
  }, [location.pathname]);

  const previous = catalogues
    .filter((row) => !row.isCurrent && row.years !== yearId)
    .map((row) => row.years);
  const previousYears = previous.length ? previous : PREVIOUS_EDITIONS.filter((y) => y !== yearId);
  const headingYears =
    yearId === (current?.years ?? LATEST_EDITION.id)
      ? (current?.years ?? LATEST_EDITION.id).replace("-", "–")
      : yearId.replace("-", "–");

  return (
    <div className="edition fig-grid" data-node-id="6:1310">
      {/* Desktop stationery left rail (hidden on <= 899px) */}
      <aside className="edition__rail fig-rail edition__rail--desktop">
        <h1 className="fig-heading">
          Students&apos; Biennale
          <br />
          {headingYears}
        </h1>
        <nav className="edition__tabs" aria-label="Edition catalogues">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={`/editions/${yearId}/${tab.to}`}
              className={({ isActive }) =>
                `fig-subheading${isActive ? " is-selected" : ""}`
              }
            >
              {tab.label}
              <span className="fig-subheading__underline" aria-hidden />
            </NavLink>
          ))}
        </nav>
        <div className="edition__prev">
          <h2 className="edition__prev-heading">PREVIOUS EDITIONS</h2>
          <ul>
            {previousYears.map((y) => (
              <li key={y}>
                <NavLink
                  to={`/editions/${y}`}
                  className={({ isActive }) =>
                    `fig-subheading${isActive ? " is-selected" : ""}`
                  }
                >
                  {y}
                  <span className="fig-subheading__underline" aria-hidden />
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Mobile top header & navigation (visible on <= 899px) */}
      <div className="edition__mobile-nav-wrapper">
        <div className="edition__mobile-title-row">
          <h1 className="edition__mobile-title">
            Students&apos; Biennale <span className="edition__mobile-year">{headingYears}</span>
          </h1>
        </div>

        {/* Mobile Sticky Segmented Navigation Bar */}
        <div className="edition__mobile-sticky-bar">
          <nav className="edition__mobile-tabs" aria-label="Edition sections">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={`/editions/${yearId}/${tab.to}`}
                className={({ isActive }) =>
                  `edition__mobile-tab${isActive ? " is-active" : ""}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
            <button
              type="button"
              className={`edition__mobile-tab edition__archive-toggle${isArchiveOpen ? " is-open" : ""}`}
              onClick={() => setIsArchiveOpen((prev) => !prev)}
              aria-expanded={isArchiveOpen}
              aria-haspopup="dialog"
            >
              <span>Previous Editions</span>
              <svg
                className="edition__archive-chevron"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </nav>
        </div>
      </div>

      <PreviousEditionsModal
        open={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        currentYearId={yearId}
      />

      <div className="edition__main fig-c4-12">
        <EditionCatalogueMain />
      </div>
    </div>
  );
}

export function EditionShell() {
  const isOverview = Boolean(useMatch("/editions/:yearId"));

  if (isOverview) return <Outlet />;

  return (
    <EditionSearchProvider>
      <EditionShellLayout />
    </EditionSearchProvider>
  );
}
