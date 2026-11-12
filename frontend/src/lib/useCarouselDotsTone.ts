import { useEffect, useState } from "react";
import {
  sampleCarouselDotsTone,
  type CarouselDotsAlign,
  type CarouselNavTone,
} from "./carouselNavTone";
import { whenIdle } from "./preloadImages";
import "../components/CarouselDots.css";

export type CarouselDotsTone = CarouselNavTone | "unknown";

export function useCarouselDotsTone(
  slideSrc: string,
  align: CarouselDotsAlign = "right",
): CarouselDotsTone {
  const [tone, setTone] = useState<CarouselDotsTone>("unknown");

  useEffect(() => {
    let cancelled = false;
    // Keep the current tone until the new picture has been measured (no flash through "unknown").
    // Measured when the browser is free, so it never adds to the work of opening a page.
    whenIdle(() => {
      if (cancelled) return;
      sampleCarouselDotsTone(slideSrc, align).then((next) => {
        if (!cancelled) setTone(next);
      });
    }, 400);
    return () => {
      cancelled = true;
    };
  }, [slideSrc, align]);

  return tone;
}
