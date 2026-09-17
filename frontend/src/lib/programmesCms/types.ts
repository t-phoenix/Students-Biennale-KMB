export interface ProgrammesCover {
  id: string;
  image_url: string;
  sort_order: number;
  show_on_home: boolean;
}

export type ProgrammesCmsStatus = "loading" | "ready";
