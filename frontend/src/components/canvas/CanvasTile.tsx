import { useEffect, useRef, useState } from "react";
import type { CanvasItem } from "../../data/site";
import { markDiscoverFirstDecode } from "../../lib/discoverPerf";
import {
  isDiscoverImageRevealed,
  markDiscoverImageRevealed,
} from "../../lib/discoverReveal";
import { gsap, prefersReducedMotion } from "../../lib/motion";
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
  revealDelay = 0,
  onSelect,
  onHoverChange,
}: Props) {
  const tileRef = useRef<HTMLButtonElement>(null);
  const revealedRef = useRef(false);
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

  useEffect(() => {
    const el = tileRef.current;
    if (!el || revealedRef.current) return;
    if (item.image && !decoded) return;

    const url = item.image;
    const alreadyRevealed = url ? isDiscoverImageRevealed(url) : false;
    const delay = alreadyRevealed ? 0 : revealDelay;
    const duration = alreadyRevealed ? 0.4 : 0.9;

    revealedRef.current = true;

    if (prefersReducedMotion()) {
      el.classList.add("is-revealed");
      if (url) markDiscoverImageRevealed(url);
      return;
    }

    const media = el.querySelector<HTMLElement>(".canvas-tile__media");
    const timeline = gsap.timeline({
      delay,
      onComplete: () => {
        el.classList.add("is-revealed");
        gsap.set(el, { clearProps: "opacity" });
        if (media) gsap.set(media, { clearProps: "opacity,transform" });
        if (url) markDiscoverImageRevealed(url);
      },
    });

    timeline.to(el, { opacity: 1, duration: duration * 0.65, ease: "power2.out" }, 0);
    if (media) {
      timeline.fromTo(
        media,
        { opacity: 0, scale: 1.07 },
        { opacity: 1, scale: 1, duration, ease: "power2.out" },
        0,
      );
    }
  }, [decoded, item.image, revealDelay]);

  return (
    <button
      ref={tileRef}
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
            className="canvas-tile__media"
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
