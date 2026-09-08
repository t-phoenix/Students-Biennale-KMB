import editionSearchTagsData from "./edition-search-tags.json";
import type { SearchIndexEntry } from "../lib/catalogue/types";

export const EDITION_SHORT = `The Students Biennale 2025-26 was realised by bringing together  70 projects under 4 artist duos and and 3 artist's collectives taking on 7 curatorial frameworks which culminates into one exhibition. The programme has successfully been able to achieve this with the participation of more than 200 student artists selected from over 150+ art institutions across the country.

The programme emphasises on collaborative learning, student-led curatorial agency, and interdisciplinary methodologies. Rather than functioning as a static exhibition, the Students' Biennale operates as an evolving framework that facilitates dialogue, experimentation, and collective knowledge production, contributing to the development of emerging practitioners and alternative pedagogical models within contemporary art education.  Artistic works draw upon material practices, embodied knowledge systems, everyday objects, and technological experimentation to reflect on lived experience and systems of power.`;

export const EDITION_MORE = `The 2025-26 Students' Biennale programme has emerged under the curatorial mentorship, workshops and reviews by mid-career curators with regional and international experience. These seven curatorial teams comprise of 4 artistic duos - Ashok Vish & Chinar Shah (Karnataka & Telangana), Khursheed Ahmad & Salman Bashir Baba (Himalayan Belt), Savyasachi Anju Prabir & Sukanya Deb (Gujarat, Goa, Rajasthan, Punjab, Delhi, Haryana) Seethal CP & Sudheesh Kottembram (Kerala, Tamil Nadu, Andhra Pradesh) and 3 artists collective -  Anga Art Collective (North eastern states), GABAA (West Bengal, Orissa, Uttar Pradesh, Chhattisgarh) & Secular Art Collective (Maharashtra, Bihar, Jharkhand, Madhya Pradesh).

This edition, titled 'Sensing Grounds' invited students to present ideas, works that are still underprogress, collaborations, and finished works along with material developed during the workshops, resulting in a total of 70 projects. The Students' Biennale opened to the public on Dec 13th 2025 and remained on display until 31st March 2026 across 6 venues in Fort Kochi: Vallabhdas Kanji Ltd. (VKL) Warehouse, BMS Warehouse, Arthshila Kochi, St. Andrews Parish Hall, Space Gallery, and David Hall.`;

/** Sensing Grounds curatorial note — Figma "Sensing GRound" (2:2), the framework
 *  statement for the 2025-26 edition as a whole (GABAA, te(a)m-plurality). */
export const SENSING_GROUNDS_NOTE = {
  title: "Sensing Grounds",
  attribution: "te(a)m-plurality,\ncuratorial note by GABAA",
  paragraphsCol1: [
    "The imagination for the sixth edition of the Students' Biennale was to engage with students and circumstances—to perceive the world not from fixed, inherited positions, but through the fragile, shifting, and often contested sites where bodies, materials, and conditions converge with institutions. Instead of seeking a linear, singular narrative, the exhibition suggests a mode in which the act of sensing is political, and in many cases, collective. The grounds it proposes are never fixed. They are lived, negotiated, and continually remade.",
    "We recognise the Students' Biennale as an uneven landscape shaped through proximities between the domestic and the public, extraction and resistance, reality and speculation. Shrinking public space, institutional hierarchies, peripherality, and environmental precarity challenge our personal and community spaces. We hope to inhabit their tensions intimately. From the Western Himalayas' fragile ecosystems to the extractive urgencies of Northeast India and the pressures within art institutions in Karnataka, Telangana, and beyond, students and collectives attend to the material and emotional realities of their worlds. The works affirm sensing as an active enquiry, supple with defiance, and nourished with care.",
  ],
  paragraphsCol2: [
    "It is the “trembling, (shifting) space” where disobedient practices challenge and unsettle entrenched forms of authority. Here, craft, oral and embodied histories, domestic objects, and experiments with technology become methods of thinking otherwise. These gestures translate and transform space, instead of just occupying it.",
    "The pedagogical exercises also suggest the “undercommons” as shaped by negotiation, plurality, and mutual learning. “Students curate themselves; curators become collaborators”. Making, labour, vulnerability, and urgency converge in these spaces, and practices become ways of sensing what has been rendered invisible: structures of power, ecological loss, and the quiet endurance embedded in everyday life.",
    "The notes speak of the contingent, the partial, the ongoing. To sense the ground is to understand its instability in recognising each gesture of translation, each act of resistance, each fragment of lived experience that reshapes landscapes. The Students' Biennale thus becomes not a fixed exhibition, but a shared, shifting ground where new forms of relation, belonging, and imagination can take hold.",
  ],
  paragraphs: [
    "The imagination for the sixth edition of the Students' Biennale was to engage with students and circumstances—to perceive the world not from fixed, inherited positions, but through the fragile, shifting, and often contested sites where bodies, materials, and conditions converge with institutions. Instead of seeking a linear, singular narrative, the exhibition suggests a mode in which the act of sensing is political, and in many cases, collective. The grounds it proposes are never fixed. They are lived, negotiated, and continually remade.",
    "We recognise the Students' Biennale as an uneven landscape shaped through proximities between the domestic and the public, extraction and resistance, reality and speculation. Shrinking public space, institutional hierarchies, peripherality, and environmental precarity challenge our personal and community spaces. We hope to inhabit their tensions intimately. From the Western Himalayas' fragile ecosystems to the extractive urgencies of Northeast India and the pressures within art institutions in Karnataka, Telangana, and beyond, students and collectives attend to the material and emotional realities of their worlds. The works affirm sensing as an active enquiry, supple with defiance, and nourished with care.",
    "It is the “trembling, (shifting) space” where disobedient practices challenge and unsettle entrenched forms of authority. Here, craft, oral and embodied histories, domestic objects, and experiments with technology become methods of thinking otherwise. These gestures translate and transform space, instead of just occupying it.",
    "The pedagogical exercises also suggest the “undercommons” as shaped by negotiation, plurality, and mutual learning. “Students curate themselves; curators become collaborators”. Making, labour, vulnerability, and urgency converge in these spaces, and practices become ways of sensing what has been rendered invisible: structures of power, ecological loss, and the quiet endurance embedded in everyday life.",
    "The notes speak of the contingent, the partial, the ongoing. To sense the ground is to understand its instability in recognising each gesture of translation, each act of resistance, each fragment of lived experience that reshapes landscapes. The Students' Biennale thus becomes not a fixed exhibition, but a shared, shifting ground where new forms of relation, belonging, and imagination can take hold.",
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
    ["Web Design and Services", "Abhinil Agarwal", "Anand Peter", "Prajesh MP", "Vishnulal CR"],
  ],
];

export type CuratorBio = {
  name: string;
  bio: string;
};

export type InstitutionWithArtists = {
  institution: string;
  artists: string;
};

export type EditionDownload = {
  title: string;
  label: string;
  href?: string;
};

export type EditionOverviewData = {
  id: string;
  title: string;
  subtitle: string;
  /** Explicit split title lines for the right-aligned title rail */
  titleLines?: string[];
  /** Body paragraphs for fallback when database is unpopulated. */
  intro: string[];
  team: readonly (readonly (readonly string[])[])[];
  institutions: string[];
  /** Curator / collective biographical profiles (2020-21, 2022-23). */
  curatorBios?: CuratorBio[];
  /** Curatorial note statement (2018-19). */
  curatorialNote?: {
    title: string;
    paragraphs: string[];
  };
  /** Detailed participating institutions paired with artists (2022-23). */
  institutionsWithArtists?: InstitutionWithArtists[];
  /** Catalogue or report download links (2018-19, 2022-23). */
  downloads?: EditionDownload[];
  /** Full-bleed hero image when available. */
  heroImage?: string;
  /** Cover carousel frames (3–5); falls back to [heroImage] when omitted. */
  heroImages?: string[];
  /** Gallery images (Figma shows two rows of four). */
  galleryImages: string[];
  /** Year id of the edition that follows this one, for the trailing CTA. */
  nextId?: string;
};

export type EditionSearchTags = {
  title: string;
  curators: string[];
  team: string[];
  artists: string[];
  artworks: string[];
  venues: string[];
  institutions: string[];
};

/* =========================================================================
 * 2014-15: Inaugural Edition (Figma Frame 66:2)
 * ========================================================================= */
const ED_2014_15: EditionOverviewData = {
  id: "2014-15",
  title: "Students' Biennale",
  subtitle: "Inaugural Edition\n2014 - 15",
  titleLines: ["Students' Biennale", "Inaugural Edition", "2014 - 15"],
  intro: [
  "The inaugural Students' Biennale was presented from 13 December 2014 to 29 March 2015 as part of the Second Kochi-Muziris Biennale, marking the beginning of what has since become the Kochi Biennale Foundation's largest and most far-reaching educational initiative.",
  "Conceived under the Foundation's Higher Education Programme in collaboration with the Foundation for Indian Contemporary Art (FICA) and the Foundation for Indian Art Education (FIAE), the Students' Biennale was established to create an alternative platform for students from art institutions across India to reflect on their practices, engage in critical dialogue, and present their work within the context of an international contemporary art exhibition.",
  "From its inception, the Students' Biennale has pursued a dual objective: to examine the diverse conditions of art education and pedagogy across India while simultaneously introducing emerging artists to the wider discursive and professional ecosystem of the Kochi-Muziris Biennale. By situating student practices within an international exhibition framework, the programme sought to foster new forms of exchange between young practitioners, educators, curators, and audiences.",
  "The first edition brought together more than 100 works by students from 37 art institutions spanning the country, including schools in Srinagar, Jabalpur, Visakhapatnam, Thrissur, Imphal, Bhubaneswar, Mysore, among many others. The participating institutions reflected the breadth of India's art education landscape from colonial-era academies established over 150 years ago, to institutions founded in the years following Independence as part of the nation's cultural development, as well as newer schools established over the past few decades.",
  "The selection process itself became a significant pedagogical undertaking. A team of 15 emerging curators travelled extensively across India over a period of three months, visiting art schools, engaging with students and faculty, and developing an understanding of the varied contexts in which artistic practices were being nurtured. Conceived as a process of peer learning, these visits encouraged dialogue rather than evaluation, allowing each curator to respond independently to the questions, urgencies, and possibilities they encountered.",
  "The research revealed the diverse realities of art education across the country ranging from infrastructural limitations and institutional challenges to the remarkable resilience, commitment, and creativity demonstrated by students working within these conditions. Rather than presenting a singular narrative, the exhibition emerged as an open-ended and discursive proposition that embraced multiple perspectives, temporalities, and regional contexts, reflecting the complexity of what it means to produce contemporary art in India.",
  "Hosted across two venues namely, Mohammed Ali Warehouse and KVA Brothers in Mattancherry, the inaugural Students' Biennale established a new model for artistic learning and exchange. It demonstrated the potential of the Biennale as a site for education as much as exhibition, creating meaningful opportunities for students to engage with national and international audiences while building lasting networks across institutions.",
  "The first edition laid the foundation for a programme that has continued to evolve through subsequent editions, expanding beyond exhibitions to include workshops, residencies, mentorships, awards, and other initiatives that support emerging artists. More than an exhibition, the Students' Biennale began an ongoing process of collective engagement with students, educators, and institutions – one that continues to shape contemporary art education in India today."
],
  team: [
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
        "Geetika Arora"
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
        "B V Suresh."
      ],
    ],
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
  "RLV ( Radha Lakshmi Vilasam) College of Music and Fine Arts, Tripunithura",
  "Institute of Music and Fine Arts, University of Kashmir, Srinagar",
  "Faculty of Visual Arts, Banaras Hindu University",
  "Department of Fine Arts, Aligarh Muslim University",
  "College of Fine Arts, JNA&FAU, Hyderabad",
  "Department of Fine Arts, Andhra University, Visakhapatnam",
  "Department of Fine Arts, Sarojini Naidu",
  "School of Arts and Communication, University of Hyderabad",
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
  "Government College of Fine Arts, Kumbakonam"
],
  heroImage: "/editions/2014-15/hero.png",
  heroImages: ["/editions/2014-15/hero.png"],
  galleryImages: [
    "/editions/2014-15/gallery-1.png",
    "/editions/2014-15/gallery-2.png",
    "/editions/2014-15/gallery-3.png",
    "/editions/2014-15/gallery-4.png",
    "/editions/2014-15/gallery-5.png",
    "/editions/2014-15/gallery-6.png",
    "/editions/2014-15/gallery-7.png",
    "/editions/2014-15/gallery-8.png",
  ],
  nextId: "2016-17",
};

/* =========================================================================
 * 2016-17: Later the atelier ate her (Figma Frame 66:920)
 * ========================================================================= */
const ED_2016_17: EditionOverviewData = {
  id: "2016-17",
  title: "Later the atelier ate her",
  subtitle: "Later the\natelier ate her\n2016 - 17",
  titleLines: ["Later the", "atelier ate her", "2016 - 17"],
  intro: [
  "Presented as part of the Third Kochi-Muziris Biennale, the Second Students' Biennale built upon the foundations established by the inaugural edition, significantly expanding its reach, ambition, and pedagogical framework. Organised by the Kochi Biennale Foundation in collaboration with the Foundation for Indian Contemporary Art (FICA) and the Foundation for Indian Art Education (FIAE), the programme continued its commitment to strengthening art education in India by creating sustained connections between art schools, students, educators, curators, and the wider contemporary art community.",
  "Conceived as more than an exhibition, the Students' Biennale operates as a long-term educational initiative that uses the international platform of the Kochi-Muziris Biennale to foster critical dialogue, collaboration, and experimentation within art institutions across the country. Central to this vision is the belief that the Biennale can serve not only as a site for exhibiting artworks, but also as a catalyst for rethinking pedagogical practices and creating lasting networks of exchange.",
  "Following a year-long research process that began in late 2015, the second edition opened on 13 December 2016 under the title Later the atelier ate her and ran concurrent to the 3rd edition of the Kochi-Muziris Biennale until 29 March 2017. The exhibition represented an unprecedented expansion of the programme, bringing together over 400 student artists from 55 art institutions across India through the work of 15 emerging curators, and unfolding across seven exhibition venues in Kochi.",
  "The participating institutions reflected the remarkable diversity of India's art education landscape, ranging from nearly two-century-old colonial academies and early twentieth-century national art schools to post-Independence institutions, polytechnic colleges, and recently established art schools. Extending from Imphal to Jabalpur, Kumbakonam to Surat, the edition sought to acknowledge the distinct histories, pedagogies, and regional contexts that shape contemporary artistic practice across the country.",
  "At the heart of the programme was an extensive process of research and peer learning. Each curator worked closely with a group of institutions over the course of a year, visiting campuses, engaging in conversations with students and faculty, and developing exhibitions that emerged from these sustained encounters. Rather than simply selecting works for display, the curators facilitated critical dialogue, collaborative projects, workshops, and new modes of artistic inquiry, transforming the exhibition into an evolving educational process.",
  "The second edition unfolded during a period of significant debate around the future of public education, artistic freedom, and democratic institutions in India. Against this broader social and political backdrop, Later the atelier ate her reflected on the role of art schools as spaces for critical thinking and collective imagination. The participating students and curators grappled with questions surrounding artistic agency, censorship, public engagement, collaboration, and the changing nature of contemporary artistic practice.",
  "The Foundation for Indian Contemporary Art (FICA) played a key role in mentoring the curatorial team through workshops and ongoing guidance, while the curators, in turn, developed collaborative platforms that encouraged students to engage in research, collective art-making, and interdisciplinary dialogue. Together, these exchanges reimagined the role of the art student not as an isolated practitioner, but as someone deeply embedded within larger social, cultural, and political realities.",
  "By expanding its geographical reach, strengthening relationships with institutions, and foregrounding education as a collaborative process, the second Students' Biennale demonstrated the transformative potential of sustained engagement between artists, educators, and students. It reaffirmed the programme's commitment to nurturing emerging practitioners while contributing to broader conversations around the future of contemporary art education in India.",
  "SB 2016-17 was presented across seven venues in the historic Mattancherry - Jew Town area of Fort Kochi: M.K. Trades, Kotachery Brothers & co., Arjuna Art Gallery, Heritage Arts, Mattancherry Temple Property, Mohammed Ali Warehouse and Fadi Hall."
],
  team: [
    [
      [
        "Curators",
        "Adwait Singh",
        "Aryakrishnan Ramakrishnan",
        "Ajit Kumar",
        "Faiza Hasan",
        "C.P. Krishnapriya",
        "Harshita Bathwal",
        "Naveen Mahantesh",
        "Noman Amouri",
        "Paribartana Mohanty",
        "Rajyashree Goody",
        "Sarojini Lewis",
        "Shatavisha Mustafi",
        "Shruti Ramlingiah",
        "Sumitra Sunder",
        "Vivek Chockalingam"
      ],
    ],
    [
      [
        "Expert Advisory Team",
        "Sudhir Patwardhan",
        "Jeebesh Bagchi",
        "Shukla Sawant",
        "Belinder Dhanoa",
        "Sarada Natarajan",
        "Rakhi Peswani",
        "Siva Kumar",
        "Indrapramit Roy",
        "Akkhitam Vasudevan",
        "B.V. Suresh in Vadodara."
      ],
    ],
  ],
  institutions: [],
  heroImage: "/editions/2016-17/hero.png",
  heroImages: ["/editions/2016-17/hero.png"],
  galleryImages: [
    "/editions/2016-17/gallery-1.png",
    "/editions/2016-17/gallery-2.png",
    "/editions/2016-17/gallery-3.png",
    "/editions/2016-17/gallery-4.png",
    "/editions/2016-17/gallery-5.png",
    "/editions/2016-17/gallery-6.png",
    "/editions/2016-17/gallery-7.png",
    "/editions/2016-17/gallery-8.png",
  ],
  nextId: "2018-19",
};

/* =========================================================================
 * 2018-19: Making as Thinking (Figma Frame 66:404)
 * ========================================================================= */
const ED_2018_19: EditionOverviewData = {
  id: "2018-19",
  title: "Making as Thinking",
  subtitle: "Making as Thinking\n2018 - 19",
  titleLines: ["Making as Thinking", "2018 - 19"],
  intro: [
  "The Third Students' Biennale, presented as part of the Fourth Kochi-Muziris Biennale, marked a significant evolution of the programme by expanding beyond the exhibition format into a broader platform for research, dialogue, and critical engagement with art education. Developed by the Kochi Biennale Foundation in collaboration with the Foundation for Indian Contemporary Art (FICA), the edition adopted a multi-layered approach that brought together an exhibition, an expanded educational programme, field-based research, workshops, and an international conference, reaffirming the Foundation's long-term commitment to strengthening contemporary art education in India.",
  "At the heart of the exhibition was the theme Making as Thinking, which proposed artistic practice as a form of inquiry and knowledge production. Rather than viewing making as the final stage of artistic creation, the exhibition foregrounded creative practice itself as a process of thinking, questioning, experimenting, and learning.",
  "The exhibition was developed through an open call for applications and was curated by a team of six curators, who selected projects by emerging artists from across India. For the first time, the Students' Biennale also broadened its geographical scope by inviting participation from students across the SAARC region, including Afghanistan, Bangladesh, Bhutan, India, Maldives, Nepal, Pakistan, Sri Lanka, and Myanmar. Production support was provided to selected participants, enabling them to realise ambitious new works and present them within the context of the Kochi-Muziris Biennale.",
  "The exhibition included around 109 projects by 200 student-artists, and was shown over seven venues in Mattancherry, between 13 December, 2018 and 29 March, 2019.",
  "Beyond the exhibition, the third edition introduced the Expanded Education Programme (EEP) which was a landmark initiative that sought to examine the broader ecosystems from which artistic practices emerge. Conceived as a long-term research project, the EEP investigated the conditions of art education by engaging directly with institutions, educators, students, and local learning environments across India.",
  "The programme emerged at a time when conversations around the future of art education were gaining urgency internationally. Questions surrounding accessibility, relevance, institutional structures, curriculum, public education, and the evolving role of artists and educators informed the development of the initiative. The Expanded Education Programme sought to situate these global discussions within the specific realities of higher art education in India, creating opportunities for critical reflection while remaining attentive to local contexts and pedagogical practices.",
  "As part of the programme, nine workshops were organised at art schools and educational institutions across the country. Led by artists, curators, performers, art historians, institution-builders, and educators, these workshops created spaces for collaborative learning, experimentation, and dialogue between students and teachers. Rather than prescribing uniform approaches to education, each workshop responded to the specific needs and circumstances of its host institution, encouraging participants to imagine new possibilities for artistic learning and practice.",
  "The research and conversations generated through the Expanded Education Programme culminated in the international conference Pedagogical In-Flux and the Art of Education, held in Kochi on 21 - 22 March 2019. Bringing together artists, educators, researchers, and pedagogues from India and abroad, the conference explored the rapidly changing landscape of art education and examined themes including learner-centred pedagogy, artist-led teaching, material practices, technologies of education, and the relationship between place and artistic knowledge production.",
  "The third Students' Biennale represented a pivotal moment in the evolution of the programme. By positioning education itself as a site of artistic inquiry, it expanded the role of the Biennale beyond exhibition-making to become a platform for sustained research, pedagogical experimentation, and institutional dialogue. Through its exhibition, workshops, and conference, the edition reaffirmed the importance of education as a collaborative, evolving process and contributed meaningfully to ongoing conversations about the future of art schools and artistic practice in South Asia.",
  "The outcomes of the Expanded Education Programme and the conference were subsequently documented in an online publication, creating an enduring resource for educators, researchers, artists, and institutions interested in rethinking contemporary art pedagogy."
],
  team: [
    [
      [
        "Curators",
        "Sanchayan Ghosh",
        "Shukla Sawant",
        "Shruti Ramalingaiah",
        "Krishnapriya C P",
        "K P Reji",
        "M P Nishad"
      ],
    ],
  ],
  curatorialNote: {
    title: "Curatorial Note",
    paragraphs: [
    "Conceived as a meeting ground to share ideas and experiences, to catalyse conversations about contemporary art practices, the Students Biennale 2018 seeks to foreground the work of young artists with institutional affiliations, who are on the threshold of new departures.",
    "Nested within the more expansive frame of the main Kochi Biennale, this edition of the Students' Biennale is focused on forging connecting pathways to create a common ground for artists located in South Asia. In an era of incessant pulls and thrusts in networked societies, enmeshing us within a touch-screen intimacy directed by faceless and distant corporations, what can we achieve as a first step - reaching out to those in our immediate vicinity - as creative beings who tap into the common root systems?",
    "While the studio in an institutional set-up can function as a laboratory for experiments, it can equally turn into a restrictive bind that perhaps needs to be ruptured. Would a geographic dislocation, and a space for conversations with peers create a Alexible space to question, revitalize, or even critically rethink the role of art in society? How can customary ways of working, as taught within art institutions and broader domains of visual production, be brought into conversation with each other? What kind of creative disruptions can be imagined through an unmaking of the restricted and pre-established habitus, by setting aside presuppositions and preconceived notions, and willfully making use of present structure/s of sensorium? What kind of a community can be created around the idea of shared values and the quest for new forms of knowledge. making? Visualized as a test site for new ideas through a peer-to-peer critical engagement and art practice as research, the Students Biennale provides a platform for the cultivation of long-term links for creative knowledge-building. With a communitarian outlook, it continues to emphasize individual agency, allowing for different voices to arise and grow.",
    "Each institution from which students have been selected has its own pedagogical framework. Some remain attached to remnants of a colonial-era pedagogy, while others have developed complex engagements with local exigencies and alternative frameworks that emerged from an internationalist engagement. Within this matrix, each project carries local and contextual layers. The projects are also an attempt to expand beyond studio practice, into a reflection of art as a political act of meaning-making, embedded in the working of materials."
],
  },
  downloads: [
    {
      title: "SB Catalogue 2018 -19",
      label: "Download",
      href: "#",
    },
    {
      title: "SB Workshops Report 2018 -19",
      label: "Download",
      href: "#",
    },
  ],
  institutions: [],
  heroImage: "/editions/2018-19/hero.png",
  heroImages: ["/editions/2018-19/hero.png"],
  galleryImages: [
    "/editions/2018-19/gallery-1.png",
    "/editions/2018-19/gallery-2.png",
    "/editions/2018-19/gallery-3.png",
    "/editions/2018-19/gallery-4.png",
    "/editions/2018-19/gallery-5.png",
    "/editions/2018-19/gallery-6.png",
    "/editions/2018-19/gallery-7.png",
    "/editions/2018-19/gallery-8.png",
  ],
  nextId: "2020-21",
};

/* =========================================================================
 * 2020-21: States of Disarray: Practice as Restitution (Figma Frame 66:657)
 * ========================================================================= */
const ED_2020_21: EditionOverviewData = {
  id: "2020-21",
  title: "States of Disarray: Practice as Restitution",
  subtitle: "States of Disarray:\nPractice as Restitution\n2020 - 21",
  titleLines: [
    "States of Disarray:",
    "Practice as Restitution",
    "2020 - 21",
  ],
  intro: [
  "The fourth edition of the Students' Biennale marked a significant moment in the programme's history as it responded to the unprecedented challenges brought about by the COVID-19 pandemic. Reimagined as an entirely digital initiative, the edition reaffirmed the Kochi Biennale Foundation's commitment to supporting art education by ensuring that students across India continued to have access to mentorship, dialogue, and opportunities for exhibition despite the limitations imposed by the global health crisis.",
  "As the Foundation's largest educational initiative, the Students' Biennale has consistently sought to complement and strengthen fine arts education in India by creating platforms for experimentation, critical inquiry, and exchange. During a time when educational institutions and artistic practices were profoundly disrupted, the fourth edition expanded this commitment by developing new forms of accessibility and rethinking how meaningful engagement could take place in virtual spaces.",
  "Curated by a team of artists and educators namely Adip Dutta, Archana Hande, Manoj Vyloor, Suresh K. Nair, and Vasudha Thozhur; the edition drew upon the curators' extensive experience as practitioners and teachers to create an exhibition that responded thoughtfully to the realities facing students and emerging artists.",
  "Presented entirely online, the exhibition, titled States of Disarray: Practice as Restitution, opened on 21 February 2021. Conceived as a response to the profound environmental, political, and social upheavals of the time, the exhibition explored how artistic practice could become a form of reflection, resilience, and restitution in moments of uncertainty. While each curatorial section approached these questions from a distinct perspective, they collectively reflected on the shared conditions of disruption, adaptation, and care that defined the period.",
  "Beyond the online exhibition, the fourth edition continued to foster dialogue through an extensive programme of workshops, presentations, and interactions led by the curatorial team alongside invited artists, educators, and guest faculty. All aspects of the programme from curatorial discussions and studio interactions to exhibition development and presentation were conducted remotely, demonstrating the possibilities of collaborative learning and artistic exchange across digital platforms.",
  "Recognising the challenges of working online, the curatorial team worked closely with participating students throughout the process, providing guidance on digital presentation, documentation, and accessible modes of exhibiting. The resulting exhibition became not only a showcase of student practices from across the country but also a testament to the adaptability, resilience, and creativity of a new generation of artists navigating an extraordinary moment in history.",
  "The fourth Students' Biennale stands as an important chapter in the programme's evolution, demonstrating that meaningful artistic engagement, mentorship, and community can continue to flourish even in times of profound disruption.",
  "The interactive online exhibition remains accessible as an archive of this edition."
],
  curatorBios: [
  {
    "name": "Adip Dutta",
    "bio": "Adip Dutta is an artist based in Kolkata. He studied at the University of Calcutta and Rabindra Bharati University, Kolkata. His work has been shown in solo and group exhibitions in Kolkata, Dubai, London, Tokyo and New Delhi, among other places. Adip is also a member of the Faculty of Arts at Rabindra Bharati University."
  },
  {
    "name": "Archana Hande",
    "bio": "Archana Hande holds degrees in Fine Arts from Visva Bharati, Santiniketan and MS University, Baroda. Solo exhibitions of her work have been held in Bombay, Perth, Rome and New Delhi. She has also shown in numerous biennials and galleries, including in Jakarta, Guangzhou, and Yokohama. Archana is currently based in Bangalore."
  },
  {
    "name": "Manoj Vyloor",
    "bio": "Manoj Vyloor is an artist working between Kochi and Thiruvananthapuram. He completed his post-graduation in Graphic Arts from MS University, Baroda and is currently the Principal of the College of Fine Arts, Thiruvananthapuram. He has had solo exhibitions in Kochi, Baroda and Paris, and has also shown in exhibitions around the world, including in London, New Delhi, Dubai, Kuala Lumpur and Bombay."
  },
  {
    "name": "Suresh K Nair",
    "bio": "Suresh K Nair has studied at the Institute of Mural Painting, Guruvayur, FTII, Pune, Visva Bharati University, Santiniketan, and Temple University, Philadelphia. His mural work can be seen in several countries besides India, including the UK, Bangladesh, USA, Portugal and the UAE. Suresh teaches at the Faculty of Visual Arts, Banaras Hindu University, Banaras."
  },
  {
    "name": "Vasudha Thozhur",
    "bio": "Vasudha Thozhur studied at the College of Arts and Crafts, Madras, and at the School of Art and Design at Croydon College, UK. Her work has been shown in exhibitions around the world, including in Berlin, Bombay, Bern, and Chicago. Her institutional work has involved teaching and juries at MSU Baroda, NID Ahmedabad and IICD Jaipur. She presently teaches at the Shiv Nadar University, Dadri."
  }
],
  team: [],
  institutions: [],
  heroImage: "/editions/2020-21/hero.png",
  heroImages: ["/editions/2020-21/hero.png"],
  galleryImages: [
    "/editions/2018-19/gallery-1.png",
    "/editions/2018-19/gallery-2.png",
    "/editions/2018-19/gallery-3.png",
    "/editions/2018-19/gallery-4.png",
    "/editions/2018-19/gallery-5.png",
    "/editions/2018-19/gallery-6.png",
    "/editions/2018-19/gallery-7.png",
    "/editions/2018-19/gallery-8.png",
  ],
  nextId: "2022-23",
};

/* =========================================================================
 * 2022-23: In the Making (Figma Frame 66:256)
 * ========================================================================= */
const ED_2022_23: EditionOverviewData = {
  id: "2022-23",
  title: "In the Making",
  subtitle: "In the Making\n2022 - 23",
  titleLines: ["In the Making", "2022 - 23"],
  intro: [
  "The 2022-23 Students’ Biennale programme emerged under the curatorial mentorship, workshops and reviews by seven mid-career curators with regional and international experience. The fifth edition of Students’ Biennale, titled ‘In the Making’, is led by Afrah Shafiq, Amshu Chukki, the Anga Art Collective, Arushi Vats, Premjish Achari, Suvani Suri and Saviya Lopes & Yogesh Barve, along with independent projects by artists Nasir Ahmad Sheikh, Malik Irtiza, Sadaf Sawlath and Aurooj Nasir. Each curator was assigned a minimum of three states for their research, college visits, workshops and project shortlisting. This edition invited students to present ideas, works in progress, collaborations and finished works along with material developed during the workshops, resulting in a total of 50 projects.",
  "Presented as part of the Fifth Kochi-Muziris Biennale, this edition marked the return of the programme to a physical exhibition following the disruptions of the COVID-19 pandemic. It reflected on emergence, process, experimentation, and transformation, foregrounding artistic practice as something continually unfolding rather than arriving at fixed conclusions encouraging students to think of the exhibition not simply as a presentation of completed works, but as an extension of research, learning, and artistic inquiry.",
  "The fifth edition also strengthened the Students' Biennale's role as a platform for dialogue between emerging practitioners and the wider contemporary art community. Through interactions with artists, curators, educators, researchers, and visitors, participants were encouraged to situate their practices within broader conversations surrounding contemporary art and its relationship to the social, cultural, political, and ecological realities of the present.",
  "More than an exhibition, In the Making reaffirmed the Students' Biennale as a space for learning, experimentation, and collective exchange. By bringing together diverse voices from across the country, the edition continued the programme's long-standing commitment to nurturing the next generation of artists and contributing to the ongoing evolution of art education in India."
],
  curatorBios: [
  {
    "name": "Afrah Shafiq",
    "bio": "Afrah Shafiq is a Goa-based multimedia artist. Her work emerges from extensive field research, documentary practices and archival material. It ruptures existing narratives, seeks the invisible, and creates new, subversive ways of looking at the familiar. Her work combines text, sound, animation, code, interactivity and the handmade, and maintains poetry within technology. She is currently a fellow at the Field Research Programme of the Garage Museum of Contemporary Art in Moscow."
  },
  {
    "name": "Amshu Chukki",
    "bio": "Amshu Chukki is a multidisciplinary artist from Bengaluru who investigates new ways to articulate ideas of landscape and cities lying between the visible and not-so-visible interconnections between life, cinema, urbanity, infrastructure, politics, and fiction. In using an array of different media, various textures of material and location converge in his work in the conversation with history, fantasy, site and resistance. His second solo show \"Different Danny and Other Stories\" was recently shown at Chatterjee & Lal, Mumbai."
  },
  {
    "name": "Anga Art Collective",
    "bio": "Assam-based Anga Art Collective was founded in 2010, to critically engage with visuality and materiality based on the geographical and social landscape. Through regional and cultural specificities, the group examines the potential of artistic responses borne of them. They nurse the notion of a studio space breaking itself to become a process, imagining a fluid structure for the collective rather than a closed ensemble. They believe in sharing knowledge and collaborating with rural communities, academics, and activists."
  },
  {
    "name": "Arushi Vats",
    "bio": "Arushi Vats is a curator and writer based in New Delhi, India. Her essays have been published in Art India Magazine, Runway Journal, Alternative South Asia Photography, LSE International History, Critical Collective, Write | Art | Connect; and in catalogues and anthologies by Serendipity Arts Foundation, New Delhi; Museum of Art and Photography, Bangalore \\(forthcoming, December 2022\\). She has attended residencies at La Napoule Art Foundation, France \\(2022\\) and the digital Momus Emerging Critics Residency \\(2021\\)."
  },
  {
    "name": "Premjish Achari",
    "bio": "Premjish Achari teaches art history and theory at Shiv Nadar University, Greater Noida. He initiated Future Collaborations, a platform to promote theoretically and politically informed curation as an essential aspect of contemporary art practice. He recently curated All Canaries Bear Watching, part of the Indo UK collaboration GRID Heritage Project, SAA/JNU, Delhi \\(2022\\), and was editorial supervisor of Lokame Tharavadu \\(‘The World Is One Family’, 2021\\), organised by the Kochi Biennale Foundation."
  },
  {
    "name": "Saviya Lopes and Yogesh Barve",
    "bio": "Saviya Lopes and Yogesh Barve are visual art practitioners at Clark House Initiative, Mumbai. The core of their practice lies in creating visuals and engaging in conversations that are part of their own social and cultural experiences. The intersection of their practices is in archives, history, community and education. Saviya and Yogesh were both invited to the 11th Gwangju Biennale as fellows for the Eighth Climate \\(what does art do?\\) Forum in 2016."
  },
  {
    "name": "Suvani Suri",
    "bio": "Suvani Suri is an artist/ researcher, working with sound, text, and intermedia assemblages and is actively engaged in thinking through listening. Her practice is informed by the techno-politics of sound, aural/oral histories and critical imaginations activated by the relational and speculative capacities of voice. Alongside, she composes for video/ performance works and her pedagogical interests conflate with a sustained inquiry into the digital and sonic sensorium."
  }
],
  team: [],
  institutions: [],
  institutionsWithArtists: [
  {
    "institution": "Chitrakala Parishath, Bangalore",
    "artists": "Lakshya Bhargava, Krishna Murthy KV"
  },
  {
    "institution": "Goa College of Art, Goa",
    "artists": "Ashita Matondkar, Nehal Parker, Sneha Vadkar, Sahil Naik, Vihang Nagvekar, Shubham Chari, Siddhesh Naik, Firuza Rodrigues, Bhavna Bhati, Prabhav Gaonkar, Prathmesh Velip, Uttara Anglo,  Ashish Phaldesai"
  },
  {
    "institution": "College of Art, Delhi",
    "artists": "Himani Nain, Shirankhla"
  },
  {
    "institution": "Government College of Art, Chandigarh",
    "artists": "Jashandeep Kaur"
  },
  {
    "institution": "Government College of Art & Crafts, Khallikote, Odisha",
    "artists": "Sangita Nayak"
  },
  {
    "institution": "Government College of Art and Craft, Kolkata",
    "artists": "Chris Basumatary, Neelopol Dey"
  },
  {
    "institution": "Government College of Arts and Crafts, Agartala, Tripura",
    "artists": "Vijit Sinha"
  },
  {
    "institution": "Government College of Fine Arts, Chennai",
    "artists": "Mirudhula Eswar"
  },
  {
    "institution": "Government College of Fine Arts, Jabalpur",
    "artists": "Shubham Raj Ahirwar"
  },
  {
    "institution": "Government College of Fine Arts, Kumbakonam",
    "artists": "A Livingstan, V Sivagnanam"
  },
  {
    "institution": "Government College of Fine Arts, Kerala, Thiruvananthapuram",
    "artists": "Celin Jacob V"
  },
  {
    "institution": "Government Institute of Fine Arts, Indore",
    "artists": "Arushi Yeotikar, Mona Sharma"
  },
  {
    "institution": "Government Johnson College, Aizawl, Mizoram",
    "artists": "Elizabeth Lalruatdiki, F. Lalremkima"
  },
  {
    "institution": "Delhi University",
    "artists": "Christina Pang, Eden Lhamu Bhutia"
  },
  {
    "institution": "Rajasthan University",
    "artists": "Nehal Verma"
  },
  {
    "institution": "Andhra University",
    "artists": "Rabab Abizer, Eswarrao Keesarajodu"
  },
  {
    "institution": "Banaras Hindu University",
    "artists": "Garima Yadav, Pulak Sarkar, Rajat Pandey"
  },
  {
    "institution": "Aligarh Muslim University",
    "artists": "Alfarah Sameen, Saman Ali, Sufi Yazdani, Sajan"
  },
  {
    "institution": "Ambedkar University, New Delhi \\(incl. School of Culture and Creative Expressions\\)",
    "artists": "Vanshika Babbar, Kulsoom Khan, Tanya Maheshwari"
  },
  {
    "institution": "Jamia Milia Islamia University, New Delhi",
    "artists": "Simeen Anjum"
  },
  {
    "institution": "Rabindra Bharati University",
    "artists": "Pintu Das"
  },
  {
    "institution": "Kannada University, Hampi",
    "artists": "Kamalendu Paul"
  },
  {
    "institution": "Sree Sankaracharya University of Sanskrit Kalady, Kerala",
    "artists": "Nandu Krishna"
  },
  {
    "institution": "Himachal Central University, Himachal Pradesh",
    "artists": "Harsh Kumar"
  },
  {
    "institution": "Rajiv Gandhi University, Arunachal Pradesh",
    "artists": "Ejum Riba, Nabam Hema, Taba Yaniya"
  },
  {
    "institution": "Royal Global University, Guwahati, Assam",
    "artists": "Bode Swuro"
  },
  {
    "institution": "Shiv Nadar University, Dadri",
    "artists": "Lipi Wadhawan, Shikha Soni, Aastha Dutta"
  },
  {
    "institution": "Pandit Lakhmi Chand State University of Performing and Visual Arts, Rohtak",
    "artists": "Anjali Grewal, Sudiksha Vij"
  },
  {
    "institution": "Potti Sriramulu Telugu University, Hyderabad",
    "artists": "Kovviri Rajasekhar, K Santha Devi"
  },
  {
    "institution": "The Maharaja Sayajirao University of Baroda, Vadodara",
    "artists": "Shiv Sankar, Pritish Bali, Sayantan Kundu, Ritwika Ganguly, Rokesh Krushna Patil, Anikesa Dhing, Subham Sahu, Sneha Lakhotia, Thangshampha Maku"
  },
  {
    "institution": "Pachhunga University College, Aizawl, Mizoram",
    "artists": "Francis Lalramdingngheta, Lalrinchhani"
  },
  {
    "institution": "Kala Bhavana, Visva Bharati University, Santiniketan",
    "artists": "Maya Mima, Pritam Das, Kiran Mungekar, Biswajit Thakuria, Ajay Kumar Gorai"
  },
  {
    "institution": "Indira Kala Sangeet Vishwavidyalaya, Khairagarh, Chhattisgarh",
    "artists": "Ankita Sahu, Divya Chandra, Khushboo Gupta, Malvika Mishra, Muskan Parekh, Pritha Mallick"
  },
  {
    "institution": "National Institute of Design \\(NID\\), Gandhinagar",
    "artists": "Kush Kukreja, Nourin C. S"
  },
  {
    "institution": "National Institute of Fashion and Technology, Delhi",
    "artists": "C. Sailo"
  },
  {
    "institution": "Ken School, Bangalore",
    "artists": "Sowmya T"
  },
  {
    "institution": "S N School, Hyderabad",
    "artists": "Meera K M, Mothe Mahesh, Sanal P T"
  },
  {
    "institution": "Rajasthan School of Arts",
    "artists": "Amar Prajapat"
  },
  {
    "institution": "Surat School of Fine Arts, VNSGU, Surat",
    "artists": "Nilofar Sheikh"
  },
  {
    "institution": "Sir Jamsetjee Jeejeebhoy School of Art, Mumbai, Maharashtra",
    "artists": "Akanksha Patil, Akshay Dange, Asima Sasma, Ayushi Panchal, Biswajit Giri, Dheeraj Jadhav, Manjit Gogoi, Prasad Mestri, Priyanka Kumar, Riya Chandwani, Rushi Chandgude, Shivani Dubey, Shweta Urane"
  },
  {
    "institution": "Amity School of Fine Arts, Mumbai, Maharashtra",
    "artists": "Sonali Singh, Zainab Parikh"
  },
  {
    "institution": "MIT School of Fine Arts and Applied Arts, Pune, Maharashtra",
    "artists": "Gauri Kulkarni, Riyanka Das, Sayali Khairnar"
  },
  {
    "institution": "CAVA, Mysore",
    "artists": "Niranjana G M, Monika Srinivas, Ranjith Kumar, Sushrutha D"
  },
  {
    "institution": "Centre for Environmental Planning and Technology, Ahmedabad",
    "artists": "Abishai Choragudi, Dev Desai, Dhyani Savsaviya, Prakruti Parsiya, Tanvi Prasad, Bhavya Trivedi"
  },
  {
    "institution": "Sri Aurobindo Centre for Art and Communication, New Delhi",
    "artists": "Lourdes Mary S"
  },
  {
    "institution": "Film and Television Institute of India, Pune, Maharashtra",
    "artists": "Adheep Das\\\nColleges"
  },
  {
    "institution": "Imphal College, Imphal, Manipur",
    "artists": "Lulu Kayheich"
  },
  {
    "institution": "KMEA College of Architecture, Kerala",
    "artists": "24 students \\(2019 Batch\\)"
  },
  {
    "institution": "St. Anthony's College, Shillong, Meghalaya",
    "artists": "Adriana Wahlang Syiemlieh, Batyngkai Kharsohtun, Iaiakmenlang Lyngdoh, Joziah Ryan K Lyngdoh, Neonette Sharon Hynniewta, Saphidaniewkor M Diengdoh, Wanrikynti Kharlyngdoh"
  },
  {
    "institution": "Vasai Vikasini College of Visual Arts, Vasai, Maharashtra",
    "artists": "Elian Dinis"
  },
  {
    "institution": "Rachana Sansad Academy of Fine Art, Mumbai",
    "artists": "Purva Pore, Shweta Anand Patankar"
  },
  {
    "institution": "SNDT, Department of Drawing and Painting, Mumbai, Maharashtra",
    "artists": "Vaishnavi Dhargalkar"
  },
  {
    "institution": "Ambedkar University Delhi",
    "artists": "Malik Irtiza   |   University of Kashmir, Jammu and Kashmir — Aurooj Nasir, Nasir Hassan, Sadaf Sawlath"
  }
],
  downloads: [
    {
      title: "SB Catalogue 2022 -23",
      label: "Download",
      href: "#",
    },
  ],
  heroImage: "/editions/2022-23/hero.png",
  heroImages: ["/editions/2022-23/hero.png"],
  galleryImages: [],
  nextId: "2025-26",
};

export const EDITIONS_BY_YEAR: Record<string, EditionOverviewData> = {
  "2014-15": ED_2014_15,
  "2016-17": ED_2016_17,
  "2018-19": ED_2018_19,
  "2020-21": ED_2020_21,
  "2022-23": ED_2022_23,
};

export const EDITIONS_FALLBACK_ORDER: readonly EditionOverviewData[] = [
  ED_2022_23,
  ED_2020_21,
  ED_2018_19,
  ED_2016_17,
  ED_2014_15,
];

export function getEditionOverview(yearId: string): EditionOverviewData {
  if (EDITIONS_BY_YEAR[yearId]) {
    return EDITIONS_BY_YEAR[yearId];
  }

  return {
    id: yearId,
    title: "Students' Biennale",
    subtitle: yearId.replace("-", "–"),
    titleLines: ["Students' Biennale", yearId.replace("-", "–")],
    intro: [EDITION_SHORT, EDITION_MORE],
    team: TEAM_COLS,
    institutions: [],
    galleryImages: [
      "/editions/2014-15/gallery-1.png",
      "/editions/2014-15/gallery-2.png",
      "/editions/2014-15/gallery-3.png",
      "/editions/2014-15/gallery-4.png",
      "/editions/2014-15/gallery-5.png",
      "/editions/2014-15/gallery-6.png",
      "/editions/2014-15/gallery-7.png",
      "/editions/2014-15/gallery-8.png",
    ],
  };
}

const typedSearchTags = editionSearchTagsData as Record<string, EditionSearchTags>;

export function getEditionSearchTags(years: string): EditionSearchTags {
  return (
    typedSearchTags[years] || {
      title: "",
      curators: [],
      team: [],
      artists: [],
      artworks: [],
      venues: [],
      institutions: [],
    }
  );
}

export function searchIndexFromTags(
  yearId: string,
  tags: EditionSearchTags,
): SearchIndexEntry[] {
  const out: SearchIndexEntry[] = [];
  for (const c of tags.curators) {
    out.push({
      entity_type: "curator",
      entity_id: `curator-${yearId}-${c}`,
      title: c,
      route: `/editions/${yearId}/curators`,
      subtitle: "Curator",
    });
  }
  for (const t of tags.team) {
    out.push({
      entity_type: "team",
      entity_id: `team-${yearId}-${t}`,
      title: t,
      route: `/editions/${yearId}`,
      subtitle: "Team",
    });
  }
  for (const a of tags.artists) {
    out.push({
      entity_type: "artist",
      entity_id: `artist-${yearId}-${a}`,
      title: a,
      route: `/editions/${yearId}/artists`,
      subtitle: "Artist",
    });
  }
  for (const w of tags.artworks) {
    out.push({
      entity_type: "artwork",
      entity_id: `artwork-${yearId}-${w}`,
      title: w,
      route: `/editions/${yearId}/artworks`,
      subtitle: "Artwork",
    });
  }
  for (const v of tags.venues) {
    out.push({
      entity_type: "venue",
      entity_id: `venue-${yearId}-${v}`,
      title: v,
      route: `/editions/${yearId}/venue`,
      subtitle: "Venue",
    });
  }
  return out;
}

export function mergeTagSearchIndex(args: {
  years: string;
  searchIndex: SearchIndexEntry[];
  institutions?: string[];
  venues?: any[];
}): SearchIndexEntry[] {
  const tags = getEditionSearchTags(args.years);
  const tagEntries = searchIndexFromTags(args.years, tags);
  const seen = new Set<string>();
  const merged: SearchIndexEntry[] = [];

  for (const entry of args.searchIndex) {
    const key = `${entry.entity_type}:${entry.title.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(entry);
    }
  }

  for (const entry of tagEntries) {
    const key = `${entry.entity_type}:${entry.title.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(entry);
    }
  }

  return merged;
}
