import { PROGRAMMES_HERO_FALLBACK, type ProgrammesCover } from "./types";

export function resolveProgrammesHeroCovers(covers: ProgrammesCover[]): ProgrammesCover[] {
  if (covers.length === 0) {
    return [
      {
        id: "fallback-hero",
        image_url: PROGRAMMES_HERO_FALLBACK,
        sort_order: 0,
        show_on_home: false,
      },
    ];
  }
  return covers;
}

export function resolveHomeProgrammesBanner(covers: ProgrammesCover[]): string | null {
  if (covers.length === 0) return null;
  const flagged = covers.find((cover) => cover.show_on_home);
  return flagged?.image_url ?? covers[0]?.image_url ?? null;
}
