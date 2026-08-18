import { useEffect, type RefObject } from "react";

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
  useEffect(() => {
    if (!open) return;

    const prevFocus = document.activeElement as HTMLElement | null;
    document.documentElement.dataset.spotlight = "open";
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("spotlight:change", { detail: { open: true } }));

    const panel = panelRef.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    const t = window.setTimeout(() => initialFocusRef?.current?.focus(), 30);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      delete document.documentElement.dataset.spotlight;
      window.dispatchEvent(new CustomEvent("spotlight:change", { detail: { open: false } }));
      prevFocus?.focus?.();
    };
  }, [open, onClose, panelRef, initialFocusRef]);
}
