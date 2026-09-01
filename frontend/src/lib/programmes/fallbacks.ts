import { RAZA_SCHOLAR_ARTWORKS, RAZA_SCHOLARS } from "../../data/site";
import type { MappedProgrammes } from "./types";

/** Empty programmes payload when CMS has no published rows. */
export const EMPTY_PROGRAMMES: MappedProgrammes = {
  upcomingWorkshops: [],
  pastWorkshops: [],
  awardsInternational: [],
  awardsNational: [],
  raza: {
    title: "",
    subtitle: "",
    intro: [],
    scholars: [],
    closing: [],
  },
  residencies: [],
};

export { RAZA_SCHOLAR_ARTWORKS, RAZA_SCHOLARS };

/** Old mock workshop ids → live slugs, so existing links still resolve. */
export const LEGACY_WORKSHOP_IDS: Record<string, string> = {
  "phone-call": "sukanya-deb-delhi",
  "subverting-failures": "savyasachi-1-jaipur",
  "uncertainties-welcomed": "savyasachi-2-goa",
  "editing-as-meaning-making": "savyasachi-3-baroda",
  "jorahaal-forest": "anga-art-collective",
};

/** @deprecated Use EMPTY_PROGRAMMES for empty CMS state. Kept for tests/migration only. */
export const FALLBACK_PROGRAMMES = EMPTY_PROGRAMMES;
