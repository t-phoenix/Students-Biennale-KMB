import { useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalMotion } from "../lib/useModalMotion";
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

  const scrimRef = useRef<HTMLButtonElement>(null);
  const requestClose = useModalMotion({ open, onClose, panelRef, scrimRef });

  useModalPortal({ open, onClose: requestClose, panelRef, initialFocusRef: closeRef });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="spotlight" role="presentation" data-lenis-prevent>
      <button
        ref={scrimRef}
        type="button"
        className="spotlight__scrim"
        aria-label="Close dialog"
        onClick={requestClose}
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
          onClick={requestClose}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.67" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
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
