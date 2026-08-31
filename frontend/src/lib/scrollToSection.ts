import { syncScrollTrigger } from "./motion";
import { getLenisInstance } from "./lenisSingleton";

export type HomeSectionId = "editions" | "programmes" | "press" | "about";

export type ProgrammeSectionId = "workshops" | "residencies" | "awards";

const PROGRAMME_SECTIONS = new Set<ProgrammeSectionId>(["workshops", "awards", "residencies"]);

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
  // No extra breathing-room here (was +12): sections on Home sit directly
  // beneath a full-bleed hero band, so any gap at all reveals a sliver of it
  // under the sticky header — landing flush eliminates that entirely.
  return Number.isFinite(n) ? n : 60;
}

function lenisOffsetFor(el: HTMLElement) {
  // Programme anchors declare scroll-margin-top in Programmes.css. Lenis reads
  // those automatically when the element is passed as the target.
  if (PROGRAMME_SECTIONS.has(el.id as ProgrammeSectionId)) return 0;
  return -navOffsetPx();
}

export type ScrollToOptions = {
  /** When navigating from another route, reset scroll first so the previous
   *  page's scrollY is not applied to the new document before we animate. */
  crossPage?: boolean;
};

/** Smooth-scroll to an element id, clearing the sticky nav. Routes through the
 *  page's Lenis instance when one is mounted — pass the element itself so
 *  Lenis can honour CSS scroll-margin and use its internal animatedScroll. */
export function scrollToId(id: string, options: ScrollToOptions = {}): boolean {
  const el = document.getElementById(id);
  if (!el) return false;

  const lenis = getLenisInstance();
  const offset = lenisOffsetFor(el);

  if (lenis) {
    if (options.crossPage) {
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true });
    }

    lenis.resize();
    syncScrollTrigger();

    const snap = () => {
      lenis.resize();
      lenis.scrollTo(el, { offset, immediate: true });
    };

    lenis.scrollTo(el, {
      offset,
      onComplete: snap,
    });
    return true;
  }

  if (options.crossPage) {
    window.scrollTo(0, 0);
  }

  if (PROGRAMME_SECTIONS.has(el.id as ProgrammeSectionId)) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - navOffsetPx());
  window.scrollTo({ top, behavior: "smooth" });
  return true;
}

export function scrollToSection(id: HomeSectionId, options: ScrollToOptions = {}) {
  scrollToId(id, options);
}
