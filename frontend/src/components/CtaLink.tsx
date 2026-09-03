import { Link } from "react-router-dom";
import { BrandArrow, type BrandArrowDirection } from "./BrandArrow";
import "./CtaLink.css";

export type CtaLinkProps = {
  /** Omit to render a button instead of a link. */
  to?: string;
  /** Rendered one per line, uppercase — e.g. ["VIEW", "MORE"] or ["EXPLORE", "EDITION"]. */
  lines: readonly string[];
  /** Per-line letter-spacing (CSS length, e.g. "0.135em"), matched by index to `lines`. */
  spacing?: readonly string[];
  /**
   * Explicit arrow orientation.
   * If omitted, automatically resolved:
   * - "VIEW MORE" / "EXPLORE MORE" -> "down"
   * - "VIEW LESS" / "COLLAPSE" -> "up"
   * - "BACK" / "PREV" -> "left"
   * - default -> "right"
   */
  direction?: BrandArrowDirection;
  /** Kept for backwards compatibility */
  variant?: "chevron" | "next";
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

const DEFAULT_SPACING = ["0.135em", "0.2em"] as const;

function resolveDirection(lines: readonly string[], explicit?: BrandArrowDirection): BrandArrowDirection {
  if (explicit) return explicit;
  const joined = lines.join(" ").toUpperCase();
  if (joined.includes("VIEW MORE") || joined.includes("EXPLORE MORE")) {
    return "down";
  }
  if (joined.includes("VIEW LESS") || joined.includes("COLLAPSE")) {
    return "up";
  }
  if (joined.includes("BACK") || joined.includes("PREV")) {
    return "left";
  }
  return "right";
}

export function CtaLink({
  to,
  lines,
  spacing = DEFAULT_SPACING,
  direction,
  className,
  onClick,
  ariaLabel,
}: CtaLinkProps) {
  const dir = resolveDirection(lines, direction);
  const label = ariaLabel ?? lines.join(" ");
  const isLeft = dir === "left";
  const classes = ["cta-link", `cta-link--${dir}`, className].filter(Boolean).join(" ");

  const content = (
    <>
      {isLeft ? <BrandArrow direction="left" /> : null}
      <span className="cta-link__label" aria-hidden>
        {lines.map((line, i) => (
          <span key={line} style={{ letterSpacing: spacing[i] ?? spacing[spacing.length - 1] }}>
            {line}
          </span>
        ))}
      </span>
      {!isLeft ? <BrandArrow direction={dir} /> : null}
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
