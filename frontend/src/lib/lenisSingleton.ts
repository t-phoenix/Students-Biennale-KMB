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

/**
 * Long programmatic scrolls, calmly, on every device. Gliding the whole distance
 * sends screens of content racing past (on Home, across the hero), which strobes
 * on phones. So a long trip first cuts to one screen short of the target, then
 * glides the rest at a moderate speed that settles gently.
 */
export function glideTo(
  target: number,
  options: { onComplete?: () => void; reduced?: boolean; duration?: number } = {},
) {
  const lenis = instance;
  // The browser's own position: the smooth-scroll value can lag behind it.
  const from = window.scrollY;
  const screen = window.innerHeight;
  if (options.reduced) {
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo(0, target);
    options.onComplete?.();
    return;
  }
  const far = Math.abs(target - from) > screen * 1.5;
  const near = target + Math.sign(from - target) * screen;
  if (!lenis) {
    if (far) window.scrollTo(0, near);
    window.scrollTo({ top: target, behavior: "smooth" });
    options.onComplete?.();
    return;
  }
  if (far) lenis.scrollTo(near, { immediate: true, force: true });
  lenis.scrollTo(target, {
    duration: options.duration ?? 0.8,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
    force: true,
    lock: false,
    onComplete: () => options.onComplete?.(),
  });
}

/** Back to the top of the page, calmly. */
export function glideToTop(options: { onComplete?: () => void; reduced?: boolean } = {}) {
  glideTo(0, options);
}
