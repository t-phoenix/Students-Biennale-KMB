import { useEffect, useState } from "react";
import type { CanvasItem } from "../../data/site";
import { markDiscoverFirstDecode } from "../../lib/discoverPerf";
import { isImageWarm } from "../../lib/preloadImages";
import "./CanvasTile.css";

type Props = {
  item: CanvasItem;
  dimmed?: boolean;
  highlighted?: boolean;
  eager?: boolean;
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
  const [decoded, setDecoded] = useState(() =>
    item.image ? isImageWarm(item.image) : true,
  );

  useEffect(() => {
    if (!item.image) {
      setDecoded(true);
      return;
    }
    if (isImageWarm(item.image)) {
      setDecoded(true);
      return;
    }

    setDecoded(false);
    const img = new Image();
    img.src = item.image;
    void img
      .decode?.()
      .then(() => {
        setDecoded(true);
        if (eager) markDiscoverFirstDecode(item.image);
      })
      .catch(() => setDecoded(true));
  }, [item.image, eager]);

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
          {!decoded ? (
            <div className="canvas-tile__placeholder" aria-hidden />
          ) : null}
          <img
            className={`canvas-tile__media${decoded ? " is-decoded" : ""}`}
            src={item.image}
            alt={item.name}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            draggable={false}
            referrerPolicy="no-referrer"
            onLoad={() => {
              if (!decoded) {
                setDecoded(true);
                if (eager) markDiscoverFirstDecode(item.image);
              }
            }}
          />
        </>
      ) : (
        <div className="canvas-tile__media canvas-tile__media--empty" aria-hidden />
      )}
    </button>
  );
}
