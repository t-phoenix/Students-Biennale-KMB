import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSlideGesture } from "../lib/gesture";
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
export function GalleryLightbox({ images, index, onClose, onIndexChange }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<(direction: 1 | -1) => void>(() => {});

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
        stepRef.current(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepRef.current(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  // The image follows the finger or mouse: sideways changes image, down closes.
  const gesture = useSlideGesture(panelRef, {
    count: images.length,
    getIndex: () => index,
    ghost: { selector: ".gallery-lightbox__image", getSrc: (i) => images[i] ?? "" },
    getTravel: () => window.innerWidth,
    onCommit: onIndexChange,
    dismiss: {
      getTarget: () => frameRef.current,
      getFades: () =>
        Array.from(
          document.querySelectorAll<HTMLElement>(
            ".gallery-lightbox__scrim, .gallery-lightbox__nav, .gallery-lightbox__counter, .gallery-lightbox__close",
          ),
        ),
      onDismiss: onClose,
    },
  });

  stepRef.current = gesture.step;

  return createPortal(
    <div className="gallery-lightbox" role="presentation" data-lenis-prevent>
      <button
        type="button"
        className="gallery-lightbox__scrim"
        aria-label="Close image viewer"
        onClick={onClose}
      />
      <button
        ref={closeRef}
        type="button"
        className="gallery-lightbox__close"
        aria-label="Close image viewer"
        onClick={onClose}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div
        ref={panelRef}
        className="gallery-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
      >
        <div ref={frameRef} className="gallery-lightbox__frame">
          <PreloadedImage
            key={images[index]}
            src={images[index]}
            alt=""
            className="gallery-lightbox__image"
            prefetch={images.filter((_, i) => i !== index)}
          />
        </div>
        {images.length > 1 ? (
          <>
            <button type="button" className="gallery-lightbox__nav gallery-lightbox__prev" onClick={() => gesture.step(-1)} aria-label="Previous image">
              <BrandArrow direction="left" />
            </button>
            <button type="button" className="gallery-lightbox__nav gallery-lightbox__next" onClick={() => gesture.step(1)} aria-label="Next image">
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
