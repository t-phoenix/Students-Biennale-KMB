import type { ReactNode } from "react";
import "../styles/meta-grid.css";

export type MetaRowProps = {
  label: ReactNode;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function MetaRow({
  label,
  value,
  children,
  className = "",
  labelClassName = "",
  valueClassName = "",
}: MetaRowProps) {
  const content = value !== undefined ? value : children;
  if (content === null || content === undefined || content === false || content === "") {
    return null;
  }
  return (
    <div className={`meta-grid__row${className ? ` ${className}` : ""}`}>
      <dt className={`meta-grid__label${labelClassName ? ` ${labelClassName}` : ""}`}>{label}</dt>
      <span className="meta-grid__colon" aria-hidden>:</span>
      <dd className={`meta-grid__value${valueClassName ? ` ${valueClassName}` : ""}`}>{content}</dd>
    </div>
  );
}

export type MetaGridProps = {
  children: ReactNode;
  className?: string;
};

export function MetaGrid({ children, className = "" }: MetaGridProps) {
  return (
    <dl className={`meta-grid${className ? ` ${className}` : ""}`}>
      {children}
    </dl>
  );
}
