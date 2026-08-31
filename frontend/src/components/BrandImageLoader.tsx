import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import "./BrandImageLoader.css";

type Props = {
  className?: string;
  /** "cover" fills a hero frame; "inline" is a compact overlay for thumbnails. */
  variant?: "cover" | "inline";
  label?: string;
};

/**
 * Brand-aligned loading state — SB mark anchored at centre with staggered
 * chevron stripes that advance like the site's View More / Next CTAs.
 */
export function BrandImageLoader({
  className,
  variant = "cover",
  label = "Loading image",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;

      const chevrons = root.querySelectorAll<HTMLElement>(".brand-loader__chevron");
      const mark = root.querySelector(".brand-loader__mark");
      if (!mark || !chevrons.length) return;

      gsap.fromTo(
        mark,
        { autoAlpha: 0.72, scale: 0.94 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 1.1,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        },
      );

      gsap.to(chevrons, {
        x: 10,
        autoAlpha: 0.35,
        duration: 0.85,
        stagger: 0.12,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });
    },
    { scope: rootRef },
  );

  const classes = ["brand-loader", `brand-loader--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={classes} role="status" aria-label={label}>
      <div className="brand-loader__stage">
        <img
          className="brand-loader__mark"
          src="/logo-sb-mark.svg"
          alt=""
          aria-hidden
          width={56}
          height={80}
        />
        <div className="brand-loader__chevrons" aria-hidden>
          <span className="brand-loader__chevron brand-loader__chevron--red" />
          <span className="brand-loader__chevron brand-loader__chevron--green" />
          <span className="brand-loader__chevron brand-loader__chevron--teal" />
        </div>
      </div>
    </div>
  );
}
