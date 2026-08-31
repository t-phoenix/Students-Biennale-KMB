import {
  HOME_PROGRAMMES_BANNER_FALLBACK,
  PROGRAMMES_HERO_FALLBACK,
  type ProgrammesCover,
} from "./types";

export function resolveProgrammesHeroCovers(
  covers: ProgrammesCover[],
  fallbackUrl = PROGRAMMES_HERO_FALLBACK,
): ProgrammesCover[] {
  if (covers.length === 0) {
    return [{ id: "fallback", image_url: fallbackUrl, sort_order: 0, show_on_home: false }];
  }
  return covers;
}

export function resolveHomeProgrammesBanner(
  covers: ProgrammesCover[],
  fallbackUrl = HOME_PROGRAMMES_BANNER_FALLBACK,
): string {
  if (covers.length === 0) return fallbackUrl;
  const flagged = covers.find((cover) => cover.show_on_home);
  return flagged?.image_url ?? covers[0]?.image_url ?? fallbackUrl;
}
