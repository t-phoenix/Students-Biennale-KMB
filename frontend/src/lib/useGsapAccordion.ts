import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "./motion";

export type AccordionSelectors = {
  item: string;
  collapsed: string;
  expanded: string;
  img?: string;
  copy?: string;
  dataAttr?: string;
};

/**
 * High-performance, luxury GSAP accordion hook.
 * Animates exact pixel heights, image zooms, and copy reveals with true
 * mathematical easing (power3.out), eliminating CSS grid-template-rows snapping.
 */
export function useGsapAccordion(
  rootRef: React.RefObject<HTMLElement | null>,
  activeId: string | undefined | null,
  selectors: AccordionSelectors,
  extraDependencies: unknown[] = [],
) {
  const initialRenderRef = useRef(true);
  const dataAttr = selectors.dataAttr ?? "data-id";

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const items = root.querySelectorAll<HTMLElement>(selectors.item);
      if (!items.length) return;

      // Handle prefers-reduced-motion
      if (prefersReducedMotion()) {
        items.forEach((item) => {
          const id = item.getAttribute(dataAttr);
          const isExpanded = id === activeId;
          const exp = item.querySelector<HTMLElement>(selectors.expanded);
          const col = item.querySelector<HTMLElement>(selectors.collapsed);
          if (exp) {
            gsap.set(exp, {
              height: isExpanded ? "auto" : 0,
              autoAlpha: isExpanded ? 1 : 0,
            });
          }
          if (col) {
            gsap.set(col, {
              height: isExpanded ? 0 : "auto",
              autoAlpha: isExpanded ? 0 : 1,
            });
          }
        });
        return;
      }

      // Initial Mount: establish starting heights without transitions
      if (initialRenderRef.current) {
        initialRenderRef.current = false;
        items.forEach((item) => {
          const id = item.getAttribute(dataAttr);
          const isExpanded = id === activeId;
          const exp = item.querySelector<HTMLElement>(selectors.expanded);
          const col = item.querySelector<HTMLElement>(selectors.collapsed);
          if (exp) {
            gsap.set(exp, {
              height: isExpanded ? "auto" : 0,
              autoAlpha: isExpanded ? 1 : 0,
              overflow: "hidden",
            });
          }
          if (col) {
            gsap.set(col, {
              height: isExpanded ? 0 : "auto",
              autoAlpha: isExpanded ? 0 : 1,
              overflow: "hidden",
            });
          }
        });
        return;
      }

      // Active state change: animate opening and closing in sync
      items.forEach((item) => {
        const id = item.getAttribute(dataAttr);
        const isExpanded = id === activeId;
        const exp = item.querySelector<HTMLElement>(selectors.expanded);
        const col = item.querySelector<HTMLElement>(selectors.collapsed);
        const img = selectors.img ? item.querySelector<HTMLElement>(selectors.img) : null;
        const copy = selectors.copy ? item.querySelector<HTMLElement>(selectors.copy) : null;

        if (isExpanded) {
          if (exp) {
            gsap.killTweensOf(exp);
            // Measure target height naturally
            gsap.set(exp, { height: "auto", autoAlpha: 1 });
            const naturalHeight = exp.offsetHeight;
            const currentH = exp.clientHeight;
            gsap.fromTo(
              exp,
              { height: currentH === naturalHeight ? 0 : currentH, autoAlpha: 1 },
              {
                height: naturalHeight,
                duration: 0.78,
                ease: "power3.out",
                onComplete: () => {
                  gsap.set(exp, { clearProps: "height" });
                },
              },
            );
          }
          if (col) {
            gsap.killTweensOf(col);
            gsap.to(col, {
              height: 0,
              autoAlpha: 0,
              duration: 0.58,
              ease: "power3.out",
            });
          }
          if (img) {
            gsap.killTweensOf(img);
            gsap.fromTo(
              img,
              { scale: 1.05 },
              { scale: 1, duration: 0.95, ease: "power2.out", clearProps: "scale" },
            );
          }
          if (copy) {
            gsap.killTweensOf(copy);
            gsap.fromTo(
              copy,
              { y: 10, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.68,
                ease: "power3.out",
                delay: 0.06,
                clearProps: "y,opacity,visibility",
              },
            );
          }
        } else {
          if (exp) {
            gsap.killTweensOf(exp);
            const currentH = exp.offsetHeight;
            if (currentH > 0) {
              gsap.fromTo(
                exp,
                { height: currentH, autoAlpha: 1 },
                {
                  height: 0,
                  autoAlpha: 0,
                  duration: 0.62,
                  ease: "power3.inOut",
                },
              );
            } else {
              gsap.set(exp, { height: 0, autoAlpha: 0 });
            }
          }
          if (col) {
            gsap.killTweensOf(col);
            gsap.set(col, { height: "auto" });
            const naturalColH = col.offsetHeight;
            const currentColH = col.clientHeight;
            gsap.fromTo(
              col,
              { height: currentColH === naturalColH ? 0 : currentColH, autoAlpha: 0 },
              {
                height: naturalColH,
                autoAlpha: 1,
                duration: 0.68,
                ease: "power3.out",
                onComplete: () => {
                  gsap.set(col, { clearProps: "height" });
                },
              },
            );
          }
        }
      });
    },
    { dependencies: [activeId, ...extraDependencies], scope: rootRef },
  );
}
