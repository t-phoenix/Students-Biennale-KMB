import "./BrandArrow.css";

export type BrandArrowDirection = "right" | "left" | "down" | "up";

export interface BrandArrowProps {
  direction?: BrandArrowDirection;
  className?: string;
  size?: number;
}

/**
 * Canonical Students' Biennale chevron arrow illustration.
 * Rotates cleanly around center (26, 26) with uniform bounding box across all orientations:
 * - "right": points Right (0deg) — Next / Explore Edition
 * - "down": points Down (90deg) — View More
 * - "left": points Left (180deg) — Back / Prev
 * - "up": points Up (-90deg) — View Less / Collapse
 */
export function BrandArrow({ direction = "right", className = "", size = 46 }: BrandArrowProps) {
  const rotation = {
    right: 0,
    down: 90,
    left: 180,
    up: -90,
  }[direction];

  return (
    <svg
      className={`brand-arrow brand-arrow--${direction} ${className}`.trim()}
      viewBox="0 0 52 52"
      fill="none"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g transform={`rotate(${rotation} 26 26) translate(10.4 0)`}>
        <path d="M31.2148 22.4236V24.4539L0 40.7847V38.7527L31.2148 22.4236Z" fill="currentColor" />
        <path d="M21.824 17.0277L19.8848 18.042L17.9418 17.026L0 7.64057V5.60852L19.8829 16.0117L21.824 17.0277Z" fill="currentColor" />
        <path d="M31.2148 28.0303V30.0623L0 46.3932V44.3612L31.2148 28.0303Z" fill="currentColor" />
        <path d="M16.4652 19.8312L14.5241 20.8455L12.583 19.8312L0 13.2474V11.2172L14.5241 18.8152L16.4652 19.8312Z" fill="currentColor" />
        <path d="M31.2148 33.6389V35.671L0 52.0001V49.968L31.2148 33.6389Z" fill="currentColor" />
        <path d="M11.1063 22.6345L9.16521 23.6506L7.22222 22.6345L0 18.8559V16.8239L9.16521 21.6185L11.1063 22.6345Z" fill="currentColor" />
        <path d="M31.2148 16.3309V18.8452L0 35.1779V33.1458L29.7362 17.5881L0 2.03205V0L31.2148 16.3309Z" fill="currentColor" />
      </g>
    </svg>
  );
}
