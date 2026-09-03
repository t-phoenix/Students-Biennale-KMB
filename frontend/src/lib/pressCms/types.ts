/** Public press item shape (mapped from CMS `press_items`). */
export type PressItem = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  body?: string;
  image?: string;
  url?: string;
};

export type PressCmsStatus = "loading" | "ready";
