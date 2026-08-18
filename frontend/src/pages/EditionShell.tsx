import { NavLink, Outlet, useMatch, useParams } from "react-router-dom";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "../data/site";
import { useCatalogue } from "../lib/catalogue";
import "./EditionShell.css";

const TABS = [
  { to: "curators", label: "CURATORS" },
  { to: "artworks", label: "Artworks" },
  { to: "artists", label: "Artists" },
  { to: "venue", label: "Venues" },
] as const;

export function EditionShell() {
  const { yearId = LATEST_EDITION.id } = useParams();
  const isOverview = Boolean(useMatch("/editions/:yearId"));
  const { catalogues, current } = useCatalogue();
  const previous = catalogues
    .filter((row) => !row.isCurrent && row.years !== yearId)
    .map((row) => row.years);
  const previousYears = previous.length ? previous : PREVIOUS_EDITIONS.filter((y) => y !== yearId);
  const headingYears =
    yearId === (current?.years ?? LATEST_EDITION.id)
      ? (current?.years ?? LATEST_EDITION.id).replace("-", "–")
      : yearId.replace("-", "–");

  // The edition overview is a full-width page in Figma — it owns its own layout and
  // does not sit beside the catalogue rail.
  if (isOverview) return <Outlet />;

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
                <NavLink to={`/editions/${y}`}>{y}</NavLink>
              </li>
            ))}
          </ul>
        </details>
      </aside>
      <div className="edition__main fig-c4-12">
        <Outlet />
      </div>
    </div>
  );
}
