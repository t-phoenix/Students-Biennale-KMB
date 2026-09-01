import { useEffect, useState } from "react";
import {
  sampleCarouselDotsTone,
  type CarouselDotsAlign,
  type CarouselNavTone,
} from "./carouselNavTone";
import "../components/CarouselDots.css";

export type CarouselDotsTone = CarouselNavTone | "unknown";

export function useCarouselDotsTone(
  slideSrc: string,
  align: CarouselDotsAlign = "right",
): CarouselDotsTone {
  const [tone, setTone] = useState<CarouselDotsTone>("unknown");

  useEffect(() => {
    let cancelled = false;
    setTone("unknown");
    sampleCarouselDotsTone(slideSrc, align).then((next) => {
      if (!cancelled) setTone(next);
    });
    return () => {
      cancelled = true;
    };
  }, [slideSrc, align]);

  return tone;
}
