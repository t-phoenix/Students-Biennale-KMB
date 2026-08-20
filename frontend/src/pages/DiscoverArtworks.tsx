import { useCallback, useState } from "react";
import type { CanvasItem } from "../data/site";
import { InfiniteCanvas } from "../components/canvas/InfiniteCanvas";
import { CanvasExpand } from "../components/canvas/CanvasExpand";
import "./DiscoverArtworks.css";

type ExpandState = {
  item: CanvasItem;
  origin: DOMRect;
};

export function DiscoverArtworks() {
  const [query, setQuery] = useState("");
  const [expand, setExpand] = useState<ExpandState | null>(null);

  const onSelect = useCallback((item: CanvasItem, el: HTMLButtonElement) => {
    setExpand({ item, origin: el.getBoundingClientRect() });
  }, []);

  return (
    <div className="discover">
      <div className="discover__search">
        <label className="discover__search-field">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Artworks"
            aria-label="Search Artworks"
            autoComplete="off"
          />
          {query ? (
            <button type="button" className="discover__clear" onClick={() => setQuery("")}>
              Clear
            </button>
          ) : null}
        </label>
      </div>
      <div className="discover__stage">
        <InfiniteCanvas query={query} onSelect={onSelect} paused={Boolean(expand)} />
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
