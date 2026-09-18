/** Public press item shape (mapped from CMS `press_items`). */
export type PressItem = {
  id: string;
  slug?: string;
  title: string;
  date: string;
  excerpt: string;
  body?: string;
  image?: string;
  url?: string;
  galleryImages?: string[];
};

export type PressCmsStatus = "loading" | "ready";
