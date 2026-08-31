import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { crossfadeSlides, initSlideStack } from "../lib/imageSlider";
import { preloadAdjacent, preloadUrls } from "../lib/preloadImages";
import { BrandImageLoader } from "./BrandImageLoader";
import "./ImageCrossfadeStack.css";

type Props = {
  images: readonly string[];
  index: number;
  className?: string;
  imageClassName?: string;
  alt?: string;
  fit?: "cover" | "contain";
  /** When true the stack sizes its own box instead of filling a positioned parent. */
  relative?: boolean;
  onImageClick?: (event: MouseEvent<HTMLImageElement>) => void;
  showLoader?: boolean;
  loaderVariant?: "cover" | "inline";
  prefetchRadius?: number;
};

/**
 * Stacked image carousel with GSAP crossfade — used anywhere a slider should
 * feel as smooth as the Home / Edition heroes.
 */
export function ImageCrossfadeStack({
  images,
  index,
  className,
  imageClassName,
  alt = "",
  fit = "cover",
  relative = false,
  onImageClick,
  showLoader = true,
  loaderVariant = "cover",
  prefetchRadius = 1,
}: Props) {
  const slideRefs = useRef<(HTMLImageElement | null)[]>([]);
  const prevIndex = useRef(index);
  const imagesKey = images.join("|");
  const safeIndex = images.length ? Math.min(Math.max(index, 0), images.length - 1) : 0;
  const [activeReady, setActiveReady] = useState(false);

  useLayoutEffect(() => {
    prevIndex.current = 0;
    setActiveReady(false);
  }, [imagesKey]);

  useEffect(() => {
    if (!images.length) return;
    void preloadUrls(images, "high", safeIndex);
  }, [images, imagesKey, safeIndex]);

  useEffect(() => {
    if (images.length <= 1) return;
    void preloadAdjacent(images, safeIndex, prefetchRadius, "high");
  }, [images, safeIndex, prefetchRadius]);

  useLayoutEffect(() => {
    const slides = slideRefs.current.filter((el): el is HTMLImageElement => Boolean(el));
    if (slides.length !== images.length) return;

    const from = prevIndex.current;
    if (from === safeIndex) {
      initSlideStack(slides, safeIndex);
    } else {
      crossfadeSlides(slides, from, safeIndex);
    }
    prevIndex.current = safeIndex;

    const active = slideRefs.current[safeIndex];
    if (active?.complete && active.naturalWidth > 0) {
      setActiveReady(true);
    }
  }, [safeIndex, imagesKey, images.length]);

  const revealActiveSlide = (slideIndex: number) => {
    if (slideIndex !== safeIndex) return;
    setActiveReady(true);
    const slides = slideRefs.current.filter((el): el is HTMLImageElement => Boolean(el));
    if (slides.length !== images.length) return;
    initSlideStack(slides, safeIndex);
  };

  if (!images.length) return null;

  const rootClass = [
    "image-crossfade",
    fit === "contain" ? "image-crossfade--contain" : undefined,
    relative ? "image-crossfade--relative" : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {showLoader && !activeReady ? (
        <BrandImageLoader variant={loaderVariant} aria-label="Loading image" />
      ) : null}
      {images.map((src, i) => (
        <img
          key={`${src}-${i}`}
          ref={(el) => {
            slideRefs.current[i] = el;
          }}
          src={src}
          alt={alt}
          className={["image-crossfade__slide", imageClassName].filter(Boolean).join(" ")}
          decoding="async"
          draggable={false}
          onLoad={() => revealActiveSlide(i)}
          onClick={onImageClick}
        />
      ))}
    </div>
  );
}
