import { syncScrollTrigger } from "./motion";
import { getLenisInstance } from "./lenisSingleton";

export type HomeSectionId =
  | "editions"
  | "programmes"
  | "press"
  | "about"
  | "about-kbf"
  | "about-sb"
  | "about-team"
  | "about-sponsors";

export type ProgrammeSectionId = "past-workshops" | "residencies" | "awards";

const PROGRAMME_SECTIONS = new Set<ProgrammeSectionId>([
  "past-workshops",
  "awards",
  "residencies",
]);

const HOME_SECTIONS = new Set<string>([
  "editions",
  "programmes",
  "press",
  "about",
  "about-kbf",
  "about-sb",
  "about-team",
  "about-sponsors",
]);

export function parseHomeHash(hash: string): HomeSectionId | null {
  const id = hash.replace(/^#/, "");
  if (HOME_SECTIONS.has(id)) {
    return id as HomeSectionId;
  }
  return null;
}

export function parseProgrammeHash(hash: string): ProgrammeSectionId | null {
  const id = hash.replace(/^#/, "") as ProgrammeSectionId;
  if (PROGRAMME_SECTIONS.has(id)) return id;
  return null;
}

function navOffsetPx(targetId = "") {
  if (typeof window === "undefined") {
    if (targetId === "about") return 112;
    if (targetId.startsWith("about")) return 132;
    return 72;
  }
  const isMobile = window.matchMedia("(max-width: 899px)").matches;
  const prop = isMobile ? "--nav-height-mobile" : "--nav-height";
  const raw = typeof document !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue(prop).trim()
    : "";
  const n = Number.parseFloat(raw);
  const defaultNav = isMobile ? 56 : 72;
  const navHeight = Number.isFinite(n) ? n : defaultNav;
  if (targetId === "about") {
    const breathingGap = isMobile ? 24 : 40;
    return navHeight + breathingGap;
  }
  if (targetId.startsWith("about")) {
    const breathingGap = isMobile ? 40 : 60;
    return navHeight + breathingGap;
  }
  return navHeight;
}

function lenisOffsetFor(el: HTMLElement) {
  // If the target element has CSS scroll-margin-top declared, Lenis internally
  // reads that style and offsets automatically. In that case, we pass 0 so we don't double-offset.
  const style = window.getComputedStyle(el);
  const smt = Number.parseFloat(style.scrollMarginTop);
  if (Number.isFinite(smt) && smt > 0) {
    return 0;
  }
  return -navOffsetPx(el.id);
}

export type ScrollToOptions = {
  /** When navigating from another route, reset scroll first so the previous
   *  page's scrollY is not applied to the new document before we animate. */
  crossPage?: boolean;
  /** Jump without the slide. Used to correct position after late layout. */
  immediate?: boolean;
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
      immediate: options.immediate,
      onComplete: snap,
    });
    return true;
  }

  if (options.crossPage) {
    window.scrollTo(0, 0);
  }

  const behavior = options.immediate ? "auto" : "smooth";
  if (PROGRAMME_SECTIONS.has(el.id as ProgrammeSectionId)) {
    el.scrollIntoView({ behavior, block: "start" });
    return true;
  }

  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - navOffsetPx(el.id));
  window.scrollTo({ top, behavior });
  return true;
}

export function scrollToSection(id: HomeSectionId, options: ScrollToOptions = {}) {
  scrollToId(id, options);
}
