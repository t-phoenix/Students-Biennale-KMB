import { useEffect, useState } from "react";
import type { CanvasItem } from "../../data/site";
import { isImageWarm } from "../../lib/preloadImages";
import "./CanvasTile.css";

type Props = {
  item: CanvasItem;
  dimmed?: boolean;
  highlighted?: boolean;
  eager?: boolean;
  revealDelay?: number;
  onSelect: (item: CanvasItem, el: HTMLButtonElement) => void;
  onHoverChange?: (id: string | null) => void;
};

export function CanvasTile({
  item,
  dimmed,
  highlighted,
  eager = false,
  onSelect,
  onHoverChange,
}: Props) {
  const [loaded, setLoaded] = useState(() =>
    item.image ? isImageWarm(item.image) : true,
  );

  useEffect(() => {
    if (!item.image || isImageWarm(item.image)) {
      setLoaded(true);
      return;
    }
    const img = new Image();
    img.src = item.image;
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
  }, [item.image]);

  return (
    <button
      type="button"
      className={`canvas-tile${dimmed ? " is-dimmed" : ""}${highlighted ? " is-matched" : ""}`}
      style={{
        width: item.width,
        height: item.height,
        left: item.x,
        top: item.y,
      }}
      data-id={item.id}
      data-kind={item.kind}
      onClick={(e) => onSelect(item, e.currentTarget)}
      onMouseEnter={() => onHoverChange?.(item.id)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      {item.image ? (
        <>
          {!loaded ? (
            <div className="canvas-tile__placeholder" aria-hidden />
          ) : null}
          <img
            className="canvas-tile__media"
            src={item.image}
            alt={item.name}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            draggable={false}
            referrerPolicy="no-referrer"
            style={{ opacity: loaded ? 1 : 0 }}
            onLoad={() => setLoaded(true)}
          />
        </>
      ) : (
        <div className="canvas-tile__media canvas-tile__media--empty" aria-hidden />
      )}
    </button>
  );
}
