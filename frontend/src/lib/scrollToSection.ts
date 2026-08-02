import { getLenisInstance, snapEase } from "./lenisStore";

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

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector<HTMLElement>(".site-header");
  const offset = header?.offsetHeight ?? 60;
  const top = Math.round(el.getBoundingClientRect().top + window.scrollY - offset);
  const lenis = getLenisInstance();

  if (lenis) {
    lenis.scrollTo(top, {
      duration: reduce ? 0.01 : 1.05,
      easing: snapEase,
      force: true,
    });
    return;
  }

  window.scrollTo({ top, left: 0, behavior: reduce ? "auto" : "smooth" });
}
