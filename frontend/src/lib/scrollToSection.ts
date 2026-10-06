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

export type ProgrammeSectionId =
  | "workshops"
  | "past-workshops"
  | "residencies"
  | "awards";

const PROGRAMME_SECTIONS = new Set<ProgrammeSectionId>([
  "workshops",
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

function getTargetElement(id: string): HTMLElement | null {
  const el = document.getElementById(id);
  if (!el) return null;
  // If it's a section container on programmes, target its heading so
  // padding-top from previous blocks doesn't expose previous sections.
  if (PROGRAMME_SECTIONS.has(id as ProgrammeSectionId)) {
    const heading = el.querySelector<HTMLElement>(".fig-subheading, .fig-label, h1, h2");
    if (heading) return heading;
  }
  return el;
}

function navOffsetPx(targetId = "") {
  if (typeof window === "undefined") {
    if (targetId === "about") return 72;
    if (targetId.startsWith("about")) return 132; // 72 + 60
    if (targetId === "awards") return 182;
    if (PROGRAMME_SECTIONS.has(targetId as ProgrammeSectionId)) return 92;
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
    return navHeight;
  }
  if (targetId.startsWith("about")) {
    const breathingGap = isMobile ? 40 : 60;
    return navHeight + breathingGap;
  }
  if (targetId === "awards") {
    const breathingGap = isMobile ? 75 : 110;
    return navHeight + breathingGap;
  }
  if (PROGRAMME_SECTIONS.has(targetId as ProgrammeSectionId)) {
    const breathingGap = isMobile ? 16 : 20;
    return navHeight + breathingGap;
  }
  return navHeight;
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
 *  Lenis uses its internal animatedScroll with the right nav offset. */
export function scrollToId(id: string, options: ScrollToOptions = {}): boolean {
  const el = getTargetElement(id);
  if (!el) return false;

  const lenis = getLenisInstance();
  const offset = -navOffsetPx(id);

  if (lenis) {
    lenis.resize();
    syncScrollTrigger();
    document.documentElement.classList.add("is-scrolling-to");
    const cleanup = () => {
      document.documentElement.classList.remove("is-scrolling-to");
      syncScrollTrigger();
    };

    lenis.scrollTo(el, {
      offset,
      immediate: options.immediate,
      duration: options.immediate ? 0 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      lock: false,
      onComplete: cleanup,
    });

    if (options.immediate) {
      cleanup();
    } else {
      window.setTimeout(cleanup, 1400);
    }
    return true;
  }

  const behavior = options.immediate ? "auto" : "smooth";
  const targetOffset = navOffsetPx(id);
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - targetOffset);
  window.scrollTo({ top, behavior });
  return true;
}

export function scrollToSection(id: HomeSectionId, options: ScrollToOptions = {}) {
  scrollToId(id, options);
}
