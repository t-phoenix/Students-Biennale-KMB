import type { CSSProperties } from "react";
import "./admin-shared.css";

export type CreditVisibilityField = "show_artwork_name" | "show_artist" | "show_institution";

type CreditTexts = {
  artwork_name?: string | null;
  artist?: string | null;
  institution?: string | null;
};

type CreditVisibility = {
  show_artwork_name?: boolean;
  show_artist?: boolean;
  show_institution?: boolean;
};

const TOGGLES = [
  {
    key: "show_artwork_name" as const,
    textKey: "artwork_name" as const,
    letter: "T",
    label: "Title",
    color: "#c45c26",
  },
  {
    key: "show_artist" as const,
    textKey: "artist" as const,
    letter: "A",
    label: "Artist",
    color: "#2a6fdb",
  },
  {
    key: "show_institution" as const,
    textKey: "institution" as const,
    letter: "I",
    label: "Institution",
    color: "#6b4fa0",
  },
] as const;

function tip(label: string, on: boolean, hasText: boolean): string {
  if (!on) return `${label} hidden on home hero`;
  if (!hasText) return `${label} enabled — add text to display on hero`;
  return `${label} visible on home hero`;
}

function ToggleButton({
  letter,
  label,
  color,
  on,
  hasText,
  disabled,
  onClick,
}: {
  letter: string;
  label: string;
  color: string;
  on: boolean;
  hasText: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const hint = tip(label, on, hasText);
  return (
    <button
      type="button"
      className={`adm-credit-vis__btn${on ? " is-on" : " is-off"}${!hasText ? " is-empty" : ""}`}
      style={{ "--credit-accent": color } as CSSProperties}
      aria-pressed={on}
      aria-label={hint}
      title={hint}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="adm-credit-vis__letter" aria-hidden>
        {letter}
      </span>
      <span className="adm-credit-vis__tip">{hint}</span>
    </button>
  );
}

interface Props {
  values: CreditVisibility;
  texts?: CreditTexts;
  onChange: (key: CreditVisibilityField, next: boolean) => void;
  only?: CreditVisibilityField;
  compact?: boolean;
  disabled?: boolean;
}

export function CreditVisibilityToggles({
  values,
  texts = {},
  onChange,
  only,
  compact,
  disabled,
}: Props) {
  const items = only ? TOGGLES.filter((t) => t.key === only) : TOGGLES;

  return (
    <div
      className={`adm-credit-vis${compact ? " adm-credit-vis--compact" : ""}`}
      role="group"
      aria-label="Hero credit visibility"
    >
      {items.map(({ key, textKey, letter, label, color }) => {
        const on = values[key] !== false;
        const hasText = Boolean(texts[textKey]?.trim());
        return (
          <ToggleButton
            key={key}
            letter={letter}
            label={label}
            color={color}
            on={on}
            hasText={hasText}
            disabled={disabled}
            onClick={() => onChange(key, !on)}
          />
        );
      })}
    </div>
  );
}
