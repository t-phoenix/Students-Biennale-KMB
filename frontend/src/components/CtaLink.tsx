import { Link } from "react-router-dom";
import "./CtaLink.css";

type CtaLinkProps = {
  /** Omit to render a button instead of a link. */
  to?: string;
  /** Rendered one per line, right-aligned, uppercase — e.g. ["Explore", "Edition"]. */
  lines: readonly string[];
  /** Per-line letter-spacing (CSS length, e.g. "0.135em"), matched by index to `lines`.
   *  Falls back to the Explore/Edition values (13.5% / 20%) when omitted. */
  spacing?: readonly string[];
  /** "chevron" is the 31x52 mark (Figma Group 102); "next" is the 39x67 mark (Group 104). */
  variant?: "chevron" | "next";
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

const ARROWS = {
  chevron: { src: "/cta/arrow-chevron.svg", width: 31, height: 52 },
  next: { src: "/cta/arrow-next.svg", width: 39, height: 67 },
} as const;

const DEFAULT_SPACING = ["0.135em", "0.2em"] as const;

export function CtaLink({
  to,
  lines,
  spacing = DEFAULT_SPACING,
  variant = "chevron",
  className,
  onClick,
  ariaLabel,
}: CtaLinkProps) {
  const arrow = ARROWS[variant];
  const label = ariaLabel ?? lines.join(" ");
  const classes = ["cta-link", `cta-link--${variant}`, className].filter(Boolean).join(" ");

  const content = (
    <>
      <span className="cta-link__label" aria-hidden>
        {lines.map((line, i) => (
          <span key={line} style={{ letterSpacing: spacing[i] ?? spacing[spacing.length - 1] }}>
            {line}
          </span>
        ))}
      </span>
      <img
        className="cta-link__arrow"
        src={arrow.src}
        alt=""
        aria-hidden
        width={arrow.width}
        height={arrow.height}
      />
    </>
  );

  if (!to) {
    return (
      <button type="button" onClick={onClick} aria-label={label} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} onClick={onClick} aria-label={label} className={classes}>
      {content}
    </Link>
  );
}
