/**
 * ARCHIVED local catalogue content (pre-Supabase / enrichment fallbacks).
 * Not imported by the app runtime. Kept for reference / re-import source only.
 * Live edition catalogue is loaded from Supabase `catalogue_snapshots`.
 */
import type { ArtistCard, ArtworkCard, CuratorCard, CuratorZone, VenueCard } from "../site";

export const CURATOR_ZONES: CuratorZone[] = [
  {
    id: "zone-1",
    label: "Zone 1",
    states: "Delhi, Goa, Gujarat, Haryana, Punjab, Rajasthan",
    curatorialAssistant: "Sahana Srikanth",
    noteTitle: "Square at the shoulders",
    noteBody:
      "As public spaces shrink and the state exercises more control, the home and the classroom begin to blur, as refuge and belonging exist alongside surveillance and boundaries. When searching for a language that is sufficient to shift institutional accounts, there emerges a trembling space: one of negotiation, disruption, and resistance.\n\nWe call upon disobedient practices that resist resolution, that listen differently. In reclaiming the domestic, the pedagogic, the material, and the technological as grounds for a collective response, how might we unlearn the hierarchies of authorship, labour, and knowledge that bind our gestures before they can even be expressed? Re-examining technology’s potential, we call to a new set of logics to incorporate play, generate criticality, and build resources.\n\nDo-it-yourself and material practices become spirited enquiries that engage with detailing systems and apparatuses. Thinking errantly invites us to work from within: to touch what has been made invisible, to turn disobedience into method and care, and imagine new collaborations.",
    curators: [
      {
        id: "savyasachi",
        name: "Savyasachi Anju Prabir",
        region: "Zone 1",
        note: "Regional mentorship · North & West",
        bio: "Savyasachi Anju Prabir has a background in film and visual anthropology. His practice engages with moving images at the intersections of film, art, and anthropology. He currently teaches film and video communication at the National Institute of Design, Ahmedabad. He has worked as a programmer and jury member for festivals such as the Freiburger Filmforum, Experimenta India, IDA Documentary Awards, and the Alpavirama International Youth Film Festival. His ongoing research explores intergenerational memory, countermapping, and multimodal pedagogy through teaching, filmmaking, and artistic research.",
        image: "/curators/savyasachi.png",
        focus: "center bottom",
      },
      {
        id: "sukanya",
        name: "Sukanya Deb",
        region: "Zone 1",
        note: "Regional mentorship · North & West",
        bio: "Sukanya Deb is a writer, editor and curator, whose interest lies in the intersections of contemporary art, digital culture, technology and their material propositions. She has worked extensively in programs within the arts sector, which has broadened her interest in generating and experimenting with existing infrastructures for support, collaborative exchange and dissemination. She established Purée Mag in 2024, in order to address critical positions in art and culture. She has been a recipient of Experimenter Generator Grant 2025, Khoj CISA Fellowship 2023, India Foundation for the Arts’ 25x25 Grant, and her writing has been featured in publications such as e-flux Education, STIRworld, ASAP | Art, Write | Art | Connect, AQNB, and others. Since 2022, she has been Programmes Manager at Shared Ecologies, an initiative of the Shyama Foundation.",
        image: "/curators/sukanya.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-2",
    label: "Zone 2",
    states: "West Bengal, Orissa, Uttar Pradesh, Chhattisgarh",
    noteTitle: "te(a)m-plurality",
    noteBody:
      "As we live through times of continued crises brewing far and near, we must ask where our\npractices stand in relation to the production, pedagogical and social models of the arts\ndominantly practiced today. Our position is not experienced by employing the lens of the past. Rather, it is steeped in the temporal realities of the continued present.\n\nHere, temporality is a state where the question of survival through the established structures of individuality now needs to be responded to by the gesture of coming together.\n\nIn this ongoing scenario, audiences, makers, as well as institutions being drawn to the idea\nof becoming teams, collectives, or communities is a form of protest in itself. While we collaboratively counter the challenges of popularised and hyper-individualised voices, the question lies within the need for collective responses towards these urgencies. Urgent matters, times, subjects, objects, or realities are travelling fragments, ultimately converging towards collective voices.\n\nEmerging from different regions, forms, classes, castes, and genders, initiating the meaning-making of such active conversations becomes the very process we wish to bring to the stakeholders. At the same time, our idea of curation depends upon these multiple factors and contributors, that are the students themselves.\n\nThrough our initiation of continuous engagements, discussions, visits, and presentations at\ndifferent institutions spanning four different states, aged systems of knowledge distribution or the lack thereof, became apparent. At the same time, the question arises: to whom does this knowledge remain accessible?\n\nOur surroundings have long embodied community movements effortlessly and certainly in the\nmargins beyond academia. Parallely, the same habitats also consist of rigid hierarchies,\nresulting in negotiations for the ownership of the same breaking out everyday. Within these\ntemporal settings, it is imperative that we subtly provoke a space that manifests in an\n“undercommon”. For the purpose of this Curatorial Note, we are putting together words of\nnegotiation, moments of urgency, as well as the re-markation of the margins through this gesture of coming together at the Students’ Biennale. Through this multimodal participatory experiment on curation, we have attempted to ponder on the artist as a connected strand within a network of networks.\n\nThis network addresses a set of urgencies in a decisive yet democratic manner. The praxis of practice becomes a form of internal dialogue and conceptual negotiation. The collective of curators work in tandem and incubate ideas, letting the teams born of an exercise breathe together. Taking from instances of “curation under curation”, we attempt to build upon the existing practices of equalisation through students becoming their own curators and curators playing the role of collaborators instead. The nexuses maintain their individuality and weaponise their voices to speak of their own pedagogies, even if only for the duration of this Biennale. The networks will surely reshape over time, spontaneously, but we envision that the teams will be beyond such rigid collaborations. They will continue from their experience having accessed the process of togetherness.",
    curators: [
      {
        id: "gabaa",
        name: "GABAA",
        region: "Zone 2",
        note: "te(a)m-plurality",
        image: "/curators/gabaa.png",
        bio: "Curated by GABAA. GABAA is an artists-led situation, existing both conceptually and physically in Santiniketan, Birbhum. It is a slow process of creating networks and communities that exchange and extend dialogues of dismantling ownerships. GABAA proposes relational care as a methodology to dilute institutional hierarchies and rethink power as collective and distributed. Its interdisciplinary, research-based practice spans site-specific work, installations, public art, and community-based engagements. Within these, roles remain fluid, shifting between artist, investigator, observer, initiator, and detective. At its core, GABAA understands intellect as collective: a shared, evolving entity beyond ownership. The collective was selected for a residency at the Jan van Eyck Academie in Maastricht, Netherlands (2026), and previously held residencies at Casa degli Artisti in Milan, Italy (2025) and Hampi Art Labs in Toranagallu, India (2025), and was a participant in the inaugural Bengal Biennale (2024–25). GAABA are: Himangshu Sarma, Rabiul Khan, Ritushree Mondal, and Surajit Mudi.",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-3",
    label: "Zone 3",
    states: "Kerala, Tamil Nadu, and Andhra Pradesh",
    noteTitle: "Liminal Grounds: A Third Space",
    noteBody:
      "This curatorial enquiry into numerous institutions from Kerala, Tamil Nadu, and Andhra Pradesh explores how young artists from these regions engage with their immediate surroundings—responding through diverse materials and processes as methodology—that reflect their learned experiences and cultural contexts. Material becomes a temporal body, which traces process, labour, entropy, and repetition. The culture of contemporary visual art knowledge reflects different interpretations that students use to engage with questions of different agencies such as the self, institution, society, art history, and cultural values in a time of transition, translation, and uncertainty.\n\nLabour of the Imagined: Far Away from Left, Centre and Right is a series of paintings by Vineetha W, explores the act of creative and physical labour beyond political binaries, examining how imagination itself becomes a site of resistance and renewal. The series reflects on the invisible work that sustains both artistic practice and collective dreaming, situated outside established ideological frameworks.\n\nA Generative (New) Naturalism—a project including works by Ashwin Sathian, Chandan Gour, and Mahalakshmi—reimagines the idea of nature by questioning how the ideals of a  human-centric body and landscape have been historically constructed. Through this project, students reinterpret embodied histories to propose critically new, evolving relationships between the human and the natural.\n\nTension of Belongings by Vaditha Hari Naik, Ponduru Yogeswar Rao, and Gorle Lokesh Kumar from Andhra Pradesh investigates the complexities of belonging within communities, where one’s identity is constantly negotiated and redefined. The series reflects on the emotional and social frictions that arise from the desire to connect while wanting to maintain individuality.\n\nBabel of the Muted by Anagha MM, Abhinand M, and Jijo Varghese is an installation that envisions a third space as a constructed Babel Tower, where multiple cultural voices exist but remain unheard. The project reflects on how silenced spaces within communities hold fragmented yet profound knowledge of culture and identity.\n\nUncanny: The Quiet Rusty Sign by Arun S and Sania Fathima explores process as methodological approach, employing rusted materials as symbolic indicators of temporal progression. Through these tactile signs, the project evokes the uncanny, where the familiar becomes strange and reveals hidden layers of memory and meaning.\n\nIn engaging with the notion of location, culture, and space, the curatorial premise draws on Homi K Bhabha’s idea of the third space: an in-between space or site of negotiation and hybridity where meanings are continuously reconstituted. Each work becomes a gesture of translation in a liminal ground: of self, community, and landscape. This perspective becomes the cultural resistance against dominant narratives and fixed identities.",
    curators: [
      {
        id: "seethal",
        name: "Dr. Seethal C. P",
        region: "Zone 3",
        note: "Regional mentorship · South",
        image: "/curators/seethal.png",
        focus: "center bottom",
      },
      {
        id: "sudheesh",
        name: "Dr Sudheesh Kottembram",
        region: "Zone 3",
        note: "Regional mentorship · South",
        image: "/curators/sudheesh.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-4",
    label: "Zone 4",
    states:
      "Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim and Tripura",
    noteTitle: "Howri",
    noteBody:
      "Northeast India has been an example of an industrial region collapsing under ecological and cultural extraction. It is a desperate attempt to contain a geographically fluid and culturally vivid region within the fold of an identity, vis-à-vis industrial, political, and cultural agendas. These agendas extend the logic of extraction, embedding industrial sentiments into community life, quietly dismantling local cultural philosophies, and disrupting long-standing structures of sustainable living. The infrastructural regime of steel, cement, and concrete demands a monolithic gaze fixated on a developmentalist reading of modernity.\n\nThe articulation of peripherality in this context can serve to build a relationship of extraction. Marginalisation, then, becomes a reading from the position of privilege. The Industrially Privileged psyche observes peripheral tendencies in every component of an ecosystem. The peripheral is always in the process of being extracted, absorbed, and redefined by an ever-distant centre.\n\nYet, the region continues to move beyond its assigned identity. It offers new possibilities of living, even amid the pressures of resource extraction and climate uncertainty. Forms of the commons and collectivity still shape how communities think and work. Deep engagement with the ecology—along with the rivers, forests, and non-human beings—remains vital to how communities sustain themselves and assert their being.\n\nThe Anga Art Collective can exist only in relation to these tensions of the Northeastern reality. It is both a privilege and a discomfort to be in this region. Thinking through these urgencies collectively is a critical need of our time. Hence, the ten artist projects we bring to the Students’ Biennale also reflect these tensions and related urgencies. Engaging with craft traditions, oral cultures, and spatial practices of the rural, our projects attempt to break the exhibitionary format. Instead, through visual, oral, and tactile means, they imagine a shared, participatory space where we can reflect on the particularity and universality of the tensions between the commons, community, and extractive regimentation.",
    curators: [
      {
        id: "anga",
        name: "Anga Art Collective",
        region: "Zone 4",
        note: "Collective mentorship across the Northeast",
        image: "/curators/anga.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-5",
    label: "Zone 5",
    states: "Maharashtra, Bihar, Jharkhand, Madhya Pradesh",
    noteTitle: "तुफानातले दिवे (Toofanatle Dive): People’s Song",
    noteBody:
      "Conceptualised as part of the exhibition-making initiative of the Secular Art Collective, this project seeks to recalibrate how scholarship and art-making intersect in a time marked by escalating violence, ecological collapse, and the steady widening of social and economic inequalities. It positions secularism not as a doctrine, but as something felt and practised: an everyday ethic. This framing questions how pedagogy that is neither neutral nor contained can nurture empathy, dissent, and critical imagination against the grain of manufactured consensus.\nThe title—तुफानातले दिवे (Toofanatle Dive)—is derived from a song by Vaman Dada Kardak and roughly translates to “lamps in the storm.” It speaks to a persistence that is not solitary, but held in solidarity. Not a singular source of light, but many flames that refuse to be extinguished, even as the storm gathers around them. There is also a sense of transmission: one lamp lighting another, drawing from longer histories shaped by the teachings of the Tathagata and the legacy of Bhim Yug. Toofanatle Dive: People’s Song locates resistance within this collective continuity of something voiced together, carried across generations, and sustained through shared presence.\n\nProjects spanning across the states of Maharashtra, Madhya Pradesh, Jharkhand and Bihar  exist within the Indian polity along tectonic plates of conflict drawn from socio-economic and cultural factors such as immigration, language, and identity. Together, these projects construct a terrain where materials and forms rooted in the everyday practices of labour, shelter, and collective work transform into languages of the secular and the shared. The chadar in its many iterations becomes more than cloth: it becomes cover, refuge, and sometimes even a fragile sanctuary. The floor-piece shifts into a site of gathering, negotiation, and common ground. Through these acts of material reconfiguration, they seek to dismantle hierarchies of isolation and privilege that persist institutionally and socially. It resists the aestheticisation of distance: what unfolds is something contingent, collaborative, and porous. It intervenes into how students and practitioners alike encounter the urgencies of the present and unsettles the hierarchies that often separate who speaks, who listens, and who belongs.\nRooted in the ethos of the Secular Art Movement grounded in Phule–Ambedkarite thought, it refuses the neutrality of aesthetics and reclaims making as a political and moral act. Solidarity in this space is not performative inclusion, but a sustained commitment to non-violence, enacted through gestures of care, collaboration, and coexistence. To create, therefore, is also to position oneself ethically, politically, and relationally.\n\nSolidarity within this framework is neither rhetorical nor symbolic. It is understood as a sustained commitment to non-violence: a willingness to remain even when things are uncomfortable. It shows up in small, deliberate acts of sharing space, listening closely, and working. Across these projects, care is privileged over spectacle, and collaboration over authorship. The act of collective creation becomes a gesture of resistance, a refusal to isolate, a weaving together of labour and care.\nIn forging a pedagogy of belonging, the exhibition proposes that learning and making are inseparable. As one feeds the other, each work carries something of the present moment—its fractures, its anxieties—while leaving room for possibility. Each work functions as both witness—bearing testimony to what defines our present—and as an invitation to conspire for the better. To belong, here, is not to be assimilated into sameness, but to participate in the continuous work of holding space for plurality, dissent, and camaraderie: an insistence that art is not a possession but a collective practice.",
    curators: [
      {
        id: "secular",
        name: "Secular Art Collective",
        region: "Zone 5",
        note: "Collective frameworks · Central India",
        image: "/curators/secular.png",
        focus: "center bottom",
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
        noteTitle: "Actors of Agency",
        noteAttribution: "Curated by Ashok Vish",
        noteBody:
          "Filmmaker Andrea Arnold—drawing from Italian neorealism—once said, “I always aim to get under the belly of a place.” She spoke of truth, of texture, explaining her choice to work with non-actors whose lived realities reflect the characters they are expected to portray. Her words carry the quiet insistence of agency, authenticity, and the trembling force of power.\n\nIn my encounters with student-artists from Karnataka and Telangana, I sensed a similar pulse: a tension between freedom and form, between the will to act and the systems that bind. Navigating family expectations, social conventions, and institutional hierarchies, these students find new possibilities to reclaim space: not just for themselves, but for others who long to be heard. Some reach beyond the human, extending their sense of agency to the natural world. They act as conduits, letting landscapes and silent histories speak through them and urging us to acknowledge our ecological responsibility.\nBy framing these student-artists as “actors”, the exhibition redefines what it means to perform a role. In Arnold’s cinema, the non-actor does not feign a life; they inhabit it, bringing the raw, unpolished texture of their world onto the screen. Similarly, these students do not merely produce art, they perform their survival and self-determination within rigid structures. Their lack of polished, institutional orthodoxy mirrors Arnold’s “under-the-belly” truth. Here, a sculpture, a photograph, or an analogue TV becomes a site of direct action. They are “actors” in the truest sociological sense: individuals possessing the power to intervene, disrupt, and rewrite their environments.\nThe projects in this exhibition manifest these exact impulses.\nPersonal and collective traumas are transformed into monumental sites of remembrance, as seen in Abhishek Kolapudi’s elegiac installation honouring drowned fisherfolk friends; Manish Kumar’s intimate documentation of surviving a lethal form of tuberculosis in an isolation ward; and Rakesh YM’s charcoal self-portraits mapping a resilient path out of isolation. Structural violence and institutional exclusion are forcefully confronted as Preeti Paari uses architectural syntax to challenge the exclusion of Paraiyar women from ritual spaces, while Tanmoy Dutta critiques the state-driven displacement of the Santal Adivasi community from their native lands. Sadia Sharmin uses delicate ceramic replicas of traditional Dhakai Jamdani sarees to expose how rising costs force working-class communities to forgo their heritage for basic survival. Identity and tradition are dynamically reclaimed through the gender-affirming sonic rituals of அணு aṇu; Banashree Vagga’s vibrant paintings celebrating the devotional practices of the Jogappas; and Snehanjali Varri’s meticulous textiles exposing deep-seated male bias.\nFinally, the vitality of the everyday world is asserted through ecological and material defence as Dindi Praveen Sagar envisions a dystopian, post-human reclamation of the polluted Musi River; Harshal Khatri uses soil and animation to weigh the absurdity of human desire against the vast power of nature; Madhu Preetha honours the fading dignity of daily-wage labour; and Umesh Manjannavar elevates the traditional Peta and Mancha as powerful symbols of rural agricultural life.\nUltimately, the distinction between student and artist dissolves. What may seem like inexperience is, in truth, a raw urgency. These young artists cease to be mere observers of their circumstances, stepping instead into their power as the true, autonomous actors of their own agency.",
        image: "/curators/ashok.png",
        focus: "center bottom",
      },
      {
        id: "chinar",
        name: "Chinar Shah",
        region: "Zone 6",
        note: "Artistic duo · regional frameworks",
        noteTitle: "Conditions of Practice",
        noteAttribution: "Curated by Chinar Shah",
        noteBody:
          "On an A2 sheet of paper, there are four pencil sketches: faces from different angles, each with a distinct expression. At the bottom, a signature appears. A closer look reveals a remark: “Good”. It is not the artist’s signature, but a professor’s remark: an inscription that marks the same surface as the artwork itself. The word stands as both an assessment and a trace, a reminder of how authority and expression coexist in the context of fine art education: sometimes uneasily within the same frame.\n\nWithin the fine art syllabi at some colleges in Karnataka, I am told, there is little room for creativity. The only space explicitly set aside for it is under a course titled “Creative”. Here, students are allowed to imagine freely, to paint, to be “creative”, as the syllabus permits.\nBetween Karnataka and Telangana, there are nearly seventy fine arts colleges; at least half are functional, and from these we received close to 400 applications. What this exhibition presents, then, is only the slightest fraction of what exists: an echo of a much larger field of student practice. The contexts in which these works are made—including the institutions, the cities, the connection to materials, the structure of the syllabus, and the fragile economics of being an artist—are inseparable from the works themselves. Each artwork bears the imprint of these conditions.\n\nA master’s student who grew up on the edge of a forest works with the forest as both context and material, its presence woven through the work with the intimacy of something lived rather than observed. For another artist pursuing a second master’s degree in the same college—less for a new qualification than for access to space and continuity of practice—the college becomes, unexpectedly, a space for sustaining work. Another student is a welder by profession and makes sculptures from materials found in their day job. One comes from a family of Ganesha idol-makers. Stepping away from this lineage of inherited craftsmanship, they now paint, translating the discipline of sculpting into gestures on a flat surface and negotiating between family expectations and their creative calling. In another college, students were away with special permission to paint festival panels for Dussera, a once-a-year chance to earn ₹15,000.\n\nMany students work on the side, and the economics of it all govern their time and academic engagement. Blood paintings have become a recent trend. It takes about five millilitres of blood to make a portrait of a beloved. The medium is difficult, fragile, and perishable, but those who master it can earn more than the meagre ₹1,000 usually paid for an A4-sized portrait. An anniversary family portrait in acrylic, however, might fetch up to ₹7,000.\n\nThese fragments of practice form a portrait of art education as lived experience where learning, labour, and livelihood converge, and where the word “Good” lingers as both measure and memory.",
        image: "/curators/chinar.png",
        focus: "center bottom",
      },
    ],
  },
  {
    id: "zone-7",
    label: "Zone 7",
    states: "Himachal Pradesh, Jammu and Kashmir, Ladakh and Uttarakhand",
    noteTitle: "for now",
    noteBody:
      "Space functions not merely as a backdrop for narrative events but as a dynamic system that recreates emotional and temporal experience. In what ways can space be understood as a narrative agent rather than as a mute container for artistic expressions, and how does this conceptualisation allow us to understand the layered temporalities embodied in works of art?\n\nThe exhibition explores these questions by foregrounding the Western Himalayan atlas of emotions—Himachal Pradesh, Uttarakhand, Ladakh, and Jammu & Kashmir—and gathers stories that reflect on what it means to live, see, feel, and create within its spatial folds, shaped by layered memories, fragile eco-systems, and the precarious horizons of its mountain ranges. The glimpses into the subtle intimacies of everyday life are explored through shifting axes of social, political, and ecological life, offering viewers textures of the space.\n\nAt an experiential pace, the students reflect upon the lived realities, everyday rituals, and embodied practices, documenting space as speculation, perception, and interpretation. for now holds a quiet insistence on the provisional, the partial, and the present. It points to the temporary that refuses closure and is contingent to an ongoing-ness that carries the weight of the passing instant. Without seeking to fix meanings or declare certainties, it invites us to see the present as fragile and to recognise that presence itself may shift.\n\nFrom the drawings of women’s experiences in Bombay Local to the riverbanks of Roorkee, we encounter questions of femininity, mobility, and labour. A performance embodies “the eye” that reverses the ethnographic gaze as objects of enquiry. A chair made from residual planks in front of a suspended window pane from a demolished house becomes a site of translation, charged with tension. Each work reveals how conflict in these terrains folds into the quotidian and stages urgencies of ecology, displacement, and visibility. Each artist brings forth a way of knowing that locally grounds their practice in what is lived, not imagined from afar.",
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
        focus: "center bottom",
      },
    ],
  },
];

export const CURATORS: CuratorCard[] = CURATOR_ZONES.flatMap((z) => z.curators);

export const ARTWORKS: ArtworkCard[] = [
  {
    id: "absence",
    title: "What absence carries",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description:
      "What absence carries traces the quiet terrain where memory, grief and body entwine. Through soft sculptures, fluid drawings, tender photographs, and stitched traces, the work attends to forms that hover between presence and disappearance, lives imagined, interrupted, or suspended. Emerging from a subconscious current that precedes language, the pieces gather gestures and stains that echo cellular growths, matrilineal rhythms, and the residues the body carries without speech. Each form reveals how value, grief, and inherited memory are tethered to roles and absences that remain unfulfilled, withheld, or imposed.\n\nWorking intuitively, the sculptures, drawings, photographs, and moving body register what lingers after rupture: textures of care, pressure, hesitation, and loss. They do not illustrate the body but listen to it, allowing fragments, smudges, and soft boundaries to surface as traces of sensation. The work moves between stillness and motion, expanding into elliptical pathways that trace the imperfect orbits of growth, inheritance and becoming. The stitched scars, layered pages and residual images ask how memory persists through matter and whether something can be considered absent if it continues to live through touch, form and feeling.",
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
    zoneId: "zone-1",
    image: "/artworks/absence.jpg",
    images: ["/artworks/absence-hero.jpg", "/artworks/absence.jpg"],
  },
  {
    id: "rubble",
    title: "The quiet beneath the rubble",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Pratik Khurkutiya", institution: "The Maharaja Sayajirao University of Baroda" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    zoneId: "zone-1",
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
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    zoneId: "zone-1",
    image: "/artworks/panic.jpg",
  },
  {
    id: "remembers",
    title: "The house that remembers",
    venue: "BMS Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "blind-command",
    title: "Blind Command A4 Collective",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "residual-marks",
    title: "Residual Marks",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Neelam Saini", institution: "Dada Lakhmi Chand State University of Performing and Visual Arts, Rohtak" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/residual-marks.jpg",
  },
  {
    id: "dar-dara-dariya",
    title: "Dar - Dara - Dariya",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Jyoti", institution: "Government College of Art, Chandigarh" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/dar-dara-dariya.jpg",
  },
  {
    id: "milk-distributors",
    title: "Milk Distributors",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Abhijit Das", institution: "Government College of Art, Chandigarh" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/milk-distributors.jpg",
  },
  {
    id: "who-is-the-printer",
    title: "Who is the print-er?",
    venue: "Arthshila Kochi",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Installation"],
    dimensions: "Dimensions variable",
    medium: "Installation",
  },
  {
    id: "root-system",
    title: "Root System Analysis",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Installation"],
    dimensions: "Dimensions variable",
    medium: "Installation",
  },
  {
    id: "root-system-arthshila",
    title: "Root System Analysis (Arthshila)",
    venue: "Arthshila Kochi",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Student Artist", institution: "Students' Biennale" }],
    materials: ["Installation"],
    dimensions: "Dimensions variable",
    medium: "Installation",
  },
  {
    id: "panopticon",
    title: "The Panopticon",
    venue: "VKL Warehouse",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [
      { name: "Ashwariya Singla", institution: "Students' Biennale" },
      { name: "Soumyaraj Acharya", institution: "Students' Biennale" },
    ],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/panopticon.jpg",
  },
  {
    id: "uncanny-rusty-sign",
    title: "Uncanny: The Quiet Rusty Sign",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [
      { name: "Sania Fathima", institution: "Students' Biennale" },
      { name: "Arun S", institution: "Students' Biennale" },
    ],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/uncanny-rusty-sign.jpg",
  },
  {
    id: "where-memories-immured",
    title: "WHERE MEMORIES ARE IMMURED",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [
      { name: "Arshaan Ali Khan", institution: "Free Thinkers Collective" },
      { name: "Haris Raza Ashraf", institution: "Free Thinkers Collective" },
    ],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/where-memories-are-immured.jpg",
  },
  {
    id: "labour-of-the-imagined",
    title: "Labour of the Imagined: Far Away from Left, Centre and Right",
    venue: "St. Andrews Parish Hall",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Vineetha W", institution: "Students' Biennale" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
    image: "/artworks/labour-of-the-imagined.jpg",
  },
  /* Tata Trusts award winners (Programmes page, Figma 1:1691/1:1692) who aren't
     otherwise part of the 2025-26 exhibited catalogue — stub records so their
     award card opens a real page, following the same placeholder pattern used
     above for entries whose catalogue copy isn't finalised yet. */
  {
    id: "staged-narratives-aswathy",
    title: "Staged Narratives",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Aswathy GS", institution: "Raja Ravi Varma College of Fine Arts, Mavelikkara, Kerala" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "ginning-justice-kailash",
    title: "Ginning Justice, 2025",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Kailash Khanjode", institution: "Government College of Art, Nagpur, Maharashtra" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "ginning-justice-sachin",
    title: "Ginning Justice, 2025",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Sachin Banne", institution: "Sir J. J. School of Art, Mumbai, Maharashtra" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "mirage-of-the-three",
    title: "Mirage of the Three, 2025",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "Abhishek Kholapudi", institution: "Suravaram Pratap Reddy Telugu University, Hyderabad" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
  {
    id: "staged-narratives-imran",
    title: "Staged Narratives",
    venue: "Venue to be confirmed",
    year: "2025 - 26",
    description: "Catalogue text for this work is being finalised.",
    artists: [{ name: "M. Imran Ahmed", institution: "Government College of Fine Arts, Chennai" }],
    materials: ["Details to follow"],
    dimensions: "Dimensions variable",
  },
];

/** Curator names for an artwork, via its curatorial zone. Empty when unassigned. */
export function curatorsForArtwork(artwork: ArtworkCard): CuratorCard[] {
  if (!artwork.zoneId) return [];
  return CURATOR_ZONES.find((z) => z.id === artwork.zoneId)?.curators ?? [];
}

/** Artworks belonging to a curatorial zone. */
export function artworksForZone(zoneId: string): ArtworkCard[] {
  return ARTWORKS.filter((a) => a.zoneId === zoneId);
}


export const VENUES: VenueCard[] = [
  {
    id: "st-andrews",
    name: "St. Andrews Parish Hall",
    address: "Elphinstone Road, Fort Kochi",
    hours: "Open during exhibition hours",
    description:
      "St. Andrew's Parish Hall, located on Elphinstone Road in Fort Kochi, is a British-era structure built in 1845 that reflects the town's colonial religious history. It originally served as a place of worship for Malayalam-speaking Protestant Christians, distinct from the European congregation that prayed at the nearby St. Francis Church. After India's independence in 1947, as the European community left Fort Kochi, the two congregations came together at St. Francis Church, and this building was gradually repurposed into what is now St. Andrew's Parish Hall. Today it functions under St. Francis CSI Church and is regularly used for weddings and community gatherings. For the sixth edition of the Kochi-Muziris Biennale, this hall was repurposed as a cultural venue to host exhibitions from the Students' Biennale and Invitations Programme. It also served as a venue for several KMB public programmes, including workshops, talks, and film screenings, while retaining its historic character.",
    image: "/venues/st-andrews.jpg",
    images: [
      "/venues/st-andrews-hero.jpg",
      "/venues/st-andrews-2.jpg",
      "/venues/st-andrews-3.jpg",
    ],
    mapUrl: "https://maps.google.com/?q=St+Andrews+Parish+Hall+Fort+Kochi",
    tourUrl: "https://maps.google.com/?q=St+Andrews+Parish+Hall+Fort+Kochi",
  },
  {
    id: "vkl",
    name: "VKL Warehouse",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    description:
      "Founded in 1935 by Vallabhdas Vasanji Mariwala, the VKL Warehouse property was once part of the ancestral home of Cochin’s Paliam family in Chendamangalam. In 1952, the property was partitioned under land reform rules and the ownership of the land was then transferred to the Mariwala family and the VKL group in 1971.",
    image: "/venues/vkl.jpg",
    images: ["/venues/vkl.jpg"],
    mapUrl: "https://maps.google.com/?q=VKL+Warehouse+Fort+Kochi",
    tourUrl: "https://maps.google.com/?q=VKL+Warehouse+Fort+Kochi",
  },
  {
    id: "bms",
    name: "BMS Warehouse",
    address: "Bazaar Road, Mattancherry",
    hours: "Open during exhibition hours",
    description:
      "Bright's Warehouse (BMS), situated on Bazaar Road in Mattancherry, is one of the historic godowns that reflects Kochi's long-standing role as a major port and trading centre along the Malabar Coast. Built to support the storage and movement of commodities such as spices, coir, timber, and other goods arriving through the nearby harbour, the warehouse formed part of the commercial infrastructure",
    image: "/venues/bms.jpg",
    images: ["/venues/bms.jpg"],
    mapUrl: "https://maps.google.com/?q=BMS+Warehouse+Mattancherry",
    tourUrl: "https://maps.google.com/?q=BMS+Warehouse+Mattancherry",
  },
  {
    id: "arthshila",
    name: "Arthshila Kochi",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    description:
      "Arthshila symbolises British rule in Kochi. It was a part of the daily life of the British in Kochi at that time as a company that sold food products imported from Britain. On October 20, 1795, Dutch rule in Kochi ended and British rule began. The Portuguese fort established in Kochi in 1503 was demolished in 1663 at the beginning of the subsequent Dutch rule.",
    image: "/venues/arthshila.jpg",
    images: ["/venues/arthshila.jpg"],
    mapUrl: "https://maps.google.com/?q=Arthshila+Kochi",
    tourUrl: "https://maps.google.com/?q=Arthshila+Kochi",
  },
  {
    id: "david-hall",
    name: "David Hall",
    address: "Parade Ground, Fort Kochi",
    hours: "Open during exhibition hours",
    description:
      "Situated on the west side of the parade ground in Fort Kochi, exemplifies Dutch architectural design, characterized by three expansive rooms, a verandah with chat benches, tall walls, wide windows, and adjacent seating areas. The building served as the residence of Henrik van Reed, the Dutch Governor of Kochi from 1669 to 1676",
    image: "/venues/david-hall.jpg",
    images: ["/venues/david-hall.jpg"],
    mapUrl: "https://maps.google.com/?q=David+Hall+Fort+Kochi",
    tourUrl: "https://maps.google.com/?q=David+Hall+Fort+Kochi",
  },
  {
    id: "space",
    name: "SPACE",
    address: "Fort Kochi, Kerala",
    hours: "Open during exhibition hours",
    description:
      "During the British administration in the 19th Century, the Indian traders in Kochi wanted to have an association, and there were discussions about the same. The history of the Indian Chamber of Commerce and Industry begins here. In 1897, a movement called \"The Cochin Native Merchants' Association\" was formed.",
    image: "/venues/space.jpg",
    images: ["/venues/space.jpg"],
    mapUrl: "https://maps.google.com/?q=Space+Gallery+Fort+Kochi",
    tourUrl: "https://maps.google.com/?q=Space+Gallery+Fort+Kochi",
  },
];


/**
 * Participating artists, in the reading order of the Figma "Edition Page_Grid_Artists"
 * frame (713:297) — 3-up, left to right, top to bottom. All are Zone 1 institutions.
 */
export const ARTISTS: ArtistCard[] = [
  { id: "ananya-gautam", name: "Ananya Gautam", institution: "National Institute of Design, Ahmedabad", zone: "Zone 1" },
  { id: "annanya-dhanda", name: "Annanya Dhanda", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "jyotismriti-bordoloi", name: "Jyotismriti Bordoloi", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "pratik-khurkutiya", name: "Pratik Khurkutiya", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "monika", name: "Monika", institution: "University of Rajasthan, Jaipur", zone: "Zone 1" },
  { id: "ambika-shirodkar", name: "Ambika Shirodkar", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "reedhvi-thanekar", name: "Reedhvi Hanumant Thanekar", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "shilpeksh-khalorkar", name: "Shilpeksh Khalorkar", institution: "The Maharaja Sayajirao University, Baroda", zone: "Zone 1" },
  { id: "unik-chari", name: "Unik Ramchandra Chari", institution: "Goa College of Art", zone: "Zone 1" },
  { id: "gargi-kumawat", name: "Gargi Kumawat", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "lalchand-prajapat", name: "Lalchand Prajapat", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "priyanka-meena", name: "Priyanka Kumari Meena", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "yash-songara", name: "Yash Songara", institution: "Rajasthan School of Art", zone: "Zone 1" },
  { id: "neelam-saini", name: "Neelam Saini", institution: "Dada Lakhmi Chand State University of Performing and Visual Arts, Rohtak", zone: "Zone 1" },
  { id: "jyoti", name: "Jyoti", institution: "Government College of Art, Chandigarh", zone: "Zone 1" },
  { id: "abhijit-das", name: "Abhijit Das", institution: "Government College of Art, Chandigarh", zone: "Zone 1" },
  { id: "anurag-singraur", name: "Anurag Singraur", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "rishabh-jain", name: "Rishabh Jain", institution: "Shiv Nadar University, Delhi/NCR", zone: "Zone 1" },
  { id: "richardson-benedict", name: "Richardson Benedict", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "sai-gitanjali-poluru", name: "Sai Gitanjali Poluru", institution: "Shiv Nadar University, Delhi/NCR", zone: "Zone 1" },
  { id: "krittika-maji", name: "Krittika Maji", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "gunnica-arya", name: "Gunnica Arya", institution: "O.P. Jindal University, Delhi/NCR", zone: "Zone 1" },
  { id: "krishan-agarwal", name: "Krishan Agarwal", institution: "Jamia Millia Islamia University, Delhi", zone: "Zone 1" },
  { id: "abhijith-raju", name: "Abhijith Raju", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "ashish-chauhan", name: "Ashish Chauhan", institution: "Ambedkar University, Delhi", zone: "Zone 1" },
  { id: "khushi-mittal", name: "Khushi Mittal", institution: "O.P. Jindal University, Delhi/NCR", zone: "Zone 1" },
];

