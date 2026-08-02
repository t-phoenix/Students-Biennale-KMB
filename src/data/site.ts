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
  image?: string;
  /** CSS object-position — keeps heads framed in the 315×360 crop */
  focus?: string;
};

export type CuratorZone = {
  id: string;
  label: string;
  states: string;
  curators: CuratorCard[];
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
        image: "/curators/savyasachi.png",
        focus: "50% 30%",
      },
      {
        id: "sukanya",
        name: "Sukanya Deb",
        region: "Zone 1",
        note: "Regional mentorship · North & West",
        image: "/curators/sukanya.png",
        focus: "50% 18%",
      },
    ],
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
        image: "/curators/seethal.png",
        focus: "50% 16%",
      },
      {
        id: "sudheesh",
        name: "Dr Sudheesh Kottembram",
        region: "Zone 3",
        note: "Regional mentorship · South",
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
        image: "/curators/ashok.png",
        focus: "50% 16%",
      },
      {
        id: "chinar",
        name: "Chinar Shah",
        region: "Zone 6",
        note: "Artistic duo · regional frameworks",
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
        // Frame 97.png is a placeholder strip, not a portrait — omit image
      },
      {
        id: "salman",
        name: "Salman B Baba",
        region: "Zone 7",
        note: "Artistic duo · mountain ecologies",
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
  materials: string[];
  dimensions: string;
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
  },
  {
    id: "rubble",
    title: "The quiet beneath the rubble",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "A meditation on residue, repair, and the architectures of care after rupture.",
    artists: [{ name: "Collective", institution: "Students' Biennale" }],
    materials: ["Installation, mixed media"],
    dimensions: "Dimensions variable",
  },
];

export type VenueCard = {
  id: string;
  name: string;
  address: string;
  hours: string;
};

export const VENUES: VenueCard[] = [
  {
    id: "vkl",
    name: "Vallabhdas Kanji Ltd. (VKL) Warehouse",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
  },
  {
    id: "bms",
    name: "BMS Warehouse",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
  },
  {
    id: "st-andrews",
    name: "St. Andrews Parish Hall",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
  },
];

export type ArtistCard = { id: string; name: string; institution: string; zone: string };

export const ARTISTS: ArtistCard[] = [
  {
    id: "ananya",
    name: "Ananya Gautam",
    institution: "National Institute of Design, Ahmedabad",
    zone: "Zone — Gujarat & surrounds",
  },
  {
    id: "annanya",
    name: "Annanya Dhanda",
    institution: "The Maharaja Sayajirao University, Baroda",
    zone: "Zone — Gujarat & surrounds",
  },
  {
    id: "jyoti",
    name: "Jyotismriti Bordoloi",
    institution: "The Maharaja Sayajirao University, Baroda",
    zone: "Zone — Assam / Baroda",
  },
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
