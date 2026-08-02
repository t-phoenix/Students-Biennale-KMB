import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenisInstance(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenisInstance() {
  return instance;
}

/** Smooth ease-out for Lenis scrolling */
export function snapEase(t: number) {
  return 1 - Math.pow(1 - t, 5);
}
