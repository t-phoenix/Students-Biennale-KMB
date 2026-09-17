import { RAZA_SCHOLAR_ARTWORKS, RAZA_SCHOLARS } from "../../data/site";
import type { MappedProgrammes } from "./types";

/**
 * Hardcoded Raza scholarship copy used when the CMS has no raza programme body.
 * Scholar portrait paths under /programmes/raza-* are intentional frontend assets
 * (no dedicated CMS image fields for this block yet).
 */
export const DEFAULT_RAZA = {
  title: "RAZA - STUDENTS' BIENNALE SCHOLARSHIP",
  subtitle: "STUDENTS’ BIENNALE 2025–26 X BEAUX ARTS DE MARSEILLE",
  intro: [
    "The 2025-26 edition marked the launch of a new, first-of-its-kind collaborative exchange between the Students' Biennale and Beaux-Arts de Marseille; a two-phase, reciprocal residency model designed to build sustained artistic dialogue between India and France.",
    "In the first phase, Kaki Weiss and Nina Durel, selected through an open call at Beaux-Arts de Marseille, travelled to Kochi for a two-week residency from 1-15 December 2025, supported jointly by the French Institute in India (IFI), the Kochi Biennale Foundation, and Beaux-Arts de Marseille. During their residency, they created new work in dialogue with the city and the wider cohort of participating student artists, which was exhibited as part of the 2025-26 Students' Biennale.",
  ],
  scholars: RAZA_SCHOLARS,
  closing: [
    "The exchange then turned outward: from among the participants of the Students' Biennale, two Indian artists were selected for a fully-funded, residency-like semester in Marseille — the second and reciprocal half of the exchange. Following a rigorous two-month selection process by an independent jury, Rutuja Sonawane and Mohammad Riyaz were chosen from among 183 participants in the 2025-26 edition. Supported by IFI, the Raza Foundation, and Beaux-Arts de Marseille, this second phase has come to be known as the Raza-Students' Biennale Scholarship.",
    "Together, these two phases form a complete, reciprocal cycle of exchange and in doing so, the programme aims to establish an ongoing structure for mobility, research, and cross-cultural learning ensuring the Students' Biennale's reach extends well beyond Kochi.",
  ],
};

/** Empty programmes payload — CMS is the only source for workshops/residencies/awards media. */
export const EMPTY_PROGRAMMES: MappedProgrammes = {
  upcomingWorkshops: [],
  pastWorkshops: [],
  awardsInternational: [],
  awardsNational: [],
  raza: DEFAULT_RAZA,
  residencies: [],
};

/** @deprecated Prefer EMPTY_PROGRAMMES. */
export const LOCAL_FALLBACK_PROGRAMMES = EMPTY_PROGRAMMES;
/** @deprecated Prefer EMPTY_PROGRAMMES. */
export const FALLBACK_PROGRAMMES = EMPTY_PROGRAMMES;

export { RAZA_SCHOLAR_ARTWORKS, RAZA_SCHOLARS };

/** Old mock workshop ids → live slugs, so existing links still resolve. */
export const LEGACY_WORKSHOP_IDS: Record<string, string> = {
  "ws-1": "sukanya-deb-delhi",
  "ws-2": "savyasachi-1-jaipur",
};
