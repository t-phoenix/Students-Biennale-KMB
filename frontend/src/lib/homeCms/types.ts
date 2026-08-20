export type HomeCover = {
  id: string;
  image_url: string;
  artwork_name: string | null;
  artist: string | null;
  institution: string | null;
};

export type HomeUpdateCard = {
  id: string;
  slot: number;
  heading: string;
  body: string;
  link_url: string | null;
  link_external: boolean;
  card_type: string;
};

export type HomeCms = {
  covers: HomeCover[];
  cards: HomeUpdateCard[];
};

export type HomeCmsStatus = "loading" | "ready";
