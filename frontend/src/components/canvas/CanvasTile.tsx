import { memo } from "react";
import type { CanvasItem } from "../../data/site";
import { tileOriginal } from "../../lib/tileThumb";
import "./CanvasTile.css";

type Props = {
  item: CanvasItem;
  dimmed?: boolean;
  highlighted?: boolean;
  /** Part of the opening screen: fetched first. */
  eager?: boolean;
  onSelect: (item: CanvasItem, el: HTMLButtonElement) => void;
  onHoverChange?: (id: string | null) => void;
};

/**
 * One tile. It holds no loading state of its own: the canvas keeps itself hidden until the
 * opening screen's pictures are decoded and then reveals them together, so tiles never
 * appear one by one.
 */
function CanvasTileView({ item, dimmed, highlighted, eager = false, onSelect, onHoverChange }: Props) {
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
        <img
          className="canvas-tile__media"
          src={item.image}
          alt={item.name}
          loading="eager"
          decoding="async"
          fetchPriority={eager ? "high" : "low"}
          draggable={false}
          referrerPolicy="no-referrer"
          onError={(event) => {
            // The resized copy is unavailable: fall back to the original file.
            const img = event.currentTarget;
            const original = tileOriginal(img.src);
            if (original && img.src !== original) img.src = original;
          }}
        />
      ) : (
        <div className="canvas-tile__media canvas-tile__media--empty" aria-hidden />
      )}
    </button>
  );
}

export const CanvasTile = memo(CanvasTileView);
