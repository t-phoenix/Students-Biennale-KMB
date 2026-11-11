import { DUR, EASE, STAGGER, gsap, SplitText, prefersReducedMotion } from "./motion";

const SELECTOR = "h1, .fig-heading, .detail__title";

/**
 * Large titles rise line by line from behind a mask as they reach the viewport,
 * then the original content is put back exactly as it was. React's own text
 * nodes sit aside during the animation, so later text updates still apply.
 */
export function observeHeadlines(root: HTMLElement): () => void {
  if (typeof window === "undefined" || prefersReducedMotion()) return () => {};

  const seen = new WeakSet<HTMLElement>();
  const pending = new Set<HTMLElement>();
  const running = new Set<() => void>();
  let stopped = false;

  const release = (el: HTMLElement) => {
    pending.delete(el);
    observer.unobserve(el);
    el.removeAttribute("data-headline-pending");
  };

  const reveal = (el: HTMLElement) => {
    release(el);
    if (!el.isConnected || !el.textContent?.trim()) return;

    const originals = Array.from(el.childNodes);
    const copy = el.cloneNode(true) as HTMLElement;
    let split: SplitText | null = null;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      running.delete(finish);
      tween?.kill();
      split?.revert();
      el.replaceChildren(...originals);
    };

    let tween: gsap.core.Tween | null = null;
    try {
      el.replaceChildren(...Array.from(copy.childNodes));
      split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "headline-line" });
      // Room for descenders, which the mask would otherwise clip while the line moves.
      split.masks.forEach((mask) => {
        gsap.set(mask, { paddingBottom: "0.2em", marginBottom: "-0.2em" });
      });
      running.add(finish);
      tween = gsap.fromTo(
        split.lines,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: DUR.reveal,
          stagger: STAGGER.step * 2.5,
          ease: EASE.reveal,
          onComplete: finish,
        },
      );
    } catch (err) {
      console.warn("headline reveal skipped:", err);
      finish();
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) reveal(el);
        // Jumped straight past it: nothing to animate, just show it.
        else if (entry.boundingClientRect.bottom < 0) release(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px" },
  );

  const scan = () => {
    if (stopped) return;
    root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (seen.has(el) || !el.textContent?.trim()) return;
      seen.add(el);
      pending.add(el);
      el.setAttribute("data-headline-pending", "");
      observer.observe(el);
    });
  };

  // Runs before the browser paints, so a new title is never seen in place first.
  const mutations = new MutationObserver(scan);
  mutations.observe(root, { childList: true, subtree: true, characterData: true });
  scan();

  return () => {
    stopped = true;
    mutations.disconnect();
    observer.disconnect();
    pending.forEach((el) => el.removeAttribute("data-headline-pending"));
    pending.clear();
    running.forEach((finish) => finish());
  };
}
