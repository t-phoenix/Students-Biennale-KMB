import { useEffect, useRef, type RefObject } from "react";

type Options = {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

/** Shared portal-modal plumbing: scroll lock, focus trap + restore, Escape-to-close,
 *  and the `spotlight:change` event other parts of the app (Layout.tsx) listen for
 *  to suspend smooth-scroll while any full-screen overlay is open. */
export function useModalPortal({ open, onClose, panelRef, initialFocusRef }: Options) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const initialFocusRef_ = useRef(initialFocusRef);
  initialFocusRef_.current = initialFocusRef;
  const panelRef_ = useRef(panelRef);
  panelRef_.current = panelRef;

  useEffect(() => {
    if (!open) return;

    const prevFocus = document.activeElement as HTMLElement | null;
    document.documentElement.dataset.spotlight = "open";
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("spotlight:change", { detail: { open: true } }));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      const panel = panelRef_.current?.current;
      if (e.key !== "Tab" || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);

    const t = window.setTimeout(() => {
      initialFocusRef_.current?.current?.focus({ preventScroll: true });
    }, 30);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      delete document.documentElement.dataset.spotlight;
      window.dispatchEvent(new CustomEvent("spotlight:change", { detail: { open: false } }));
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [open]);
}
