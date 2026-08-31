import { useCallback, useEffect, useMemo, useRef } from "react";
import { type CanvasItem } from "../../data/site";
import { findCard, useAllArtworks } from "../../lib/catalogue";
import { prefetchArtworkGallery } from "../../lib/predictivePrefetch";
import { ArtworkDetailBody } from "../ArtworkDetailBody";
import { CtaLink } from "../CtaLink";
import { gsap, useGSAP, prefersReducedMotion } from "../../lib/motion";
import "./CanvasExpand.css";

type Props = {
  item: CanvasItem;
  origin: DOMRect;
  onClose: () => void;
};

/** Canvas tiles are seeded as "aw-" + ArtworkCard.id; tiled copies append
 *  "__c{col}-{n}". Decorative filler tiles use "ph-…" ids. */
function canvasArtworkId(itemId: string): string | undefined {
  if (!itemId.startsWith("aw-")) return undefined;
  return itemId.slice(3).replace(/__c\d+-\d+$/, "");
}

export function CanvasExpand({ item, origin, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const { artworks } = useAllArtworks();
  const artwork = useMemo(() => {
    const id = canvasArtworkId(item.id);
    return id ? findCard(artworks, id) : undefined;
  }, [artworks, item.id]);

  useEffect(() => {
    prefetchArtworkGallery(artwork);
  }, [artwork]);

  // FLIP transform that makes the full-size sheet exactly overlay the
  // clicked tile's position/size — computed once on open, reused in reverse
  // on close, so the sheet visibly grows out of and shrinks back into the
  // very tile the user clicked, not just a generic fade/scale.
  const flip = useRef({ x: 0, y: 0, scaleX: 1, scaleY: 1 });

  const animateClose = useCallback(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop || prefersReducedMotion()) {
      onClose();
      return;
    }
    gsap
      .timeline({ onComplete: onClose })
      .to(backdrop, { autoAlpha: 0, duration: 0.25 }, 0)
      .to(
        sheet,
        {
          x: flip.current.x,
          y: flip.current.y,
          scaleX: flip.current.scaleX,
          scaleY: flip.current.scaleY,
          duration: 0.45,
          ease: "power2.in",
        },
        0
      );
  }, [onClose]);

  useGSAP(
    () => {
      const sheet = sheetRef.current;
      const backdrop = backdropRef.current;
      if (!sheet || !backdrop) return;

      if (prefersReducedMotion()) {
        gsap.set([sheet, backdrop], { autoAlpha: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 });
        return;
      }

      // Measure the sheet at its natural full-size layout, then compute the
      // transform that shrinks it down onto the origin tile's exact rect.
      const final = sheet.getBoundingClientRect();
      const scaleX = origin.width / final.width;
      const scaleY = origin.height / final.height;
      const x = origin.left + origin.width / 2 - (final.left + final.width / 2);
      const y = origin.top + origin.height / 2 - (final.top + final.height / 2);
      flip.current = { x, y, scaleX, scaleY };

      gsap.set(sheet, { transformOrigin: "50% 50%", autoAlpha: 1, x, y, scaleX, scaleY });
      gsap.set(backdrop, { autoAlpha: 0 });
      gsap
        .timeline()
        .to(backdrop, { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, 0)
        .to(sheet, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.55, ease: "power3.out" }, 0);
    },
    { dependencies: [item.id, origin], scope: rootRef }
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") animateClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [animateClose]);

  return (
    <div
      ref={rootRef}
      className="canvas-expand"
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
    >
      <button
        ref={backdropRef}
        type="button"
        className="canvas-expand__backdrop"
        aria-label="Close"
        onClick={animateClose}
      />
      <div
        ref={sheetRef}
        className={`canvas-expand__sheet${artwork ? " canvas-expand__sheet--artwork" : ""}`}
      >
        <button type="button" className="canvas-expand__back" onClick={animateClose}>
          BACK
        </button>
        {artwork ? (
          <>
            <ArtworkDetailBody artwork={artwork} />
            <div className="canvas-expand__full-page">
              <CtaLink
                variant="next"
                to={`/editions/2025-26/artworks/${artwork.id}`}
                lines={["View", "full page"]}
                spacing={["0.135em", "0.135em"]}
              />
            </div>
          </>
        ) : (
          <>
            <p className="canvas-expand__kind">{item.kind}</p>
            <h2>{item.name}</h2>
            <p className="canvas-expand__meta">{item.meta}</p>
            {item.bio ? <p className="canvas-expand__bio">{item.bio}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
