/** Public press item shape (compatible with static fallback in data/site.ts). */
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

export type PressCmsStatus = "loading" | "ready";
