import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "../lib/motion";
import { useModalPortal } from "../lib/useModalPortal";
import type { UpdateCardMode } from "../lib/homeCms/updateCardLinks";
import { defaultCtaLabel } from "../lib/homeCms/updateCardLinks";
import { SpotlightModal } from "./SpotlightModal";
import "./UpdateCardSpotlight.css";

export type ActiveUpdateCard = {
  id: string;
  mode: UpdateCardMode;
  heading: string;
  body: string;
  detailBody: string | null;
  imageUrl: string | null;
  href: string | null;
  ctaLabel: string | null;
};

type Props = {
  card: ActiveUpdateCard | null;
  onClose: () => void;
  onConfirmNavigate: (card: ActiveUpdateCard) => void;
};

/** Soft default for Option 3 — digital presence / partner sites, not a scare wall. */
export const EXTERNAL_LINK_DEFAULT_MESSAGE =
  "You're about to visit a related external site. It will open in a new tab.";

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function CompactLinkModal({
  card,
  onClose,
  onConfirmNavigate,
}: {
  card: ActiveUpdateCard;
  onClose: () => void;
  onConfirmNavigate: (card: ActiveUpdateCard) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const mode = card.mode;
  const cta = (card.ctaLabel || defaultCtaLabel(mode)).trim() || defaultCtaLabel(mode);

  useModalPortal({ open: true, onClose, panelRef, initialFocusRef: closeRef });

  useEffect(() => {
    const panel = panelRef.current;
    const reduce = prefersReducedMotion();
    if (panel && !reduce) {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, scale: 0.96, y: 10 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.22, ease: "power2.out" },
      );
    } else if (panel) {
      gsap.set(panel, { autoAlpha: 1, scale: 1, y: 0 });
    }
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="update-card-dialog" role="presentation" data-lenis-prevent>
      <button
        type="button"
        className="update-card-dialog__scrim"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="update-card-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          ref={closeRef}
          type="button"
          className="update-card-dialog__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id={titleId} className="update-card-dialog__title">
          {card.heading}
        </h2>
        {card.body.trim() ? (
          <p className="update-card-dialog__body">{card.body}</p>
        ) : null}
        {mode === "external" ? (
          <p className="update-card-dialog__note">{EXTERNAL_LINK_DEFAULT_MESSAGE}</p>
        ) : null}
        {card.href ? (
          <div className="update-card-dialog__actions">
            <button type="button" className="update-card-dialog__cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="update-card-dialog__confirm"
              onClick={() => onConfirmNavigate(card)}
            >
              {cta}
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function UpdateCardSpotlight({ card, onClose, onConfirmNavigate }: Props) {
  if (!card) return null;

  if (card.mode === "content") {
    const detail = (card.detailBody || card.body || "").trim();
    const paras = paragraphs(detail);
    const split = paras.length >= 4;
    const mid = Math.ceil(paras.length / 2);

    return (
      <SpotlightModal open title={card.heading} onClose={onClose}>
        {split ? (
          <div className="spotlight__body--split">
            <div>
              {paras.slice(0, mid).map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
            <div>
              {paras.slice(mid).map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>
        ) : (
          <div className="update-card-spotlight__copy">
            {paras.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>
        )}
        {card.imageUrl ? (
          <figure className="update-card-spotlight__figure">
            <img src={card.imageUrl} alt="" loading="lazy" decoding="async" />
          </figure>
        ) : null}
      </SpotlightModal>
    );
  }

  return (
    <CompactLinkModal card={card} onClose={onClose} onConfirmNavigate={onConfirmNavigate} />
  );
}
