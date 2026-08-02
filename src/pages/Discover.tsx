import { useCallback, useState } from "react";
import type { CanvasItem } from "../data/discover";
import { InfiniteCanvas } from "../components/discover/InfiniteCanvas";
import { CanvasExpand } from "../components/discover/CanvasExpand";
import "./Discover.css";

type ExpandState = {
  item: CanvasItem;
  origin: DOMRect;
};

export function Discover() {
  const [query, setQuery] = useState("");
  const [expand, setExpand] = useState<ExpandState | null>(null);

  const onSelect = useCallback((item: CanvasItem, el: HTMLButtonElement) => {
    setExpand({ item, origin: el.getBoundingClientRect() });
  }, []);

  return (
    <div className="discover">
      <div className="discover__search">
        <label className="discover__search-field">
          <span className="sr-only">Search artworks</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
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
        <InfiniteCanvas query={query} onSelect={onSelect} />
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
