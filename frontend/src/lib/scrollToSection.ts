import { getLenisInstance } from "./lenisSingleton";

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
  // No extra breathing-room here (was +12): sections on Home sit directly
  // beneath a full-bleed hero band, so any gap at all reveals a sliver of it
  // under the sticky header — landing flush eliminates that entirely.
  return Number.isFinite(n) ? n : 60;
}

/** Smooth-scroll to an element id, clearing the sticky nav. Routes through the
 *  page's Lenis instance when one is mounted — calling native window.scrollTo
 *  while Lenis also owns the scroll loop makes the two fight over the final
 *  rest position, which is what left a sliver of the previous section visible
 *  under the header after a hash-nav jump. The target is computed once, here,
 *  from native window.scrollY and passed to Lenis as a plain number — letting
 *  Lenis resolve the DOM element itself would additionally subtract its own
 *  `animatedScroll` + any scroll-margin/-padding, double-counting the offset. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const compute = () => Math.max(0, el.getBoundingClientRect().top + window.scrollY - navOffsetPx());

  const lenis = getLenisInstance();
  if (lenis) {
    // Home's hash click handler both scrolls directly and updates the URL hash,
    // which independently re-triggers the same scroll via Layout's hash effect —
    // two overlapping animated scrollTo calls retarget each other mid-flight and
    // can settle short. Snapping once more (immediate, freshly measured) after
    // this call's own animation completes makes the final position exact
    // regardless of what else fired in between.
    lenis.scrollTo(compute(), {
      onComplete: () => lenis.scrollTo(compute(), { immediate: true }),
    });
    return;
  }

  window.scrollTo({ top: compute(), behavior: "smooth" });
}

export function scrollToSection(id: HomeSectionId) {
  scrollToId(id);
}
