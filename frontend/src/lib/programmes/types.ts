import type { ArtworkCard, AwardWinner, PastWorkshop } from "../../data/site";
import type { ResidencySlide } from "../../components/ResidenciesBand";

export type ProgrammeStatus = "loading" | "ready";

export type UpcomingWorkshop = {
  id: string;
  slug: string;
  title: string;
  date: string;
  place: string;
  blurb: string;
  image: string;
};

export type AwardArtist = {
  name: string;
  institution: string;
  personId?: string;
};

export type AwardWinnerCard = AwardWinner & {
  image: string;
  id?: string;
  artists?: AwardArtist[];
  year?: string;
  venue?: string;
  dimensions?: string;
  materials?: string[];
  description?: string;
  curator?: string;
};

export type AwardWinnerRow = {
  id: string;
  programme_id: string;
  artwork_id: string;
  artwork_title: string | null;
  sort_order: number;
  active: boolean;
  artists: {
    person_id: string;
    name: string;
    institution: string | null;
    sort_order: number;
  }[];
};

export type RazaScholar = {
  id: string;
  name: string;
  image: string;
};

export type RazaProgramme = {
  title: string;
  subtitle: string;
  intro: string[];
  scholars: RazaScholar[];
  closing: string[];
};

export type ResidencyProgramme = {
  id: string;
  slug: string;
  title: string;
  host: string;
  period: string;
  venue: string;
  awardees: string;
  copy: string;
  description: string;
  heroImage: string;
  galleryImages: string[];
  moreHref: string;
};

export type MappedProgrammes = {
  upcomingWorkshops: UpcomingWorkshop[];
  pastWorkshops: PastWorkshop[];
  awardsInternational: AwardWinnerCard[];
  awardsNational: AwardWinnerCard[];
  raza: RazaProgramme;
  residencies: ResidencyProgramme[];
};

export type ProgrammeFacilitatorRow = {
  display_name: string | null;
  sort_order: number;
};

export type ProgrammeRow = {
  id: string;
  subtype: "workshop" | "residency" | "national-award" | "international-award";
  state: "upcoming" | "past";
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  dates: string | null;
  place: string | null;
  host: string | null;
  awardees: string | null;
  sort_order: number | null;
  published: boolean;
  programme_facilitators: ProgrammeFacilitatorRow[] | null;
};

export type ProgrammeAsset = {
  entityId: string;
  role: string;
  url: string;
  sortOrder: number;
};

export type { ArtworkCard, AwardWinner, PastWorkshop, ResidencySlide };
