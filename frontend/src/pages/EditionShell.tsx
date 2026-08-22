import { NavLink, Outlet, useMatch, useParams } from "react-router-dom";
import { EditionSearchResultsPanel } from "../components/EditionSearchResults";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "../data/site";
import { useCatalogue } from "../lib/catalogue";
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
          placeholder="Search"
        />
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

  return (
    <div className="edition-view">
      <EditionSearchToolbar />
      {isSearching ? (
        <EditionSearchResultsPanel query={query} results={results} />
      ) : (
        <Outlet />
      )}
    </div>
  );
}

function EditionShellLayout() {
  const { yearId = LATEST_EDITION.id } = useParams();
  const { catalogues, current } = useCatalogue();
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
      <aside className="edition__rail fig-rail">
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
        <details className="edition__prev">
          <summary>Previous EDITIONS</summary>
          <ul>
            {previousYears.map((y) => (
              <li key={y}>
                <NavLink
                  to={`/editions/${y}`}
                  className={({ isActive }) => (isActive ? "is-selected" : undefined)}
                >
                  {y}
                </NavLink>
              </li>
            ))}
          </ul>
        </details>
      </aside>
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
