import {
  AWARDS_INTERNATIONAL,
  AWARDS_NATIONAL,
  PAST_WORKSHOPS,
  RAZA_SCHOLAR_ARTWORKS,
  RAZA_SCHOLARS,
} from "../../data/site";
import type { AwardWinnerCard, MappedProgrammes, ResidencyProgramme } from "./types";

const FALLBACK_RESIDENCY_COPY = `As an extension of the Kochi Biennale Foundation's commitment to supporting emerging artistic practices beyond the exhibition period, the Foundation hosted two of the seven recipients of the Students' Biennale Tata Trusts National Awards through the KBF Residency Programme. Held from 10 June to 10 July 2026, the month-long residency provided the artists with dedicated studio space, accommodation, mentorship, research opportunities, and the freedom to develop new bodies of work through sustained engagement with Kochi and its surrounding regions.

Centred on research, experimentation, and process-led inquiry, the residency encouraged the artists to combine studio practice with site-responsive exploration. The programme included research visits to traditional pottery and weaving communities, artist studio visits, mentorship and critique sessions, public engagements, and independent time for experimentation and material development.

Research trips facilitated and organised by KBF included studio sessions with Sujith S.N. discussions with Bony Thomas, visits to the Save the Loom initiative, and studio critiques with Jithinlal N.R. and Ashwathy Gopalkrishnan.

The artists also visited V.K. Jayan's studio, Keezhmad Khadi & Village Industries (Aluva), Chendamangalam Handloom Weavers' Cooperative Society, Parthamangalam Pottery Village (Thrissur), Commonwealth Clay Tile Factory (Feroke), and local pottery workshops and markets across Mattancherry and Fort Kochi as part of their ground research.

Although both artists engaged with similar sites and material ecologies, their research developed in distinct directions. Reppandee Lepcha explored themes of material impermanence, identity, and inherited narratives through Broken Symphony, an installation combining jute, clay, water, text, and video. Durgesh Prajapati investigated Kerala's traditional pottery practices through field research and developed works examining the relationship between geography, craft, labour, and social transformation.

The residency concluded with a public Open Studio, where both artists presented their ongoing research and works-in-progress, fostering dialogue with artists, students, curators, and the wider public. Through place-based research, experimentation, and critical exchange, the residency enabled both awardees to meaningfully expand their practices while engaging deeply with Kerala's cultural and craft landscapes.`;

const FALLBACK_GALLERY = [
  "/programmes/residency-1.jpg",
  "/programmes/residency-2.jpg",
  "/programmes/residency-3.jpg",
  "/programmes/residency-4.jpg",
  "/programmes/residency-5.jpg",
];

export const FALLBACK_RESIDENCY: ResidencyProgramme = {
  id: "national-residency-2026",
  slug: "kbf-sb-residency-sms-hall",
  title: "Students' Biennale National Residency Award Programme",
  host: "KBF",
  period: "10 June – 10 July 2026",
  venue: "SMS Hall, Mattancherry, Kochi, Kerala",
  awardees: "Reppandee Lepcha & Durgesh Prajapati",
  copy:
    "As an extension of the Kochi Biennale Foundation's commitment to supporting emerging artistic practices beyond the exhibition period, the Foundation hosted two of the seven recipients of the Students' Biennale Tata Trusts National Awards through the KBF Residency Programme. Held from 10 June to 10 July 2026,",
  description: FALLBACK_RESIDENCY_COPY,
  heroImage: "/programmes/residency-1.jpg",
  galleryImages: FALLBACK_GALLERY,
  moreHref: "/programmes/residencies",
};

function withAwardImage(
  awards: { name: string; artwork: string; institution: string; artworkId: string }[],
): AwardWinnerCard[] {
  return awards.map((award) => ({ ...award, image: "/programmes/award.jpg" }));
}

export const FALLBACK_PROGRAMMES: MappedProgrammes = {
  upcomingWorkshops: [],
  pastWorkshops: PAST_WORKSHOPS,
  awardsInternational: withAwardImage(AWARDS_INTERNATIONAL),
  awardsNational: withAwardImage(AWARDS_NATIONAL),
  raza: {
    title: "Students' Biennale 2025–26 x Beaux Arts de Marseille",
    subtitle: "te(a)m-plurality, curatorial note by GABAA",
    intro: [
      "This edition of the Students' Biennale marks a renewed commitment to international exchange through a collaboration between the Kochi Biennale Foundation and Beaux-Arts de Marseille, supported by Institut Français and the Raza Foundation. The partnership invites two Master Practice students from Beaux-Arts de Marseille to develop and present new work as part of the Students' Biennale, situating their artistic practices within the unique cultural and social contexts of the Kochi-Muziris Biennale. Their time in Kochi allows them to create, install, and refine their projects in dialogue with local environments, peers, and the wider cohort of participating student artists from across India.",
      "An open call was established among the Master Practice students from Beaux Arts de Marseille, following which a jury was conducted. The two selected artist-participants who exhibited their work at the 6th Students' Biennale edition were:",
    ],
    scholars: RAZA_SCHOLARS,
    closing: [
      "This collaboration is envisioned as a two-way exchange. Once the Students' Biennale opened, a dedicated jury selected two student artists from among the overall exhibited projects from across institutions in India to undertake a residency at Beaux-Arts de Marseille in the 2026–27 academic year. Through this reciprocal model, the programme fosters long-term artistic relationships, new pedagogical encounters, and pathways for expanded learning across geographies.",
    ],
  },
  residencies: [FALLBACK_RESIDENCY],
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
