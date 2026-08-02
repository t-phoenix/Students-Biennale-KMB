export type HomeSectionId = "editions" | "programmes" | "press" | "about";

export function parseHomeHash(hash: string): HomeSectionId | null {
  const id = hash.replace(/^#/, "") as HomeSectionId;
  if (id === "editions" || id === "programmes" || id === "press" || id === "about") {
    return id;
  }
  return null;
}

export function scrollToSection(id: HomeSectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
