import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "../lib/motion";
import { useModalPortal } from "../lib/useModalPortal";
import { ArtworkDetailBody } from "./ArtworkDetailBody";
import { CtaLink } from "./CtaLink";
import type { ArtworkCard } from "../data/site";
import { RAZA_SCHOLAR_ARTWORKS, RAZA_SCHOLARS } from "../lib/programmes/fallbacks";
import type { RazaScholar } from "../lib/programmes/types";
import "./ScholarSpotlight.css";

type Props = {
  scholarId: string | null;
  scholars?: RazaScholar[];
  onClose: () => void;
};

const RAZA_LOREM =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised thanks to these sheets and more recently with desktop publishing software like Aldus PageMaker and Microsoft Word including versions of Lorem Ipsum.";

function placeholderArtwork(scholar: RazaScholar): ArtworkCard {
  const known = RAZA_SCHOLAR_ARTWORKS.find((artwork) => artwork.id === scholar.id);
  if (known) return { ...known, artists: [{ name: scholar.name, institution: known.artists[0]?.institution ?? "" }] };
  return {
    id: scholar.id,
    title: "Lorem Ipsum",
    venue: "Lorem Ipsum",
    year: "2025 - 26",
    description: `${RAZA_LOREM}\n\n${RAZA_LOREM}`,
    artists: [{ name: scholar.name, institution: "" }],
    materials: ["Lorem Ipsum | Variable", "Lorem Ipsum | Variable", "Lorem Ipsum | Variable"],
    dimensions: "Variable",
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
