import { useState, useRef } from "react";
import { NavLink, Outlet, useLocation, useMatch, useParams } from "react-router-dom";
import { EditionSearchResultsPanel } from "../components/EditionSearchResults";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "../data/site";
import { useCatalogue } from "../lib/catalogue";
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
  const { query, setQuery, view, setView, isSearching } = useEditionSearch();

  return (
    <div className="edition-toolbar fig-band-9">
      <label className="edition-search">
        <span className="sr-only">Search</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Curators, Artworks, Artists..."
          aria-label="Search this edition"
        />
        {query ? (
          <button
            type="button"
            className="edition-search__clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </label>
      {!isSearching ? (
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
      ) : null}
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

function EditionShellLayout() {
  const { yearId = LATEST_EDITION.id } = useParams();
  const { catalogues, current } = useCatalogue();
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

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

      {/* Mobile top header & collapsible archive (visible on <= 899px) */}
      <div className="edition__mobile-nav-wrapper">
        <div className="edition__mobile-title-row">
          <h1 className="edition__mobile-title">
            Students&apos; Biennale <span className="edition__mobile-year">{headingYears}</span>
          </h1>
          <button
            type="button"
            className={`edition__archive-toggle${isArchiveOpen ? " is-open" : ""}`}
            onClick={() => setIsArchiveOpen((prev) => !prev)}
            aria-expanded={isArchiveOpen}
            aria-controls="mobile-archive-drawer"
          >
            <span>Archive ({previousYears.length})</span>
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
        </div>

        {/* Collapsible Previous Editions Drawer */}
        <div
          id="mobile-archive-drawer"
          className={`edition__archive-drawer${isArchiveOpen ? " is-open" : ""}`}
          aria-hidden={!isArchiveOpen}
        >
          <div className="edition__archive-drawer-inner">
            <p className="edition__archive-label">PREVIOUS EDITIONS</p>
            <div className="edition__archive-chips">
              {previousYears.map((y) => (
                <NavLink
                  key={y}
                  to={`/editions/${y}`}
                  onClick={() => setIsArchiveOpen(false)}
                  className="edition__archive-chip"
                >
                  {y}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Sticky Segmented Navigation Bar */}
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
        </nav>
      </div>

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
