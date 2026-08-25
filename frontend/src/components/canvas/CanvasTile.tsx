import type { CanvasItem } from "../../data/site";
import "./CanvasTile.css";

type Props = {
  item: CanvasItem;
  dimmed?: boolean;
  onSelect: (item: CanvasItem, el: HTMLButtonElement) => void;
};

export function CanvasTile({ item, dimmed, onSelect }: Props) {
  return (
    <button
      type="button"
      className={`canvas-tile canvas-tile--${item.kind} ${dimmed ? "is-dimmed" : ""}`}
      style={{
        width: item.width,
        height: item.height,
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
      }}
      aria-label={`${item.name} (${item.kind})`}
      onClick={(e) => onSelect(item, e.currentTarget)}
    >
      {item.image ? (
        <img
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="canvas-tile__media"
        />
      ) : (
        <div className="canvas-tile__media canvas-tile__media--empty" aria-hidden />
      )}
    </button>
  );
}
