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
      className={`canvas-tile${dimmed ? " is-dimmed" : ""}`}
      style={{
        width: item.width,
        height: item.height,
        left: item.x,
        top: item.y,
      }}
      data-id={item.id}
      data-kind={item.kind}
      onClick={(e) => onSelect(item, e.currentTarget)}
    >
      {item.image ? (
        <img
          className="canvas-tile__media"
          src={item.image}
          alt={item.name}
          loading="lazy"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="canvas-tile__media canvas-tile__media--empty" aria-hidden />
      )}
      <div className="canvas-tile__caption">
        <span className="canvas-tile__kind">{item.kind}</span>
        <span className="canvas-tile__name">{item.name}</span>
        {item.meta ? <span className="canvas-tile__meta">{item.meta}</span> : null}
      </div>
    </button>
  );
}
