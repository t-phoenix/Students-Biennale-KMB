import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "../lib/motion";
import { useModalPortal } from "../lib/useModalPortal";
import { ArtworkDetailBody } from "./ArtworkDetailBody";
import { CtaLink } from "./CtaLink";
import { RAZA_SCHOLARS, RAZA_SCHOLAR_ARTWORKS } from "../data/site";
import "./ScholarSpotlight.css";

type Props = {
  scholarId: string | null;
  onClose: () => void;
};

/** Raza scholar detail, shown as a spotlight rather than a routed page —
 *  full Figma 10:1193 (Kaki) / 10:1397 (Nina) content (hero, venue,
 *  materials & dimensions, description, artist) via the same
 *  ArtworkDetailBody the real artwork pages use, not a stripped-down
 *  substitute. NEXT swaps which scholar is shown in place, since there's no
 *  route to navigate to. */
export function ScholarSpotlight({ scholarId, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [activeId, setActiveId] = useState(scholarId);

  useEffect(() => {
    if (scholarId) setActiveId(scholarId);
  }, [scholarId]);

  const open = scholarId !== null;
  useModalPortal({ open, onClose, panelRef, initialFocusRef: closeRef });

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (panel && !prefersReducedMotion()) {
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

  const idx = RAZA_SCHOLARS.findIndex((s) => s.id === activeId);
  const scholar = idx >= 0 ? RAZA_SCHOLARS[idx] : undefined;
  const artwork = scholar ? RAZA_SCHOLAR_ARTWORKS.find((a) => a.id === scholar.id) : undefined;
  const next = scholar ? RAZA_SCHOLARS[(idx + 1) % RAZA_SCHOLARS.length] : undefined;

  if (!scholar || !artwork) return null;

  return createPortal(
    <div className="scholar-spotlight" role="presentation" data-lenis-prevent>
      <button
        type="button"
        className="scholar-spotlight__scrim"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="scholar-spotlight__sheet"
        role="dialog"
        aria-modal="true"
        aria-label={scholar.name}
      >
        <button
          ref={closeRef}
          type="button"
          className="scholar-spotlight__back"
          onClick={onClose}
        >
          BACK
        </button>

        <ArtworkDetailBody artwork={artwork} />

        {next ? (
          <div className="scholar-spotlight__next">
            <CtaLink variant="next" lines={["NEXT"]} onClick={() => setActiveId(next.id)} />
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
