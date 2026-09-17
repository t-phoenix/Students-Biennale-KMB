import type Lenis from "lenis";

/** The page's single Lenis instance (set by Layout.tsx while mounted), so
 *  utilities outside the component tree — like scrollToSection.ts — can
 *  drive the same smooth-scroll loop instead of fighting it with native
 *  window.scrollTo, which produces a mismatched final rest position. */
let instance: Lenis | null = null;
const listeners = new Set<(lenis: Lenis | null) => void>();

export function setLenisInstance(lenis: Lenis | null) {
  instance = lenis;
  for (const listener of listeners) listener(lenis);
}

export function getLenisInstance(): Lenis | null {
  return instance;
}

/** Subscribe to Lenis mount/unmount. Invokes immediately with the current instance.
 *  Needed because child effects (e.g. SketchLayer) run before Layout's effect. */
export function subscribeLenis(listener: (lenis: Lenis | null) => void): () => void {
  listeners.add(listener);
  listener(instance);
  return () => {
    listeners.delete(listener);
  };
}
