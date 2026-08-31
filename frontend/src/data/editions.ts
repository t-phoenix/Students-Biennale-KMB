import editionSearchTagsData from "./edition-search-tags.json";
import { ARTISTS, LATEST_EDITION, PREVIOUS_EDITIONS } from "./site";
import type { SearchIndexEntry } from "../lib/catalogue/types";

export const EDITION_SHORT = `The Students Biennale 2025-26 was realised by bringing together  70 projects under 4 artist duos and and 3 artist's collectives taking on 7 curatorial frameworks which culminates into one exhibition. The programme has successfully been able to achieve this with the participation of more than 200 student artists selected from over 150+ art institutions across the country.

The programme emphasises on collaborative learning, student-led curatorial agency, and interdisciplinary methodologies. Rather than functioning as a static exhibition, the Students' Biennale operates as an evolving framework that facilitates dialogue, experimentation, and collective knowledge production, contributing to the development of emerging practitioners and alternative pedagogical models within contemporary art education.  Artistic works draw upon material practices, embodied knowledge systems, everyday objects, and technological experimentation to reflect on lived experience and systems of power.`;

export const EDITION_MORE = `The 2025-26 Students' Biennale programme has emerged under the curatorial mentorship, workshops and reviews by mid-career curators with regional and international experience. These seven curatorial teams comprise of 4 artistic duos - Ashok Vish & Chinar Shah (Karnataka & Telangana), Khursheed Ahmad & Salman Bashir Baba (Himalayan Belt), Savyasachi Anju Prabir & Sukanya Deb (Gujarat, Goa, Rajasthan, Punjab, Delhi, Haryana) Seethal CP & Sudheesh Kottembram (Kerala, Tamil Nadu, Andhra Pradesh) and 3 artists collective -  Anga Art Collective (North eastern states), GABAA (West Bengal, Orissa, Uttar Pradesh, Chhattisgarh) & Secular Art Collective (Maharashtra, Bihar, Jharkhand, Madhya Pradesh).

This edition, titled 'Sensing Grounds' invited students to present ideas, works that are still underprogress, collaborations, and finished works along with material developed during the workshops, resulting in a total of 70 projects. The Students' Biennale opened to the public on Dec 13th 2025 and remained on display until 31st March 2026 across 6 venues in Fort Kochi: Vallabhdas Kanji Ltd. (VKL) Warehouse, BMS Warehouse, Arthshila Kochi, St. Andrews Parish Hall, Space Gallery, and David Hall.`;

/** Sensing Grounds curatorial note — Figma "Sensing GRound" (2:2), the framework
 *  statement for the 2025-26 edition as a whole (GABAA, te(a)m-plurality). */
export const SENSING_GROUNDS_NOTE = {
  title: "Sensing Grounds",
  attribution: "te(a)m-plurality, curatorial note by GABAA",
  paragraphs: [
    "The imagination for the sixth edition of the Students' Biennale was to engage with students and circumstances—to perceive the world not from fixed, inherited positions, but through the fragile, shifting, and often contested sites where bodies, materials, and conditions converge with institutions. Instead of seeking a linear, singular narrative, the exhibition suggests a mode in which the act of sensing is political, and in many cases, collective. The grounds it proposes are never fixed. They are lived, negotiated, and continually remade. We recognise the Students' Biennale as an uneven landscape shaped through proximities between the domestic and the public, extraction and resistance, reality and speculation. Shrinking public space, institutional hierarchies, peripherality, and environmental precarity challenge our personal and community spaces. We hope to inhabit their tensions intimately. From the Western Himalayas' fragile ecosystems to the extractive urgencies of Northeast India and the pressures within art institutions in Karnataka, Telangana, and beyond, students and collectives attend to the material and emotional realities of their worlds. The works affirm sensing as an active enquiry, supple with defiance, and nourished with care.",
    "It is the \u201Ctrembling, (shifting) space\u201D where disobedient practices challenge and unsettle entrenched forms of authority. Here, craft, oral and embodied histories, domestic objects, and experiments with technology become methods of thinking otherwise. These gestures translate and transform space, instead of just occupying it. The pedagogical exercises also suggest the \u201Cundercommons\u201D as shaped by negotiation, plurality, and mutual learning. \u201CStudents curate themselves; curators become collaborators\u201D. Making, labour, vulnerability, and urgency converge in these spaces, and practices become ways of sensing what has been rendered invisible: structures of power, ecological loss, and the quiet endurance embedded in everyday life. The notes speak of the contingent, the partial, the ongoing. To sense the ground is to understand its instability in recognising each gesture of translation, each act of resistance, each fragment of lived experience that reshapes landscapes. The Students' Biennale thus becomes not a fixed exhibition, but a shared, shifting ground where new forms of relation, belonging, and imagination can take hold.",
  ],
};

/** Each column is a list of [role, ...people]. */
export const TEAM_COLS: readonly (readonly (readonly string[])[])[] = [
  [
    ["Director of Programmes", "Mario D'Souza"],
    ["Programme Managers", "Mashoor Ali M", "Ananthan Suresh", "Rebecca Martin"],
    ["Programmes Assistants", "Nikhita Thevanoor", "Maanav Jalan"],
  ],
  [
    ["Production Managers", "Harshada Vijay", "DC Charan"],
    ["Production Assistants", "Hiran Unnikrishnan", "Niyas Issahak"],
    ["Accounts Manager", "Anzil Muhammed K"],
  ],
  [
    ["Social Media and Catalogue", "Mishal MA"],
    ["Web Design and Services", "Abhinil Agarwal", "Anand Peter", "Prajesh MP", "Vishnulal CR"]
  ],
];

export type EditionOverviewData = {
  id: string;
  title: string;
  subtitle: string;
  /** Body paragraphs; empty when the edition has no written record yet. */
  intro: string[];
  team: readonly (readonly (readonly string[])[])[];
  institutions: string[];
  /** Full-bleed hero image when available. */
  heroImage?: string;
  /** Cover carousel frames (3–5); falls back to [heroImage] when omitted. */
  heroImages?: string[];
  /** Gallery images (Figma shows two rows of four). */
  galleryImages: string[];
  /** Year id of the edition that follows this one, for the trailing CTA. */
  nextId?: string;
  /** Year id of the older edition that precedes this one, for the back link. */
  prevId?: string;
};

/**
 * 2014-15 — the inaugural edition, from Figma "Previous Editions Page" (1:2100).
 * The curator/advisor lists are one run-on text node in the source with no
 * delimiters between names; they're split here on likely name boundaries and
 * should be spot-checked against the original credits before publishing.
 */
const EDITION_2014_INTRO = `The inaugural Students' Biennale was presented from 13 December 2014 to 29 March 2015 as part of the Second Kochi-Muziris Biennale, marking the beginning of what has since become the Kochi Biennale Foundation's largest and most far-reaching educational initiative. Conceived under the Foundation's Higher Education Programme in collaboration with the Foundation for Indian Contemporary Art (FICA) and the Foundation for Indian Art Education (FIAE), the Students' Biennale was established to create an alternative platform for students from art institutions across India to reflect on their practices, engage in critical dialogue, and present their work within the context of an international contemporary art exhibition.

From its inception, the Students' Biennale has pursued a dual objective: to examine the diverse conditions of art education and pedagogy across India while simultaneously introducing emerging artists to the wider discursive and professional ecosystem of the Kochi-Muziris Biennale. By situating student practices within an international exhibition framework, the programme sought to foster new forms of exchange between young practitioners, educators, curators, and audiences.

The first edition brought together more than 100 works by students from 37 art institutions spanning the country, including schools in Srinagar, Jabalpur, Visakhapatnam, Thrissur, Imphal, Bhubaneswar, Mysore, among many others. The participating institutions reflected the breadth of India's art education landscape from colonial-era academies established over 150 years ago, to institutions founded in the years following Independence as part of the nation's cultural development, as well as newer schools established over the past few decades.

The selection process itself became a significant pedagogical undertaking. A team of 15 emerging curators travelled extensively across India over a period of three months, visiting art schools, engaging with students and faculty, and developing an understanding of the varied contexts in which artistic practices were being nurtured. Conceived as a process of peer learning, these visits encouraged dialogue rather than evaluation, allowing each curator to respond independently to the questions, urgencies, and possibilities they encountered.

The research revealed the diverse realities of art education across the country ranging from infrastructural limitations and institutional challenges to the remarkable resilience, commitment, and creativity demonstrated by students working within these conditions. Rather than presenting a singular narrative, the exhibition emerged as an open-ended and discursive proposition that embraced multiple perspectives, temporalities, and regional contexts, reflecting the complexity of what it means to produce contemporary art in India.

Hosted across two venues namely, Mohammed Ali Warehouse and KVA Brothers in Mattancherry, the inaugural Students' Biennale established a new model for artistic learning and exchange. It demonstrated the potential of the Biennale as a site for education as much as exhibition, creating meaningful opportunities for students to engage with national and international audiences while building lasting networks across institutions.

The first edition laid the foundation for a programme that has continued to evolve through subsequent editions, expanding beyond exhibitions to include workshops, residencies, mentorships, awards, and other initiatives that support emerging artists. More than an exhibition, the Students' Biennale began an ongoing process of collective engagement with students, educators, and institutions – one that continues to shape contemporary art education in India today.`;

const EDITION_2014_TEAM: readonly (readonly (readonly string[])[])[] = [
  [
    [
      "Curators",
      "Faiza Hasan",
      "Sumaiya Raza Khan",
      "Krupa Desai",
      "Charu Maithani",
      "Parni Ray",
      "Arko Datto",
      "Lina Vincent",
      "Pallavi Paul",
      "Jigna Padhiar",
      "Pranamita Borgohain",
      "Aryakrishnan Ramakrishnan",
      "Anannya Mehtta",
      "Sachin",
      "Vaishnavi Ramnathan",
      "Geetika Arora",
    ],
  ],
  [
    ["Curatorial Advisor", "Vidya Shivadas"],
    ["Project Advisor", "Suresh Jayaram"],
    ["Director of Programmes", "Riyas Komu"],
    ["Programme Coordinator", "Sananda Mukhopadhyay"],
  ],
  [
    [
      "Advisors",
      "Bose Krishnamachari",
      "Jitish Kallat",
      "Belinder Dhanoa",
      "Jeebesh Bagchi",
      "Shukla Sawant",
      "Sarada Natarajan",
      "Vivan Sundaram",
      "Sanjeev Mirchandani",
      "Indrapramit Roy",
      "Sudhir Patwardhan",
      "Aveek Sen",
      "Prateek Raja",
      "Priyanka Raja",
      "R Siva Kumar",
      "Sanchayan Ghosh",
      "B V Suresh",
    ],
  ],
];

const EDITION_2014_INSTITUTIONS = [
  "Govt. Institute of Fine Arts, Indore",
  "Sir J.J. School of Art, Mumbai",
  "Bhartiya Kala Mahavidyalaya, Pune University",
  "Goa College of Art, Panaji",
  "College of Fine Arts, Karnataka Chitrakala Parishath, Bengaluru",
  "Department of Visual Arts, Bangalore University, Bengaluru",
  "College of Art, Delhi",
  "School of Culture and Creative Expressions, Ambedkar University, Delhi",
  "Government College of Fine Arts, Thrissur",
  "RLV (Radha Lakshmi Vilasam) College of Music and Fine Arts, Tripunithura",
  "Institute of Music and Fine Arts, University of Kashmir, Srinagar",
  "Faculty of Visual Arts, Banaras Hindu University",
  "Department of Fine Arts, Aligarh Muslim University",
  "College of Fine Arts, JNA&FAU, Hyderabad",
  "Department of Fine Arts, Andhra University, Visakhapatnam",
  "Department of Fine Arts, Sarojini Naidu School of Arts and Communication, University of Hyderabad",
  "Government College of Art, Chandigarh",
  "Government College of Fine Arts, Jabalpur",
  "Imphal Art College, Manipur",
  "Department of Fine Arts, Tripura University",
  "Department of Visual Arts, Assam University",
  "Kala Bhavan, Visva-Bharati University, Santiniketan",
  "Govt. College of Arts and Crafts, Kolkata",
  "Faculty of Fine Arts, Rabindra Bharati University, Kolkata",
  "Government College of Art and Crafts, Assam",
  "Government College of Art and Crafts, Khallikote (Ganjam), Odisha",
  "B.K. College of Art & Crafts, Bhubaneswar",
  "Institute of Music & Fine Arts, Jammu",
  "Faculty of Fine Arts, Jamia Milia Islamia, New Delhi",
  "College of Arts and Crafts, Patna",
  "Rajasthan School of Art, Jaipur",
  "Faculty of Fine Arts, Maharaja Sayajirao University of Baroda",
  "Chamarajendra Academy of Visual Arts, Mysore",
  "College of Fine Arts, Thiruvananthapuram",
  "Raja Ravi Varma College of Fine Arts, Mavelikara",
  "Department of Fine Arts, Sree Sankaracharya University of Sanskrit, Kalady",
  "Government College of Fine Arts, Kumbakonam",
];

const EDITION_2014_GALLERY = [
  "/editions/2014-15/workshop-1.jpg",
  "/editions/2014-15/workshop-2.jpg",
  "/editions/2014-15/workshop-3.jpg",
  "/editions/2014-15/workshop-4.jpg",
  "/editions/2014-15/workshop-5.jpg",
  "/editions/2014-15/workshop-6.jpg",
  "/editions/2014-15/workshop-7.jpg",
  "/editions/2014-15/workshop-8.jpg",
];

const EDITION_2014_VENUES = ["Mohammed Ali Warehouse", "KVA Brothers"];

const ALL_EDITIONS = [LATEST_EDITION.id, ...PREVIOUS_EDITIONS];

/** Unique participating institutions, taken from the artist records we hold. */
function institutionsForLatest(): string[] {
  return [...new Set(ARTISTS.map((a) => a.institution))].sort((a, b) => a.localeCompare(b));
}

/** Short searchable names for sparse previous editions (no long-form prose). */
export type EditionSearchTags = {
  curators: string[];
  artists: string[];
  artworks: string[];
  venues: string[];
  institutions: string[];
  title: string;
};

function namesFromTeam(
  team: readonly (readonly (readonly string[])[])[],
  roles: string[],
): string[] {
  const want = new Set(roles.map((r) => r.toLowerCase()));
  const out: string[] = [];
  for (const col of team) {
    for (const row of col) {
      const [role, ...people] = row;
      if (!role || !want.has(role.toLowerCase())) continue;
      for (const person of people) {
        if (person) out.push(person);
      }
    }
  }
  return out;
}

export function getEditionSearchTags(yearId: string): EditionSearchTags {
  const fromJson = (editionSearchTagsData as Record<string, EditionSearchTags & { title: string }>)[
    yearId
  ];
  if (fromJson) {
    return {
      title: fromJson.title || "Students' Biennale",
      curators: fromJson.curators ?? [],
      artists: fromJson.artists ?? [],
      artworks: fromJson.artworks ?? [],
      venues: fromJson.venues ?? [],
      institutions: fromJson.institutions ?? [],
    };
  }
  if (yearId === "2014-15") {
    return {
      title: "Students' Biennale",
      curators: namesFromTeam(EDITION_2014_TEAM, [
        "Curators",
        "Curatorial Advisor",
        "Project Advisor",
        "Director of Programmes",
        "Programme Coordinator",
        "Advisors",
      ]),
      artists: [],
      artworks: [],
      venues: [...EDITION_2014_VENUES],
      institutions: [...EDITION_2014_INSTITUTIONS],
    };
  }
  return {
    title: "Students' Biennale",
    curators: [],
    artists: [],
    artworks: [],
    venues: [],
    institutions: [],
  };
}

/** Build a compact search_index from short edition tags (client-side bridge). */
export function searchIndexFromTags(yearId: string, tags: EditionSearchTags): SearchIndexEntry[] {
  const route = `/editions/${yearId}`;
  const entries: SearchIndexEntry[] = [
    {
      entity_type: "edition",
      entity_id: `edition-${yearId}`,
      title: tags.title,
      subtitle: `Students' Biennale ${yearId}`,
      route,
      field_title: tags.title,
      field_curator: tags.curators.join(", ") || undefined,
      field_artist: tags.artists.join(", ") || undefined,
      field_venue: tags.venues.join(", ") || undefined,
      field_institution: tags.institutions.join(", ") || undefined,
      field_edition: yearId,
    },
  ];
  for (const name of tags.curators) {
    entries.push({
      entity_type: "person",
      entity_id: `credit-curator-${yearId}-${name}`,
      title: name,
      subtitle: `Curator · ${yearId}`,
      route,
      field_title: name,
      field_curator: name,
      field_edition: yearId,
    });
  }
  for (const name of tags.artists) {
    entries.push({
      entity_type: "person",
      entity_id: `credit-artist-${yearId}-${name}`,
      title: name,
      subtitle: `Artist · ${yearId}`,
      route,
      field_title: name,
      field_artist: name,
      field_edition: yearId,
    });
  }
  for (const name of tags.venues) {
    entries.push({
      entity_type: "venue",
      entity_id: `credit-venue-${yearId}-${name}`,
      title: name,
      subtitle: `Venue · ${yearId}`,
      route,
      field_title: name,
      field_venue: name,
      field_edition: yearId,
    });
  }
  for (const name of tags.artworks) {
    entries.push({
      entity_type: "artwork",
      entity_id: `credit-artwork-${yearId}-${name}`,
      title: name,
      subtitle: `Independent project · ${yearId}`,
      route,
      field_title: name,
      field_artist: name,
      field_edition: yearId,
    });
  }
  for (const name of tags.institutions) {
    entries.push({
      entity_type: "institution",
      entity_id: `credit-institution-${yearId}-${name}`,
      title: name,
      subtitle: `Institution · ${yearId}`,
      route,
      field_title: name,
      field_institution: name,
      field_edition: yearId,
    });
  }
  return entries;
}

export function getEditionOverview(yearId: string): EditionOverviewData {
  const index = ALL_EDITIONS.indexOf(yearId);
  // Editions are listed newest-first, so the "next" (newer) edition is index - 1,
  // and the "previous" (older) edition is index + 1.
  const nextId = index > 0 ? ALL_EDITIONS[index - 1] : undefined;
  const prevId = index >= 0 && index < ALL_EDITIONS.length - 1 ? ALL_EDITIONS[index + 1] : undefined;
  const isLatest = yearId === LATEST_EDITION.id;
  const isInaugural = yearId === "2014-15";

  if (isInaugural) {
    return {
      id: yearId,
      title: "Students' Biennale",
      subtitle: "Inaugural Edition (2014 - 15)",
      intro: EDITION_2014_INTRO.split("\n\n"),
      team: EDITION_2014_TEAM,
      institutions: EDITION_2014_INSTITUTIONS,
      heroImage: "/editions/2014-15/hero.jpg",
      heroImages: ["/editions/2014-15/hero.jpg"],
      galleryImages: EDITION_2014_GALLERY,
      nextId,
      prevId,
    };
  }

  return {
    id: yearId,
    title: "Students' Biennale",
    subtitle: isLatest ? "2025–26" : yearId.replace("-", "–"),
    intro: isLatest
      ? [EDITION_SHORT, EDITION_MORE].join("\n\n").split("\n\n")
      : [
          "Catalogue records for this edition are forthcoming. Explore neighbouring editions from the Previous Editions rail, or continue to the next edition when available.",
        ],
    team: isLatest ? TEAM_COLS : [],
    institutions: isLatest ? institutionsForLatest() : [],
    galleryImages: isLatest ? [] : [],
    nextId,
    prevId,
  };
}
