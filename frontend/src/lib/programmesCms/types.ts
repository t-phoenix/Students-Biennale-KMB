export interface ProgrammesCover {
  id: string;
  image_url: string;
  sort_order: number;
  show_on_home: boolean;
}

export type ProgrammesCmsStatus = "loading" | "ready";

export const PROGRAMMES_HERO_FALLBACK = "/programmes/hero.jpg";
export const HOME_PROGRAMMES_BANNER_FALLBACK = "/home/programmes-banner.jpg";
