import { LATEST_EDITION, PRESS } from "../../data/site";
import { peekPressItems } from "../pressCms";
import type { MappedProgrammes } from "../programmes/types";

export type UpdateCardMode = "content" | "internal" | "external";

export type LinkTargetKind =
  | "section"
  | "workshop"
  | "residency"
  | "award"
  | "press"
  | "custom";

export type UpdateCardLinkOption = {
  /** Stable value stored in link_target_id (kind is separate). */
  id: string;
  kind: LinkTargetKind;
  group: string;
  label: string;
  href: string;
  meta?: string;
};

const SECTION_LINKS: UpdateCardLinkOption[] = [
  {
    id: "workshops",
    kind: "section",
    group: "Sections",
    label: "Workshops (upcoming)",
    href: "/programmes#workshops",
  },
  {
    id: "past-workshops",
    kind: "section",
    group: "Sections",
    label: "Past workshops",
    href: "/programmes/past-workshops",
  },
  {
    id: "residencies",
    kind: "section",
    group: "Sections",
    label: "Residencies",
    href: "/programmes#residencies",
  },
  {
    id: "awards",
    kind: "section",
    group: "Sections",
    label: "Awards",
    href: "/programmes#awards",
  },
  {
    id: "raza",
    kind: "section",
    group: "Sections",
    label: "Raza Scholarship",
    href: "/programmes/raza-scholarship",
  },
  {
    id: "press",
    kind: "section",
    group: "Sections",
    label: "Press hub",
    href: "/press",
  },
];

export function buildInternalLinkOptions(
  programmes: MappedProgrammes | null | undefined,
): UpdateCardLinkOption[] {
  const options: UpdateCardLinkOption[] = [...SECTION_LINKS];

  for (const w of programmes?.upcomingWorkshops ?? []) {
    options.push({
      id: w.id,
      kind: "workshop",
      group: "Workshops — Upcoming",
      label: w.title,
      href: "/programmes#workshops",
      meta: w.date || undefined,
    });
  }

  for (const w of programmes?.pastWorkshops ?? []) {
    options.push({
      id: w.id,
      kind: "workshop",
      group: "Workshops — Past",
      label: w.title,
      href: `/programmes/past-workshops/${w.id}`,
      meta: w.year || undefined,
    });
  }

  for (const r of programmes?.residencies ?? []) {
    options.push({
      id: r.slug || r.id,
      kind: "residency",
      group: "Residencies",
      label: r.title,
      href: `/programmes/residencies?residency=${encodeURIComponent(r.slug || r.id)}`,
      meta: r.host || undefined,
    });
  }

  for (const a of programmes?.awardsInternational ?? []) {
    if (!a.artworkId) continue;
    options.push({
      id: a.artworkId,
      kind: "award",
      group: "Awards — International",
      label: a.artwork,
      href: `/editions/${LATEST_EDITION.id}/artworks/${a.artworkId}`,
      meta: a.name,
    });
  }

  for (const a of programmes?.awardsNational ?? []) {
    if (!a.artworkId) continue;
    options.push({
      id: a.artworkId,
      kind: "award",
      group: "Awards — National",
      label: a.artwork,
      href: `/editions/${LATEST_EDITION.id}/artworks/${a.artworkId}`,
      meta: a.name,
    });
  }

  const cmsPress = peekPressItems();
  const pressSource = cmsPress?.length ? cmsPress : PRESS;
  for (const item of pressSource) {
    options.push({
      id: item.id,
      kind: "press",
      group: "Press",
      label: item.title,
      href: `/press?article=${item.id}`,
      meta: item.date,
    });
  }

  return options;
}

export function resolveInternalHref(
  kind: LinkTargetKind | null | undefined,
  targetId: string | null | undefined,
  options: UpdateCardLinkOption[],
): string | null {
  if (!kind || !targetId) return null;
  const match = options.find((o) => o.kind === kind && o.id === targetId);
  return match?.href ?? null;
}

export function defaultCtaLabel(mode: UpdateCardMode): string {
  if (mode === "external") return "Continue";
  if (mode === "internal") return "Know more";
  return "Read more";
}

export function cardModeLabel(mode: string): string {
  switch (mode) {
    case "content":
      return "Option 1 — Content spotlight";
    case "internal":
      return "Option 2 — Internal link";
    case "external":
      return "Option 3 — External link";
    default:
      return mode;
  }
}
