import type { ProgrammesCover } from "./types";

export function resolveProgrammesHeroCovers(covers: ProgrammesCover[]): ProgrammesCover[] {
  return covers;
}

export function resolveHomeProgrammesBanner(covers: ProgrammesCover[]): string | null {
  if (covers.length === 0) return null;
  const flagged = covers.find((cover) => cover.show_on_home);
  return flagged?.image_url ?? covers[0]?.image_url ?? null;
}
