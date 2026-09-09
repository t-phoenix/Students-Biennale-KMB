import {
  AWARDS_INTERNATIONAL,
  AWARDS_NATIONAL,
  PAST_WORKSHOPS,
  RAZA_SCHOLAR_ARTWORKS,
  RAZA_SCHOLARS,
} from "../../data/site";
import type { AwardWinnerCard, MappedProgrammes, ResidencyProgramme, UpcomingWorkshop } from "./types";

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

const DEFAULT_INTL_AWARDS: AwardWinnerCard[] = AWARDS_INTERNATIONAL.map((w) => ({
  id: w.artworkId,
  name: w.name,
  artwork: w.artwork,
  institution: w.institution,
  artworkId: w.artworkId,
  image: "/home/thumb-awards.jpg",
  artists: [{ name: w.name, institution: w.institution }],
}));

const DEFAULT_NATIONAL_AWARDS: AwardWinnerCard[] = AWARDS_NATIONAL.map((w) => ({
  id: w.artworkId,
  name: w.name,
  artwork: w.artwork,
  institution: w.institution,
  artworkId: w.artworkId,
  image: "/home/thumb-awards.jpg",
  artists: [{ name: w.name, institution: w.institution }],
}));

const DUMMY_UPCOMING_WORKSHOPS: UpcomingWorkshop[] = [
  {
    id: "ws-1",
    slug: "sukanya-deb-delhi",
    title: "How to not answer a phone call?",
    date: "12 - 14 March 2026",
    place: "New Delhi",
    blurb: "Critical writing, voice, and conversational methodologies with Merv Espina and Sukanya Deb.",
    image: "/home/thumb-workshops.jpg",
  },
  {
    id: "ws-2",
    slug: "savyasachi-1-jaipur",
    title: "Subverting Failures: Material Experiments",
    date: "20 - 22 April 2026",
    place: "Jaipur",
    blurb: "Sculptural processes, material breakdowns, and casting with Priyesh Gothwal.",
    image: "/home/sensing-side.jpg",
  },
];

const DUMMY_RESIDENCIES: ResidencyProgramme[] = [
  {
    id: "res-1",
    slug: "marseille-exchange",
    title: "France–India Student Residency Exchange",
    host: "Beaux-Arts de Marseille & KBF",
    period: "January – April 2026",
    venue: "Marseille, France",
    awardees: "Rutuja Sonawane & Mohammad Riyaz",
    copy: "A reciprocal semester-long intensive research and studio residency in southern France.",
    description: "Supported by the French Institute in India (IFI), the Raza Foundation, and Beaux-Arts de Marseille.",
    heroImage: "/home/thumb-residencies.jpg",
    galleryImages: [
      "/home/thumb-residencies.jpg",
      "/home/sensing-wide.jpg",
      "/home/press-featured.jpg",
    ],
    moreHref: "/programmes/raza-scholarship",
  },
];

/** Local fallback programmes payload when CMS is unconfigured or has no published rows. */
export const LOCAL_FALLBACK_PROGRAMMES: MappedProgrammes = {
  upcomingWorkshops: DUMMY_UPCOMING_WORKSHOPS,
  pastWorkshops: PAST_WORKSHOPS,
  awardsInternational: DEFAULT_INTL_AWARDS,
  awardsNational: DEFAULT_NATIONAL_AWARDS,
  raza: DEFAULT_RAZA,
  residencies: DUMMY_RESIDENCIES,
};

export const EMPTY_PROGRAMMES: MappedProgrammes = LOCAL_FALLBACK_PROGRAMMES;

export { RAZA_SCHOLAR_ARTWORKS, RAZA_SCHOLARS };

/** Old mock workshop ids → live slugs, so existing links still resolve. */
export const LEGACY_WORKSHOP_IDS: Record<string, string> = {
  "phone-call": "sukanya-deb-delhi",
  "subverting-failures": "savyasachi-1-jaipur",
  "uncertainties-welcomed": "savyasachi-2-goa",
  "editing-as-meaning-making": "savyasachi-3-baroda",
  "jorahaal-forest": "anga-art-collective",
};

/** @deprecated Use LOCAL_FALLBACK_PROGRAMMES for fallback CMS state. */
export const FALLBACK_PROGRAMMES = LOCAL_FALLBACK_PROGRAMMES;

