import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "../lib/motion";
import { useModalPortal } from "../lib/useModalPortal";
import "./SpotlightModal.css";

type Props = {
  open: boolean;
  title: string;
  attribution?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  labelledById?: string;
};

export function SpotlightModal({ open, title, attribution, onClose, children, labelledById }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const labelId = labelledById ?? titleId;

  useModalPortal({ open, onClose, panelRef, initialFocusRef: closeRef });

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

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
        <div className="spotlight__layout fig-grid">
          <div className="spotlight__label fig-c1-3">
            <h2 id={labelId} className="spotlight__title">
              {title.split("\n").map((line, i, arr) => (
                <span key={`${line}-${i}`}>
                  {line}
                  {i < arr.length - 1 ? <br /> : null}
                </span>
              ))}
            </h2>
            <div className="spotlight__title-divider" aria-hidden="true" />
            {attribution ? (
              <div className="spotlight__attribution">
                {typeof attribution === "string"
                  ? attribution.split("\n").map((line, i, arr) => (
                      <span key={`${line}-${i}`}>
                        {line}
                        {i < arr.length - 1 ? <br /> : null}
                      </span>
                    ))
                  : attribution}
              </div>
            ) : null}
          </div>
          <div className="spotlight__body fig-c4-12">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
