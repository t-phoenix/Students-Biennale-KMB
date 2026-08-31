import { useCallback, useState } from "react";
import type { CanvasItem } from "../data/site";
import { InfiniteCanvas } from "../components/canvas/InfiniteCanvas";
import { CanvasExpand } from "../components/canvas/CanvasExpand";
import { useAllArtworks } from "../lib/catalogue";
import "./DiscoverArtworks.css";

type ExpandState = {
  item: CanvasItem;
  origin: DOMRect;
};

export function DiscoverArtworks() {
  const [query, setQuery] = useState("");
  const [expand, setExpand] = useState<ExpandState | null>(null);
  const { artworks, catalogues } = useAllArtworks();
  const sourceKey =
    catalogues.map((row) => `${row.years}:${row.generatedAt}`).join("|") || "static";

  const onSelect = useCallback((item: CanvasItem, el: HTMLButtonElement) => {
    setExpand({ item, origin: el.getBoundingClientRect() });
  }, []);

  return (
    <div className="discover">
      <div className="discover__search">
        <label className="discover__search-field">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Artworks"
            aria-label="Search Artworks"
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              className="discover__clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 1.5L12.5 12.5M1.5 12.5L12.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </label>
      </div>
      <div className="discover__stage">
        <InfiniteCanvas
          query={query}
          onSelect={onSelect}
          paused={Boolean(expand)}
          artworks={artworks}
          sourceKey={sourceKey}
        />
      </div>
      {expand ? (
        <CanvasExpand
          item={expand.item}
          origin={expand.origin}
          onClose={() => setExpand(null)}
        />
      ) : null}
    </div>
  );
}
