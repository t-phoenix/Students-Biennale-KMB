import { useEffect, useState } from "react";
import { sampleCarouselNavTone, type CarouselNavTone } from "../lib/carouselNavTone";
import { BrandArrow } from "./BrandArrow";
import "./CarouselNavArrows.css";

type Tone = CarouselNavTone | "unknown";

type Props = {
  slideSrc: string;
  onPrev: () => void;
  onNext: () => void;
};

export function CarouselNavArrows({ slideSrc, onPrev, onNext }: Props) {
  const [prevTone, setPrevTone] = useState<Tone>("unknown");
  const [nextTone, setNextTone] = useState<Tone>("unknown");

  useEffect(() => {
    let cancelled = false;
    setPrevTone("unknown");
    setNextTone("unknown");
    (async () => {
      const [left, right] = await Promise.all([
        sampleCarouselNavTone(slideSrc, "left"),
        sampleCarouselNavTone(slideSrc, "right"),
      ]);
      if (cancelled) return;
      setPrevTone(left);
      setNextTone(right);
    })();
    return () => {
      cancelled = true;
    };
  }, [slideSrc]);

  return (
    <>
      <button
        type="button"
        className="carousel-nav carousel-nav--prev"
        data-tone={prevTone}
        aria-label="Previous slide"
        onClick={onPrev}
      >
        <BrandArrow direction="left" />
      </button>
      <button
        type="button"
        className="carousel-nav carousel-nav--next"
        data-tone={nextTone}
        aria-label="Next slide"
        onClick={onNext}
      >
        <BrandArrow direction="right" />
      </button>
    </>
  );
}
