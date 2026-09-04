import { Link } from "react-router-dom";
import { HighlightText } from "./HighlightText";
import type { EditionSearchResults as Results, SearchHit } from "../lib/catalogue/search";
import "../pages/EditionViews.css";

type Props = {
  query: string;
  results: Results;
};

function hitSubtitle(hit: SearchHit): string | undefined {
  if (hit.kind === "previous-edition") {
    const year = hit.editionYears.replace("-", "–");
    const role = hit.subtitle?.replace(/\s*·\s*\d{4}[–-]\d{2,4}$/, "").trim();
    if (role && role !== year) {
      return `Previous edition · ${year} · ${role}`;
    }
    return `Previous edition · ${year}`;
  }
  return hit.subtitle;
}

function HitRow({ hit, query }: { hit: SearchHit; query: string }) {
  const subtitle = hitSubtitle(hit);

  return (
    <Link className="edition-search-hit edition-search-hit--row" to={hit.href}>
      <div
        className={`edition-search-hit__thumb${hit.image ? "" : " edition-search-hit__thumb--empty"}`}
        aria-hidden
      >
        {hit.image ? (
          <img src={hit.image} alt="" loading="lazy" decoding="async" />
        ) : null}
      </div>
      <div className="edition-search-hit__copy">
        <h3>
          <HighlightText text={hit.title} query={query} />
        </h3>
        {subtitle ? (
          <p>
            <HighlightText text={subtitle} query={query} />
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function Section({
  title,
  hits,
  query,
}: {
  title: string;
  hits: SearchHit[];
  query: string;
}) {
  if (!hits.length) return null;
  return (
    <section className="edition-search-section" aria-label={title}>
      <h2 className="edition-search-section__title">
        {title}
        <span className="edition-search-section__count"> ({hits.length})</span>
      </h2>
      <div className="edition-search-section__list">
        {hits.map((hit) => (
          <HitRow key={`${hit.kind}-${hit.href}-${hit.matchedSnippet}`} hit={hit} query={query} />
        ))}
      </div>
    </section>
  );
}

export function EditionSearchResultsPanel({ query, results }: Props) {
  const hasAny =
    results.curators.length > 0 ||
    results.team.length > 0 ||
    results.artworks.length > 0 ||
    results.artists.length > 0 ||
    results.venues.length > 0 ||
    results.institutions.length > 0 ||
    results.previousEditions.length > 0;

  if (!hasAny) {
    return (
      <p className="fig-body edition-search-empty">
        No matches for “{query.trim()}”.
      </p>
    );
  }

  return (
    <div className="edition-search-results">
      <Section title="Curators" hits={results.curators} query={query} />
      <Section title="Team" hits={results.team} query={query} />
      <Section title="Artworks" hits={results.artworks} query={query} />
      <Section title="Artists" hits={results.artists} query={query} />
      <Section title="Venues" hits={results.venues} query={query} />
      <Section title="Institutions" hits={results.institutions} query={query} />
      <Section title="Previous editions" hits={results.previousEditions} query={query} />
    </div>
  );
}
