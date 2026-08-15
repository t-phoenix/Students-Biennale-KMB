export type HomeSectionId = "editions" | "programmes" | "press" | "about";

export type ProgrammeSectionId = "workshops" | "residencies" | "awards";

export function parseHomeHash(hash: string): HomeSectionId | null {
  const id = hash.replace(/^#/, "") as HomeSectionId;
  if (id === "editions" || id === "programmes" || id === "press" || id === "about") {
    return id;
  }
  return null;
}

export function parseProgrammeHash(hash: string): ProgrammeSectionId | null {
  const id = hash.replace(/^#/, "") as ProgrammeSectionId;
  if (id === "workshops" || id === "residencies" || id === "awards") return id;
  return null;
}

function navOffsetPx() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--nav-height")
    .trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n + 12 : 72;
}

/** Smooth-scroll to an element id, clearing the sticky nav. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - navOffsetPx();
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function scrollToSection(id: HomeSectionId) {
  scrollToId(id);
}
