export type HomeCover = {
  id: string;
  image_url: string;
  artwork_name: string | null;
  artist: string | null;
  institution: string | null;
  show_artwork_name?: boolean;
  show_artist?: boolean;
  show_institution?: boolean;
};

/** Option 1 content spotlight | Option 2 internal | Option 3 external */
export type UpdateCardMode = "content" | "internal" | "external";

export type HomeUpdateCard = {
  id: string;
  slot: number;
  heading: string;
  body: string;
  detail_body: string | null;
  image_url: string | null;
  link_url: string | null;
  link_external: boolean;
  link_label: string | null;
  link_target_kind: string | null;
  link_target_id: string | null;
  card_type: UpdateCardMode | string;
};

export type HomeCms = {
  covers: HomeCover[];
  cards: HomeUpdateCard[];
};

export type HomeCmsStatus = "loading" | "ready";
