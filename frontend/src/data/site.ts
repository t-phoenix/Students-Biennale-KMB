export const LATEST_EDITION = { id: "2025-26", label: "Students' Biennale 2025–26" };

export const PREVIOUS_EDITIONS = [
  "2022-23",
  "2020-21",
  "2018-19",
  "2016-17",
  "2014-15",
] as const;

export const EDITIONS_PATH = `/editions/${LATEST_EDITION.id}/curators`;

export type CanvasItem = {
  id: string;
  kind: "curator" | "artist" | "artwork" | "venue";
  name: string;
  meta: string;
  image?: string;
  bio?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const SAMPLE: Omit<CanvasItem, "x" | "y" | "width" | "height">[] = [
  {
    id: "aw-absence",
    kind: "artwork",
    name: "What absence carries",
    meta: "VKL Warehouse",
    bio: "Traces the quiet terrain where memory, grief and body entwine through soft sculptures, drawings and stitched traces.",
  },
  {
    id: "aw-rubble",
    kind: "artwork",
    name: "The quiet beneath the rubble",
    meta: "VKL Warehouse",
  },
  {
    id: "aw-panic",
    kind: "artwork",
    name: "A warm kind of panic",
    meta: "BMS Warehouse",
  },
  {
    id: "aw-house",
    kind: "artwork",
    name: "The house that remembers",
    meta: "BMS Warehouse",
  },
  {
    id: "aw-blind",
    kind: "artwork",
    name: "Blind Command A4 Collective",
    meta: "St. Andrews Parish Hall",
  },
  {
    id: "aw-residual",
    kind: "artwork",
    name: "Residual Marks",
    meta: "VKL Warehouse",
  },
  {
    id: "cu-gabaa",
    kind: "curator",
    name: "GABAA",
    meta: "te(a)m-plurality · Sensing Grounds",
  },
  {
    id: "cu-anga",
    kind: "curator",
    name: "Anga Art Collective",
    meta: "North Eastern states",
  },
  {
    id: "ar-ananya",
    kind: "artist",
    name: "Ananya Gautam",
    meta: "National Institute of Design, Ahmedabad",
  },
  {
    id: "ar-annanya",
    kind: "artist",
    name: "Annanya Dhanda",
    meta: "The Maharaja Sayajirao University, Baroda",
  },
  {
    id: "vn-vkl",
    kind: "venue",
    name: "VKL Warehouse",
    meta: "Fort Kochi",
  },
  {
    id: "vn-bms",
    kind: "venue",
    name: "BMS Warehouse",
    meta: "Fort Kochi",
  },
];

const WIDTHS = [280, 320, 360, 420, 480];
const SEED_W = 2200;
const GAP = 16;

function pack(items: typeof SAMPLE): CanvasItem[] {
  let x = GAP;
  let y = GAP;
  let rowH = 0;
  return items.map((item, i) => {
    const width = WIDTHS[i % WIDTHS.length];
    const height = Math.round(width * (0.65 + (i % 3) * 0.12));
    if (x + width + GAP > SEED_W) {
      x = GAP;
      y += rowH + GAP;
      rowH = 0;
    }
    const placed = { ...item, x, y, width, height };
    x += width + GAP;
    rowH = Math.max(rowH, height);
    return placed;
  });
}

let pool: CanvasItem[] | null = null;

export function getCanvasPool(): CanvasItem[] {
  if (!pool) pool = pack(SAMPLE);
  return pool;
}

export function getCanvasSeedSize() {
  const items = getCanvasPool();
  let width = SEED_W;
  let height = 800;
  for (const item of items) {
    width = Math.max(width, item.x + item.width + GAP);
    height = Math.max(height, item.y + item.height + GAP);
  }
  return { width, height };
}

export type CuratorCard = {
  id: string;
  name: string;
  region: string;
  note: string;
  /** Full biography paragraph shown on the curator detail page. */
  bio?: string;
  /** True when `bio` is a best-effort fallback (press fragment), not a Figma-sourced paragraph. */
  bioIsFallback?: boolean;
  image?: string;
  /** CSS object-position — keeps heads framed in the 315×360 crop */
  focus?: string;
};

export type CuratorAssistant = { id: string; name: string; role: string };

export type CuratorZone = {
  id: string;
  label: string;
  states: string;
  curators: CuratorCard[];
  /** Shared curatorial note/essay for the zone (Figma 6:2636 "Square at the shoulders"). */
  curatorialNote?: { title: string; text: string };
  assistants?: CuratorAssistant[];
};

export const CURATOR_ZONES: CuratorZone[] = [
  {
    id: "zone-1",
    label: "Zone 1",
    states: "Delhi, Goa, Gujarat, Haryana, Punjab, Rajasthan",
    curators: [
      {
        id: "savyasachi",
        name: "Savyasachi Anju Prabir",
        region: "Zone 1",
        note: "Regional mentorship · North & West",
        bio: "Savyasachi Anju Prabir has a background in film and visual anthropology. His practice engages with moving images at the intersections of film, art, and anthropology. He currently teaches film and video communication at the National Institute of Design, Ahmedabad. He has worked as a programmer and jury member for festivals such as the Freiburger Filmforum, Experimenta India, IDA Documentary Awards, and the Alpavirama International Youth Film Festival. His ongoing research explores intergenerational memory, countermapping, and multimodal pedagogy through teaching, filmmaking, and artistic research.",
        image: "/curators/savyasachi.png",
        focus: "50% 30%",
      },
      {
        id: "sukanya",
        name: "Sukanya Deb",
        region: "Zone 1",
        note: "Regional mentorship · North & West",
        bio: "Sukanya Deb is a writer, editor and curator, whose interest lies in the intersections of contemporary art, digital culture, technology and their material propositions. She has worked extensively in programs within the arts sector, which has broadened her interest in generating and experimenting with existing infrastructures for support, collaborative exchange and dissemination. She established Purée Mag in 2024, in order to address critical positions in art and culture. She has been a recipient of Experimenter Generator Grant 2025, Khoj CISA Fellowship 2023, India Foundation for the Arts' 25x25 Grant, and her writing has been featured in publications such as e-flux Education, STIRworld, ASAP | Art, Write | Art | Connect, AQNB, and others. Since 2022, she has been Programmes Manager at Shared Ecologies, an initiative of the Shyama Foundation.",
        image: "/curators/sukanya.png",
        focus: "50% 18%",
      },
    ],
    curatorialNote: {
      title: "Square at the shoulders",
      text: "As public spaces shrink and control is exercised, the home and the classroom begin to blur, as refuge and belonging exist alongside surveillance and boundaries. When searching for a language that is sufficient to shift institutional accounts, there emerges a trembling space — one of negotiation, disruption, and resistance. We call upon disobedient practices––ones that resist resolution, ones that listen differently. In reclaiming the domestic, the pedagogic, the material, and the technological as the grounds for a collective response, how might we unlearn the hierarchies of authorship, labour, and knowledge that bind our gestures before they can even begin? Re-examining technology's potential, we call to a new set of logics to incorporate play, generate criticality, and build resources. Do-it-yourself and material practices become spirited enquiries that engage with detailing systems and apparatuses. Thinking errantly invites us to work from within: to touch what has been made invisible, to turn disobedience into method and care, and imagine new collaborations.",
    },
    assistants: [{ id: "sahana", name: "Sahana Srikanth", role: "Curatorial Assistant" }],
  },
  {
    id: "zone-2",
    label: "Zone 2",
    states: "West Bengal, Orissa, Uttar Pradesh, Chhattisgarh",
    curators: [
      {
        id: "gabaa",
        name: "GABAA",
        region: "Zone 2",
        note: "te(a)m-plurality — Sensing Grounds curatorial note",
        bio: "GABAA is an artists-led space represented by Ritushree Mondal, Himangshu Sarma, Rabiul Khan, and Surajit Mudi, guiding students from West Bengal, Odisha, Uttar Pradesh, and Chhattisgarh.",
        bioIsFallback: true,
        image: "/curators/gabaa.png",
        focus: "50% 38%",
      },
    ],
  },
  {
    id: "zone-3",
    label: "Zone 3",
    states: "Kerala, Tamil Nadu, and Andhra Pradesh",
    curators: [
      {
        id: "seethal",
        name: "Dr. Seethal C. P",
        region: "Zone 3",
        note: "Regional mentorship · South",
        bio: "Dr. Seethal C. P curates for Kerala, Tamil Nadu, and Andhra Pradesh, alongside Dr Sudheesh Kottembram.",
        bioIsFallback: true,
        image: "/curators/seethal.png",
        focus: "50% 16%",
      },
      {
        id: "sudheesh",
        name: "Dr Sudheesh Kottembram",
        region: "Zone 3",
        note: "Regional mentorship · South",
        bio: "Dr Sudheesh Kottembram curates for Kerala, Tamil Nadu, and Andhra Pradesh, alongside Dr. Seethal C. P.",
        bioIsFallback: true,
        image: "/curators/sudheesh.png",
        focus: "50% 14%",
      },
    ],
  },
  {
    id: "zone-4",
    label: "Zone 4",
    states:
      "Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim and Tripura",
    curators: [
      {
        id: "anga",
        name: "Anga Art Collective",
        region: "Zone 4",
        note: "Collective mentorship across the Northeast",
        bio: "Anga Art Collective leads workshops in the seven north-eastern states and Sikkim.",
        bioIsFallback: true,
        // No file in images/Curators — using prior asset until original is supplied
        image: "/curators/anga.jpg",
        focus: "50% 40%",
      },
    ],
  },
  {
    id: "zone-5",
    label: "Zone 5",
    states: "Maharashtra, Bihar, Jharkhand, Madhya Pradesh",
    curators: [
      {
        id: "secular",
        name: "Secular Art Collective",
        region: "Zone 5",
        note: "Collective frameworks · Central India",
        bio: "Secular Art Collective, represented by Salik Ansari, Bhushan Bhombale, Shamim Khan, and Shamooda Amrelia, leads workshops in Maharashtra, Bihar, Jharkhand, and Madhya Pradesh.",
        bioIsFallback: true,
        image: "/curators/secular.png",
        focus: "50% 36%",
      },
    ],
  },
  {
    id: "zone-6",
    label: "Zone 6",
    states: "Karnataka and Telangana",
    curators: [
      {
        id: "ashok",
        name: "Ashok Vish",
        region: "Zone 6",
        note: "Artistic duo · regional frameworks",
        bio: "Ashok Vish curates for Karnataka and Telangana, alongside Chinar Shah.",
        bioIsFallback: true,
        image: "/curators/ashok.png",
        focus: "50% 16%",
      },
      {
        id: "chinar",
        name: "Chinar Shah",
        region: "Zone 6",
        note: "Artistic duo · regional frameworks",
        bio: "Chinar Shah curates for Karnataka and Telangana, alongside Ashok Vish.",
        bioIsFallback: true,
        image: "/curators/chinar.png",
        focus: "50% 16%",
      },
    ],
  },
  {
    id: "zone-7",
    label: "Zone 7",
    states: "Himachal Pradesh, Jammu and Kashmir, Ladakh and Uttarakhand",
    curators: [
      {
        id: "khursheed",
        name: "Khursheed Ahmad",
        region: "Zone 7",
        note: "Artistic duo · mountain ecologies",
        bio: "Khursheed Ahmad curates for Jammu and Kashmir, Himachal Pradesh, Uttarakhand, and Ladakh, alongside Salman B Baba.",
        bioIsFallback: true,
        // Frame 97.png is a placeholder strip, not a portrait — omit image
      },
      {
        id: "salman",
        name: "Salman B Baba",
        region: "Zone 7",
        note: "Artistic duo · mountain ecologies",
        bio: "Salman B Baba curates for Jammu and Kashmir, Himachal Pradesh, Uttarakhand, and Ladakh, alongside Khursheed Ahmad.",
        bioIsFallback: true,
        image: "/curators/salman.png",
        focus: "50% 26%",
      },
    ],
  },
];

export const CURATORS: CuratorCard[] = CURATOR_ZONES.flatMap((z) => z.curators);

export type ArtworkCard = {
  id: string;
  title: string;
  venue: string;
  year: string;
  description: string;
  artists: { name: string; institution: string }[];
  curators?: string[];
  materials: string[];
  dimensions: string;
  type?: string;
  /** Thumbnail used in grid/list cards — filled from Figma asset export. */
  image?: string;
  /** Larger hero image used on the artwork detail page — filled from Figma asset export. */
  heroImage?: string;
  /** True when description/materials are a plausible reconstruction, not verbatim Figma text. */
  descriptionIsFallback?: boolean;
};

export const ARTWORKS: ArtworkCard[] = [
  {
    id: "absence",
    title: "What absence carries",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "What absence carries traces the quiet terrain where memory, grief and body entwine. Through soft sculptures, fluid drawings, tender photographs, and stitched traces, the work attends to forms that hover between presence and disappearance.",
    artists: [
      { name: "Ananya Gautam", institution: "National Institute of Design, Ahmedabad" },
      { name: "Annanya Dhanda", institution: "The Maharaja Sayajirao University, Baroda" },
      { name: "Jyotismriti Bordoloi", institution: "The Maharaja Sayajirao University, Baroda" },
    ],
    materials: [
      "Prints on fabric, video, dimensions variable",
      "Fabric, fibre, dimensions variable",
      "Mixed media drawings on Nepali paper, dimensions variable",
    ],
    dimensions: "5 x 15 Feet",
    image: "/artworks/absence.jpg",
    heroImage: "/artworks/absence-hero.jpg",
  },
  {
    id: "rubble",
    title: "The quiet beneath the rubble",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "The quiet beneath the rubble sifts through what settles after collapse — the residue, repair, and quiet architectures of care that persist once rupture has passed.",
    descriptionIsFallback: true,
    artists: [{ name: "Pratik Khurkutiya", institution: "The Maharaja Sayajirao University, Baroda" }],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
    image: "/artworks/rubble.jpg",
  },
  {
    id: "panic",
    title: "A warm kind of panic",
    venue: "BMS Warehouse",
    year: "2025 - 26",
    description:
      "A warm kind of panic begins from the quiet turbulence of everyday experience, the subtle frictions, doubts, and distances that gather beneath the surface of routine life. It draws from instances that shape the individual self, tracing how relationships, environments, and internal thresholds leave impressions that remain difficult to name or contain.",
    artists: [{ name: "Monika", institution: "University of Rajasthan, Jaipur" }],
    curators: ["Savyasachi Anju Prabir", "Sukanya Deb"],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
    image: "/artworks/panic.jpg",
  },
  {
    id: "house",
    title: "The house that remembers",
    venue: "BMS Warehouse",
    year: "2025 - 26",
    description:
      "The house that remembers gathers domestic objects and traces of habitation into a quiet record of memory held within walls and thresholds.",
    descriptionIsFallback: true,
    artists: [],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
  },
  {
    id: "blind-command",
    title: "Blind Command",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description:
      "Blind Command is a collective proposition from A4 Collective, working through instruction, obedience, and the systems that script everyday action.",
    descriptionIsFallback: true,
    artists: [{ name: "A4 Collective", institution: "Students' Biennale" }],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
  },
  {
    id: "residual-marks",
    title: "Residual Marks",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "Residual Marks traces what remains — the impressions, stains, and gestures left behind by hands, bodies, and time.",
    descriptionIsFallback: true,
    artists: [{ name: "Neelam Saini", institution: "Dada Lakhmi Chand State University of Performing and Visual Arts, Rohtak" }],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
    image: "/artworks/residual-marks.jpg",
  },
  {
    id: "dar-dara-dariya",
    title: "Dar - Dara - Dariya",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "Dar - Dara - Dariya moves between fear, threshold, and river — a meditation on the words that carry us between states of being.",
    descriptionIsFallback: true,
    artists: [{ name: "Jyoti", institution: "Government College of Art, Chandigarh" }],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
    image: "/artworks/dar-dara-dariya.jpg",
  },
  {
    id: "milk-distributors",
    title: "Milk Distributors",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "Milk Distributors follows the everyday infrastructures of distribution and labour that move through Indian towns unnoticed.",
    descriptionIsFallback: true,
    artists: [{ name: "Abhijit Das", institution: "Government College of Art, Chandigarh" }],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
    image: "/artworks/milk-distributors.jpg",
  },
  {
    id: "panopticon",
    title: "The Panopticon",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "The Panopticon considers surveillance, visibility, and the architectures of control that shape how bodies move through shared space.",
    descriptionIsFallback: true,
    artists: [
      { name: "Ashwariya Singla", institution: "Students' Biennale" },
      { name: "Soumyaraj Acharya", institution: "Students' Biennale" },
    ],
    materials: ["Mixed media, dimensions variable — full artist list incomplete, flagged"],
    dimensions: "Dimensions variable",
    image: "/artworks/panopticon.jpg",
  },
  {
    id: "who-is-the-printer",
    title: "Who is the print-er?",
    venue: "Arthshila Kochi",
    year: "2025 - 26",
    type: "Installation",
    description:
      "Who is the print-er? interrogates authorship and reproduction, asking who speaks — and who is spoken for — through the printed image.",
    descriptionIsFallback: true,
    artists: [],
    materials: ["Installation, dimensions variable"],
    dimensions: "Dimensions variable",
  },
  {
    id: "root-system-analysis",
    title: "Root System Analysis I / II",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    type: "Installation",
    description:
      "Root System Analysis I / II examines networks of growth and support hidden beneath the surface, drawing a parallel between botanical and social roots.",
    descriptionIsFallback: true,
    artists: [],
    materials: ["Installation, dimensions variable"],
    dimensions: "Dimensions variable",
  },
  {
    id: "uncanny-rusty-sign",
    title: "Uncanny: The Quiet Rusty Sign",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "Uncanny: The Quiet Rusty Sign reads the worn signage of everyday streets as quiet archives of time, use, and neglect.",
    descriptionIsFallback: true,
    artists: [
      { name: "Sania Fathima", institution: "Students' Biennale" },
      { name: "Arun S", institution: "Students' Biennale" },
    ],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
    image: "/artworks/uncanny-rusty-sign.jpg",
  },
  {
    id: "where-memories-are-immured",
    title: "WHERE MEMORIES ARE IMMURED",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "WHERE MEMORIES ARE IMMURED, by Free Thinkers Collective, walls in and preserves fragments of memory the way old buildings hold their histories in brick and plaster.",
    descriptionIsFallback: true,
    artists: [
      { name: "Arshaan Ali Khan", institution: "Students' Biennale" },
      { name: "Haris Raza Ashraf", institution: "Students' Biennale" },
    ],
    materials: ["Mixed media, dimensions variable — full artist list incomplete, flagged"],
    dimensions: "Dimensions variable",
    image: "/artworks/where-memories-are-immured.jpg",
  },
  {
    id: "labour-of-the-imagined",
    title: "Labour of the Imagined: Far Away from Left, Centre and Right",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "Labour of the Imagined: Far Away from Left, Centre and Right sits outside fixed political positions, dwelling instead in the imaginative labour that resists easy categorisation.",
    descriptionIsFallback: true,
    artists: [{ name: "Vineetha W", institution: "Students' Biennale" }],
    materials: ["Mixed media, dimensions variable"],
    dimensions: "Dimensions variable",
    image: "/artworks/labour-of-the-imagined.jpg",
  },
];

export type VenueCard = {
  id: string;
  name: string;
  address: string;
  hours: string;
  /** Full history paragraph from Figma. */
  history?: string;
  /** True when `history` is cut short of the full Figma copy (needs a follow-up get_design_context pass). */
  historyTruncated?: boolean;
  mapUrl?: string;
  virtualTourUrl?: string;
  /** Thumbnail used in grid/list cards — filled from Figma asset export. */
  image?: string;
  /** Larger hero/map image used on the venue detail page — filled from Figma asset export. */
  heroImage?: string;
};

export const VENUES: VenueCard[] = [
  {
    id: "vkl",
    name: "VKL Warehouse",
    address: "Chendamangalam, Kochi, Kerala",
    hours: "Open during exhibition hours",
    history:
      "Founded in 1935 by Vallabhdas Vasanji Mariwala, the VKL Warehouse property was once part of the ancestral home of Cochin's Paliam family in Chendamangalam. In 1952, the property was partitioned under land reform rules and the ownership of the land was then transferred to the Mariwala family and the VKL group in 1971.",
    historyTruncated: true,
    mapUrl: "https://maps.google.com",
    virtualTourUrl: "https://maps.google.com",
  },
  {
    id: "bms",
    name: "BMS Warehouse",
    address: "Bazaar Road, Mattancherry, Kochi, Kerala",
    hours: "Open during exhibition hours",
    history:
      "Bright's Warehouse (BMS), situated on Bazaar Road in Mattancherry, is one of the historic godowns that reflects Kochi's long-standing role as a major port and trading centre along the Malabar Coast. Built to support the storage and movement of commodities such as spices, coir, timber, and other goods arriving through the nearby harbour, the warehouse formed part of the commercial infrastructure that sustained Kochi's trade economy for generations.",
    historyTruncated: true,
    mapUrl: "https://maps.google.com",
    virtualTourUrl: "https://maps.google.com",
  },
  {
    id: "st-andrews",
    name: "St. Andrew's Parish Hall",
    address: "Elphinstone Road, Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    history:
      "St. Andrew's Parish Hall, located on Elphinstone Road in Fort Kochi, is a British-era structure built in 1845 that reflects the town's colonial religious history. It originally served as a place of worship for Malayalam-speaking Protestant Christians, distinct from the European congregation that prayed at the nearby St. Francis Church. After India's independence in 1947, as the European community left Fort Kochi, the two congregations came together at St. Francis Church, and this building was gradually repurposed into what is now St. Andrew's Parish Hall. Today it functions under St. Francis CSI Church and is regularly used for weddings and community gatherings. For the sixth edition of the Kochi-Muziris Biennale, this hall was repurposed as a cultural venue to host exhibitions from the Students' Biennale and Invitations Programme. It also served as a venue for several KMB public programmes, including workshops, talks, and film screenings, while retaining its historic character.",
    mapUrl: "https://maps.google.com",
    virtualTourUrl: "https://maps.google.com",
    heroImage: "/venues/st-andrews-hero.jpg",
  },
  {
    id: "arthshila",
    name: "Arthshila Kochi",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    history:
      "Arthshila symbolises British rule in Kochi. It was a part of the daily life of the British in Kochi at that time as a company that sold food products imported from Britain. On October 20, 1795, Dutch rule in Kochi ended and British rule began. The Portuguese fort established in Kochi in 1503 was demolished in 1663 at the beginning of the subsequent Dutch rule.",
    historyTruncated: true,
    mapUrl: "https://maps.google.com",
    virtualTourUrl: "https://maps.google.com",
  },
  {
    id: "david-hall",
    name: "David Hall",
    address: "Parade Ground, Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    history:
      "Situated on the west side of the parade ground in Fort Kochi, David Hall exemplifies Dutch architectural design, characterized by three expansive rooms, a verandah with chat benches, tall walls, wide windows, and adjacent seating areas. The building served as the residence of Henrik van Reed, the Dutch Governor of Kochi from 1669 to 1676.",
    historyTruncated: true,
    mapUrl: "https://maps.google.com",
    virtualTourUrl: "https://maps.google.com",
  },
  {
    id: "space",
    name: "SPACE",
    address: "Bazaar Road, Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    history:
      "During the British administration in the 19th Century, the Indian traders in Kochi wanted to have an association, and there were discussions about the same. The history of the Indian Chamber of Commerce and Industry begins here. In 1897, a movement called \"The Cochin Native Merchants' Association\" was formed.",
    historyTruncated: true,
    mapUrl: "https://maps.google.com",
    virtualTourUrl: "https://maps.google.com",
  },
];

export type ArtistCard = {
  id: string;
  name: string;
  institution: string;
  zone: string;
  /** Thumbnail used in grid/list cards — filled from Figma asset export. */
  image?: string;
  /** CSS object-position for portrait crops, mirroring the curator `focus` convention. */
  focus?: string;
};

export const ARTISTS: ArtistCard[] = [
  { id: "ananya-gautam", name: "Ananya Gautam", institution: "National Institute of Design, Ahmedabad", zone: "Zone 1" },
  { id: "pratik-khurkutiya", name: "Pratik Khurkutiya", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "reedhvi-thanekar", name: "Reedhvi Hanumant Thanekar", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "gargi-kumawat", name: "Gargi Kumawat", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "yash-songara", name: "Yash Songara", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "abhijit-das", name: "Abhijit Das", institution: "Government College of Art, Chandigarh", zone: "Zone 1" },
  { id: "richardson-benedict", name: "Richardson Benedict", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "gunnica-arya", name: "Gunnica Arya", institution: "O.P. Jindal University, Delhi/NCR", zone: "Zone 1" },
  { id: "ashish-chauhan", name: "Ashish Chauhan", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "annanya-dhanda", name: "Annanya Dhanda", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "monika", name: "Monika", institution: "University of Rajasthan, Jaipur", zone: "Zone 1" },
  { id: "shilpeksh-khalorkar", name: "Shilpeksh Khalorkar", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "lalchand-prajapat", name: "Lalchand Prajapat", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "neelam-saini", name: "Neelam Saini", institution: "Dada Lakhmi Chand State University of Performing and Visual Arts, Rohtak", zone: "Zone 1" },
  { id: "anurag-singraur", name: "Anurag Singraur", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "sai-gitanjali-poluru", name: "Sai Gitanjali Poluru", institution: "Shiv Nadar University Delhi/NCR", zone: "Zone 1" },
  { id: "krishan-agarwal", name: "Krishan Agarwal", institution: "Jamia Millia Islamia University, Delhi", zone: "Zone 1" },
  { id: "khushi-mittal", name: "Khushi Mittal", institution: "O.P. Jindal University, Delhi/NCR", zone: "Zone 1" },
  { id: "jyotismriti-bordoloi", name: "Jyotismriti Bordoloi", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "ambika-shirodkar", name: "Ambika Shirodkar", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "unik-chari", name: "Unik Ramchandra Chari", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "priyanka-meena", name: "Priyanka Kumari Meena", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "jyoti-artist", name: "Jyoti", institution: "Government College of Art, Chandigarh", zone: "Zone 1" },
  { id: "rishabh-jain", name: "Rishabh Jain", institution: "Shiv Nadar University, Delhi/NCR", zone: "Zone 1" },
  { id: "krittika-maji", name: "Krittika Maji", institution: "Ambedkar University Delhi", zone: "Zone 1" },
  { id: "abhijith-raju", name: "Abhijith Raju", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
];

export type PressItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  body?: string;
  image?: string;
  teaser?: boolean;
  url?: string;
};

export const PRESS: PressItem[] = [
  {
    id: "kbf-curators",
    title: "KBF Announces Curators For Students' Biennale 2025-26",
    date: "4 Dec 2025",
    image: "/press/featured.jpg",
    excerpt:
      "The Kochi Biennale Foundation (KBF) has announced the curators for Students' Biennale, a key educational initiative for emerging artists across India.",
    body: `The Kochi Biennale Foundation (KBF) has announced the curators for Students' Biennale, a key educational initiative of the Kochi Biennale Foundation for budding young artists. The programme works with state-funded art colleges across India, encouraging emerging artists to reflect on their practice and showcase their work on an international stage.

The Students' Biennale exhibition will open on 13 December 2025 and run alongside the Kochi-Muziris Biennale (KMB). The largest contemporary art festival in India, the sixth edition of the KMB is scheduled to open on 12 December 2025 until March 31, 2026.

The programme is led by curators/collectives who will mentor students from over 150 institutions across seven regions of the nation. They engage with the students, shortlist the exhibition participants, and work closely with participating students to develop their projects for the exhibition in Kochi.

With emphasis on alternative education beyond the classroom and learning from practice, the event serves as a forum to foster fine arts education in the country.

Mario D'Souza, Director of Programmes, Kochi Biennale Foundation, said, "Each edition of the Students' Biennale is a learning exercise. We work with students, educators, curators, and artists to understand the needs and shortcomings of art education in India."

He added, "For this edition, we examine what other forms of nourishing practice are possible outside of the market and grant economy. We invited curators as peers, who could exemplify and share these "other" frameworks across independent artist-run initiatives, residency models, collective work, teaching, and self-publishing, amongst others. We aspire to build a peer group and artist-to-artist network that is concerned with the 'now'. We want to learn together - about and with each other's contexts and challenges. We want to listen."

The curators/collectives for the seven regions are:

Savyasachi Anju Prabir, and Sukanya Deb for Punjab, Delhi, Haryana, Gujarat, Goa, and Rajasthan; Dr. Sudheesh Kottembram and Dr. Seethal CP for Kerala, Tamil Nadu, and Andhra Pradesh; Chinar Shah and Ashok Vish for Karnataka and Telangana states; and Kursheed Ahmed and Salman Basheer Baba for Jammu and Kashmir, Himachal Pradesh, Uttarakhand, and Ladakh.

Gabba, an artists-led space represented by Ritushree Mondal, Himangshu Sarma, Rabiul Khan, and Surajit Mudi, will guide students from West Bengal, Odisha, Uttar Pradesh, and Chhattisgarh.

Anga Art Collective leads workshops in the seven north-eastern states and Sikkim, and Secular Art Collective, represented by Salik Ansari, Bhushan Bhombale, Shamim Khan, and Shamooda Amrelia, leads workshops in Maharashtra, Bihar, Jharkhand, and Madhya Pradesh.`,
  },
  {
    id: "walkthrough",
    title: "Book A Guided Walkthrough",
    date: "1 Jan 2026",
    teaser: true,
    image: "/press/walkthrough.jpg",
    excerpt:
      "Book a guided walk-through of the Biennale exhibitions, led by our trained art mediators.",
  },
  {
    id: "guide-map",
    title: "The Ultimate Guide & Map to the Kochi-Muziris Biennale 2025/26 Venues",
    date: "15 Feb 2026",
    excerpt: "A practical guide to navigating Biennale venues across Fort Kochi.",
  },
  {
    id: "st-andrews",
    title: "St. Andrews Parish Hall - Students' Biennale at Kochi",
    date: "31 Mar 2026",
    excerpt: "On the Students' Biennale presentation at St. Andrews Parish Hall.",
    url: "https://catsofkochi.com/st-andrews-parish-hall-students-biennale-at-kochi/",
  },
  {
    id: "panic",
    title: "A warm kind of panic",
    date: "31 Dec 2025",
    excerpt: "Critical writing on works from Sensing Grounds.",
  },
  {
    id: "peta",
    title: "The Power of the Peta / Honour",
    date: "31 Dec 2025",
    excerpt: "Critical writing from the edition.",
  },
];

export type ProgrammeCard = {
  id: string;
  title: string;
  kind: "workshop" | "residency" | "award";
  blurb: string;
  place?: string;
};

export const PROGRAMMES_UPCOMING: ProgrammeCard[] = [
  {
    id: "w1",
    title: "Workshops",
    kind: "workshop",
    blurb: "Material practice and peer critique sessions with mid-career mentors.",
    place: "Fort Kochi",
  },
  {
    id: "w2",
    title: "Residencies",
    kind: "residency",
    blurb: "Short residencies supporting collaborative research and making.",
    place: "Kochi",
  },
  {
    id: "w3",
    title: "Awards",
    kind: "award",
    blurb: "Recognition for outstanding student projects from the edition.",
  },
];

/**
 * "UPCOMING WORKSHOPS" cards (Figma 6:2326) are intentionally lorem-ipsum
 * placeholder copy in the design itself ("workshop 01/02/03" + standard lorem) —
 * keep as placeholder, that is the confirmed design intent, not a content gap.
 */
export type PastWorkshop = {
  id: string;
  title: string;
  year: string;
  facilitators: string;
  place: string;
};

export const PAST_WORKSHOPS: PastWorkshop[] = [
  {
    id: "phone-call",
    title: "How to not answer a phone call?",
    year: "2025",
    facilitators: "Merv Espina and Sukanya Deb",
    place: "New Delhi",
  },
  {
    id: "subverting-failures",
    title: "Subverting Failures",
    year: "2025",
    facilitators: "Ujjwal Utkarsh, Priyesh Gothwal and Savyasachi Anju Prabir",
    place: "Jaipur",
  },
  {
    id: "uncertainties-welcomed",
    title: "Uncertainties Welcomed",
    year: "2025",
    facilitators: "Aditya Joshi & Maksud Ali Mondal",
    place: "Goa",
  },
  {
    id: "editing-as-meaning-making",
    title: "Editing as Meaning Making",
    year: "2024",
    facilitators: "Urna Sinha & Varsha Nair",
    place: "Baroda",
  },
];

export type AwardWinner = {
  id: string;
  name: string;
  institution: string;
  artwork: string;
};

export const NATIONAL_AWARDS: AwardWinner[] = [
  { id: "aswathy-gs", name: "Aswathy GS", institution: "Raja Ravi Varma College of Fine Arts, Mavelikkara, Kerala", artwork: "Staged Narratives" },
  { id: "kailash-khanjode", name: "Kailash Khanjode", institution: "Government College of Art, Nagpur, Maharashtra", artwork: "Ginning Justice, 2025" },
  { id: "sachin-banne", name: "Sachin Banne", institution: "Sir J. J. School of Art, Mumbai, Maharashtra", artwork: "Ginning Justice, 2025" },
  { id: "abhishek-kholapudi", name: "Abhishek Kholapudi", institution: "Suravaram Pratap Reddy Telugu University, Hyderabad", artwork: "Mirage of the Three, 2025" },
  { id: "pratik-khurkutiya-award", name: "Pratik Khurkutiya", institution: "The Maharaja Sayajirao University of Baroda", artwork: "The quiet beneath the rubble" },
  { id: "m-imran-ahmed", name: "M. Imran Ahmed", institution: "Government College of Fine Arts, Chennai", artwork: "Staged Narratives" },
];

/**
 * "INTERNATIONAL AWARDS" heading on Figma 6:2326 IS followed by three named
 * cards in a full get_design_context pass (Aswathy GS, Kailash Khanjode,
 * Sachin Banne) — but they are exact duplicates of the first three
 * `NATIONAL_AWARDS` winners above (same names/institutions/artworks), which
 * are all explicitly "Students' Biennale Tata Trusts National Awards" per
 * the Residencies copy on the same page. This reads as a placeholder/
 * duplication artifact in the Figma mockup rather than genuine, distinct
 * international-award content, so it is still treated as missing here.
 * Flag for design/content confirmation before promoting this to real data.
 */
export const INTERNATIONAL_AWARDS: AwardWinner[] = [];
export const INTERNATIONAL_AWARDS_CONTENT_MISSING = true;

/**
 * "Residencies" full-bleed section (Frame 35, 1440×820) DOES carry real
 * content in a full get_design_context pass: a single residency card
 * (Students' Biennale National Residency Award Programme — Host: KBF,
 * Period: 10 June – 10 July 2026, Venue: SMS Hall, Mattancherry, Kochi,
 * Awardees: Reppandee Lepcha & Durgesh Prajapati) plus a copy paragraph.
 * Only one residency is shown (no carousel). The source paragraph itself
 * trails off mid-sentence in the design ("Held from 10 June to 10 July
 * 2026,") — reproduced verbatim in Programmes.tsx rather than completed.
 */
export const RESIDENCIES_CONTENT_UNCONFIRMED = false;

export type EditionOverview = {
  yearId: string;
  title: string;
  editionLabel: string;
  history: string;
  isRealContent: boolean;
  curators?: string[];
  curatorialAdvisor?: string;
  projectAdvisor?: string;
  directorOfProgrammes?: string;
  programmeCoordinator?: string;
  advisors?: string[];
  institutions?: string[];
  venues?: string[];
  nextEditionLabel?: string;
  nextEditionYearId?: string;
  /** Full-bleed hero photo for the overview page — filled from Figma asset export. */
  heroImage?: string;
  /** Two 4-up "Workshops" grid photos (8 total) — filled from Figma asset export. */
  workshopImages?: string[];
  /** Full-bleed closing image (Figma "awards-style closer") — filled from Figma asset export. */
  closerImage?: string;
};

const LOREM_HISTORY =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

export const EDITION_OVERVIEWS: Record<string, EditionOverview> = {
  "2014-15": {
    yearId: "2014-15",
    title: "Students' Biennale",
    editionLabel: "Inaugural Edition (2014 - 15)",
    isRealContent: true,
    history:
      "The inaugural Students' Biennale was presented from 13 December 2014 to 29 March 2015 as part of the Second Kochi-Muziris Biennale, marking the beginning of what has since become the Kochi Biennale Foundation's largest and most far-reaching educational initiative. Conceived under the Foundation's Higher Education Programme in collaboration with the Foundation for Indian Contemporary Art (FICA) and the Foundation for Indian Art Education (FIAE), the Students' Biennale was established to create an alternative platform for students from art institutions across India to reflect on their practices, engage in critical dialogue, and present their work within the context of an international contemporary art exhibition. From its inception, the Students' Biennale has pursued a dual objective: to examine the diverse conditions of art education and pedagogy across India while simultaneously introducing emerging artists to the wider discursive and professional ecosystem of the Kochi-Muziris Biennale. By situating student practices within an international exhibition framework, the programme sought to foster new forms of exchange between young practitioners, educators, curators, and audiences. The first edition brought together more than 100 works by students from 37 art institutions spanning the country, including schools in Srinagar, Jabalpur, Visakhapatnam, Thrissur, Imphal, Bhubaneswar, Mysore, among many others. The participating institutions reflected the breadth of India's art education landscape from colonial-era academies established over 150 years ago, to institutions founded in the years following Independence as part of the nation's cultural development, as well as newer schools established over the past few decades. The selection process itself became a significant pedagogical undertaking. A team of 15 emerging curators travelled extensively across India over a period of three months, visiting art schools, engaging with students and faculty, and developing an understanding of the varied contexts in which artistic practices were being nurtured. Conceived as a process of peer learning, these visits encouraged dialogue rather than evaluation, allowing each curator to respond independently to the questions, urgencies, and possibilities they encountered. The research revealed the diverse realities of art education across the country ranging from infrastructural limitations and institutional challenges to the remarkable resilience, commitment, and creativity demonstrated by students working within these conditions. Rather than presenting a singular narrative, the exhibition emerged as an open-ended and discursive proposition that embraced multiple perspectives, temporalities, and regional contexts, reflecting the complexity of what it means to produce contemporary art in India. Hosted across two venues namely, Mohammed Ali Warehouse and KVA Brothers in Mattancherry, the inaugural Students' Biennale established a new model for artistic learning and exchange. It demonstrated the potential of the Biennale as a site for education as much as exhibition, creating meaningful opportunities for students to engage with national and international audiences while building lasting networks across institutions. The first edition laid the foundation for a programme that has continued to evolve through subsequent editions, expanding beyond exhibitions to include workshops, residencies, mentorships, awards, and other initiatives that support emerging artists. More than an exhibition, the Students' Biennale began an ongoing process of collective engagement with students, educators, and institutions – one that continues to shape contemporary art education in India today.",
    curators: [
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
      "Sachin Vaishnavi Ramnathan",
      "Geetika Arora",
    ],
    curatorialAdvisor: "Vidya Shivadas",
    projectAdvisor: "Suresh Jayaram",
    directorOfProgrammes: "Riyas Komu",
    programmeCoordinator: "Sananda Mukhopadhyay",
    advisors: [
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
    institutions: [
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
      "B.K.College of Art & Crafts, Bhubaneswar",
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
    ],
    venues: ["Mohammed Ali Warehouse", "KVA Brothers, Mattancherry"],
    nextEditionLabel: "Students' Biennale 2016-17",
    nextEditionYearId: "2016-17",
    heroImage: "/editions/2014-15/hero.jpg",
    workshopImages: [
      "/editions/2014-15/workshop-1.jpg",
      "/editions/2014-15/workshop-2.jpg",
      "/editions/2014-15/workshop-3.jpg",
      "/editions/2014-15/workshop-4.jpg",
      "/editions/2014-15/workshop-5.jpg",
      "/editions/2014-15/workshop-6.jpg",
      "/editions/2014-15/workshop-7.jpg",
      "/editions/2014-15/workshop-8.jpg",
    ],
    closerImage: "/editions/2014-15/closer.jpg",
  },
  "2016-17": {
    yearId: "2016-17",
    title: "Students' Biennale",
    editionLabel: "Edition (2016 - 17)",
    isRealContent: false,
    history: LOREM_HISTORY,
    nextEditionLabel: "Students' Biennale 2018-19",
    nextEditionYearId: "2018-19",
  },
  "2018-19": {
    yearId: "2018-19",
    title: "Students' Biennale",
    editionLabel: "Edition (2018 - 19)",
    isRealContent: false,
    history: LOREM_HISTORY,
    nextEditionLabel: "Students' Biennale 2020-21",
    nextEditionYearId: "2020-21",
  },
  "2020-21": {
    yearId: "2020-21",
    title: "Students' Biennale",
    editionLabel: "Edition (2020 - 21)",
    isRealContent: false,
    history: LOREM_HISTORY,
    nextEditionLabel: "Students' Biennale 2022-23",
    nextEditionYearId: "2022-23",
  },
  "2022-23": {
    yearId: "2022-23",
    title: "Students' Biennale",
    editionLabel: "Edition (2022 - 23)",
    isRealContent: false,
    history: LOREM_HISTORY,
    nextEditionLabel: "Students' Biennale 2025-26",
    nextEditionYearId: LATEST_EDITION.id,
  },
};
