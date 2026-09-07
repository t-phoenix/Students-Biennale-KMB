import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "../lib/motion";
import { useModalPortal } from "../lib/useModalPortal";
import { ArtworkDetailBody } from "./ArtworkDetailBody";
import { CtaLink } from "./CtaLink";
import { BrandArrow } from "./BrandArrow";
import type { ArtworkCard } from "../data/site";
import { RAZA_SCHOLAR_ARTWORKS, RAZA_SCHOLARS } from "../lib/programmes/fallbacks";
import type { RazaScholar } from "../lib/programmes/types";
import "./ScholarSpotlight.css";

type Props = {
  scholarId: string | null;
  scholars?: RazaScholar[];
  onClose: () => void;
};

function placeholderArtwork(scholar: RazaScholar): ArtworkCard {
  const known = RAZA_SCHOLAR_ARTWORKS.find((artwork) => artwork.id === scholar.id);
  if (known) {
    return {
      ...known,
      venue: known.venue?.trim() || "",
      artists: [
        {
          name: scholar.name,
          institution: known.artists[0]?.institution?.trim() || "",
        },
      ],
    };
  }
  return {
    id: scholar.id,
    title: scholar.name,
    venue: "",
    year: "2025 - 26",
    description: "",
    artists: [{ name: scholar.name, institution: "" }],
    materials: [],
    dimensions: "",
    image: scholar.image,
    images: scholar.image ? [scholar.image] : [],
  };
}

/** Raza scholar detail, shown as a spotlight rather than a routed page —
 *  full Figma 10:1193 (Kaki) / 10:1397 (Nina) content (hero, venue,
 *  materials & dimensions, description, artist) via the same
 *  ArtworkDetailBody the real artwork pages use, not a stripped-down
 *  substitute. NEXT swaps which scholar is shown in place, since there's no
 *  route to navigate to. */
export function ScholarSpotlight({ scholarId, scholars = RAZA_SCHOLARS, onClose }: Props) {
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

  const idx = scholars.findIndex((s) => s.id === activeId);
  const scholar = idx >= 0 ? scholars[idx] : undefined;
  const artwork = scholar ? placeholderArtwork(scholar) : undefined;
  const next = scholar && scholars.length > 1 ? scholars[(idx + 1) % scholars.length] : undefined;

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
        <ArtworkDetailBody artwork={artwork} />

        <div className="fig-grid scholar-spotlight__nav">
          <button
            type="button"
            className="fig-c1-3 detail__back scholar-spotlight__back-btn"
            onClick={onClose}
          >
            <BrandArrow direction="left" />
            <span>BACK</span>
          </button>
          {next ? (
            <CtaLink
              variant="next"
              lines={["NEXT"]}
              className="scholar-spotlight__next-btn"
              onClick={() => setActiveId(next.id)}
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
