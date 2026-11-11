import { useCallback, useEffect, useRef, type RefObject } from "react";
import { bindPullToDismiss } from "./gesture";
import { DISTANCE, DUR, EASE, EXIT, gsap, prefersReducedMotion } from "./motion";

type Options = {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLElement | null>;
  scrimRef: RefObject<HTMLElement | null>;
};

/** Shared overlay choreography. Scrim fades, panel scales and rises in, and
 *  `requestClose` plays a faster exit before calling `onClose`. Asking to close
 *  again while the exit runs closes immediately, so input is never blocked. */
export function useModalMotion({ open, onClose, panelRef, scrimRef }: Options) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closingRef = useRef(false);

  const killTweens = useCallback(() => {
    gsap.killTweensOf([panelRef.current, scrimRef.current].filter(Boolean));
  }, [panelRef, scrimRef]);

  useEffect(() => {
    if (!open) return;
    closingRef.current = false;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (prefersReducedMotion()) {
      if (panel) gsap.set(panel, { autoAlpha: 1, scale: 1, y: 0 });
      if (scrim) gsap.set(scrim, { autoAlpha: 1 });
      return;
    }
    if (scrim) {
      gsap.fromTo(
        scrim,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: DUR.base, ease: EASE.enter },
      );
    }
    if (panel) {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, scale: 0.97, y: DISTANCE.sm },
        { autoAlpha: 1, scale: 1, y: 0, duration: DUR.slow, ease: EASE.enterSoft },
      );
    }
    return killTweens;
  }, [open, panelRef, scrimRef, killTweens]);

  const requestClose = useCallback(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (closingRef.current || prefersReducedMotion() || (!panel && !scrim)) {
      killTweens();
      onCloseRef.current();
      return;
    }
    closingRef.current = true;
    killTweens();
    const tl = gsap.timeline({ onComplete: () => onCloseRef.current() });
    if (panel) {
      // A panel already pulled down keeps going the way it was travelling.
      const pulled = Number(gsap.getProperty(panel, "y")) || 0;
      tl.to(
        panel,
        {
          autoAlpha: 0,
          scale: 0.98,
          y: pulled > DISTANCE.sm ? pulled + DISTANCE.md * 4 : DISTANCE.sm,
          duration: EXIT.duration,
          ease: EXIT.ease,
        },
        0,
      );
    }
    if (scrim) {
      tl.to(scrim, { autoAlpha: 0, duration: EXIT.duration, ease: EXIT.ease }, 0);
    }
  }, [panelRef, scrimRef, killTweens]);

  // On touch, pulling down from the top of the content closes the modal.
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    return bindPullToDismiss({ sheet: panel, backdrop: scrimRef.current, onDismiss: requestClose });
  }, [open, panelRef, scrimRef, requestClose]);

  return requestClose;
}
