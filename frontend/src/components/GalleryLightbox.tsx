import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useModalPortal } from "../lib/useModalPortal";
import "./GalleryLightbox.css";

type Props = {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

/** Full-bleed dark-scrim image viewer shared by every page with a photo gallery
 *  (Past Workshops, Residencies). Portal/focus-trap/scroll-lock/Escape come from
 *  useModalPortal; this component owns the image-specific bits — prev/next, the
 *  counter, and Arrow key navigation. */
export function GalleryLightbox({ images, index, onClose, onIndexChange }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModalPortal({ open: true, onClose, panelRef, initialFocusRef: closeRef });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onIndexChange]);

  if (typeof document === "undefined") return null;

  const goPrev = () => onIndexChange((index - 1 + images.length) % images.length);
  const goNext = () => onIndexChange((index + 1) % images.length);

  return createPortal(
    <div className="gallery-lightbox" role="presentation" data-lenis-prevent>
      <button
        type="button"
        className="gallery-lightbox__scrim"
        aria-label="Close image viewer"
        onClick={onClose}
      />
      <div ref={panelRef} className="gallery-lightbox__panel" role="dialog" aria-modal="true" aria-label="Image viewer">
        <img src={images[index]} alt="" className="gallery-lightbox__image" />
        <button ref={closeRef} type="button" className="gallery-lightbox__close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        {images.length > 1 ? (
          <>
            <button type="button" className="gallery-lightbox__nav gallery-lightbox__prev" onClick={goPrev} aria-label="Previous image">
              ←
            </button>
            <button type="button" className="gallery-lightbox__nav gallery-lightbox__next" onClick={goNext} aria-label="Next image">
              →
            </button>
            <div className="gallery-lightbox__counter">
              {index + 1} / {images.length}
            </div>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
