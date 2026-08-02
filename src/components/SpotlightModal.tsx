import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "../lib/motion";
import "./SpotlightModal.css";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  labelledById?: string;
};

export function SpotlightModal({ open, title, onClose, children, labelledById }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const labelId = labelledById ?? titleId;

  useEffect(() => {
    if (!open) return;

    prevFocus.current = document.activeElement as HTMLElement | null;
    document.documentElement.dataset.spotlight = "open";
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("spotlight:change", { detail: { open: true } }));

    const panel = panelRef.current;
    const reduce = prefersReducedMotion();
    if (panel && !reduce) {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, scale: 0.97, y: 12 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.28, ease: "power2.out" }
      );
    } else if (panel) {
      gsap.set(panel, { autoAlpha: 1, scale: 1, y: 0 });
    }

    const t = window.setTimeout(() => closeRef.current?.focus(), 30);

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

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      delete document.documentElement.dataset.spotlight;
      window.dispatchEvent(new CustomEvent("spotlight:change", { detail: { open: false } }));
      prevFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="spotlight" role="presentation" data-lenis-prevent>
      <button
        type="button"
        className="spotlight__scrim"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="spotlight__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
      >
        <button
          ref={closeRef}
          type="button"
          className="spotlight__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <div className="spotlight__layout">
          <h2 id={labelId} className="spotlight__title">
            {title.split("\n").map((line, i, arr) => (
              <span key={`${line}-${i}`}>
                {line}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </h2>
          <div className="spotlight__body">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
