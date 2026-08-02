import { NavLink, Outlet, useParams } from "react-router-dom";
import { LATEST_EDITION, PREVIOUS_EDITIONS } from "../data/site";
import "./EditionShell.css";

const TABS = [
  { to: "curators", label: "CURATORS" },
  { to: "artworks", label: "Artworks" },
  { to: "artists", label: "Artists" },
  { to: "venue", label: "Venues" },
] as const;

export function EditionShell() {
  const { yearId = LATEST_EDITION.id } = useParams();

  return (
    <div className="edition">
      <aside className="edition__rail">
        <h1>
          Students&apos; Biennale
          <br />
          {yearId === LATEST_EDITION.id ? "2025–26" : yearId}
        </h1>
        <nav className="edition__tabs" aria-label="Edition catalogues">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={`/editions/${yearId}/${tab.to}`}
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <details className="edition__prev">
          <summary>Previous EDITIONS</summary>
          <ul>
            {PREVIOUS_EDITIONS.map((y) => (
              <li key={y}>
                <NavLink to={`/editions/${y}/curators`}>{y}</NavLink>
              </li>
            ))}
          </ul>
        </details>
      </aside>
      <div className="edition__main">
        <Outlet />
      </div>
    </div>
  );
}
