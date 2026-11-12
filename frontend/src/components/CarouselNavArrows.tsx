import { BrandArrow } from "./BrandArrow";
import "./CarouselNavArrows.css";

type Props = {
  /** Kept so callers need no change; the arrows no longer depend on the picture. */
  slideSrc?: string;
  onPrev: () => void;
  onNext: () => void;
};

/** Prev/next over a slideshow: always the plain white arrow. (They used to sample each picture's
 *  edge and switch between black and white, which flickered as slides changed.) */
export function CarouselNavArrows({ onPrev, onNext }: Props) {
  return (
    <>
      <button
        type="button"
        className="carousel-nav carousel-nav--prev"
        data-tone="dark"
        aria-label="Previous slide"
        onClick={onPrev}
      >
        <BrandArrow direction="left" />
      </button>
      <button
        type="button"
        className="carousel-nav carousel-nav--next"
        data-tone="dark"
        aria-label="Next slide"
        onClick={onNext}
      >
        <BrandArrow direction="right" />
      </button>
    </>
  );
}
