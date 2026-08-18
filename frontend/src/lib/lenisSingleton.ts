import type Lenis from "lenis";

/** The page's single Lenis instance (set by Layout.tsx while mounted), so
 *  utilities outside the component tree — like scrollToSection.ts — can
 *  drive the same smooth-scroll loop instead of fighting it with native
 *  window.scrollTo, which produces a mismatched final rest position. */
let instance: Lenis | null = null;

export function setLenisInstance(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenisInstance(): Lenis | null {
  return instance;
}
