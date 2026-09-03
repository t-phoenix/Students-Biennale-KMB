import { useEffect, useRef, type TouchEvent as ReactTouchEvent } from "react";
import { createPortal } from "react-dom";
import { preloadAdjacent, preloadUrls } from "../lib/preloadImages";
import { useModalPortal } from "../lib/useModalPortal";
import { PreloadedImage } from "./PreloadedImage";
import { BrandArrow } from "./BrandArrow";
import "./GalleryLightbox.css";

type Props = {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

/** Standalone full-bleed lightbox for single-image and multi-image galleries
 *  (Past Workshops, Residencies). Portal/focus-trap/scroll-lock/Escape come from
 *  useModalPortal; this component owns the image-specific bits — prev/next, the
 *  counter, and Arrow key navigation. */
/** Swipe past this distance (px) before it counts as a gesture, not a tap. */
const SWIPE_THRESHOLD = 40;

export function GalleryLightbox({ images, index, onClose, onIndexChange }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useModalPortal({ open: true, onClose, panelRef, initialFocusRef: closeRef });

  useEffect(() => {
    void preloadUrls(images, "high", index);
  }, [images, index]);

  useEffect(() => {
    if (images.length <= 1) return;
    void preloadAdjacent(images, index, 1, "high");
  }, [images, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onIndexChange((index - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onIndexChange((index + 1) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, index, onIndexChange]);

  const goPrev = () => onIndexChange((index - 1 + images.length) % images.length);
  const goNext = () => onIndexChange((index + 1) % images.length);

  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: ReactTouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > SWIPE_THRESHOLD) goPrev();
      else if (dx < -SWIPE_THRESHOLD) goNext();
    } else if (dy > SWIPE_THRESHOLD) {
      onClose();
    }
  };

  return createPortal(
    <div className="gallery-lightbox" role="presentation" data-lenis-prevent>
      <button
        type="button"
        className="gallery-lightbox__scrim"
        aria-label="Close image viewer"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="gallery-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="gallery-lightbox__frame">
          <PreloadedImage
            key={images[index]}
            src={images[index]}
            alt=""
            className="gallery-lightbox__image"
            prefetch={images.filter((_, i) => i !== index)}
          />
        </div>
        <button ref={closeRef} type="button" className="gallery-lightbox__close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        {images.length > 1 ? (
          <>
            <button type="button" className="gallery-lightbox__nav gallery-lightbox__prev" onClick={goPrev} aria-label="Previous image">
              <BrandArrow direction="left" />
            </button>
            <button type="button" className="gallery-lightbox__nav gallery-lightbox__next" onClick={goNext} aria-label="Next image">
              <BrandArrow direction="right" />
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
