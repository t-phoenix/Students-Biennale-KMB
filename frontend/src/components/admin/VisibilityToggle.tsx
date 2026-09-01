import "./admin-shared.css";

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1M6.4 6.4C4.6 7.8 3.2 9.7 2 12c0 0 3.5 7 10 7 1.8 0 3.4-.5 4.8-1.2M14 5.2C13.4 5.1 12.7 5 12 5 8.5 5 5.7 7.1 4 9.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type VisibilityFieldProps = {
  visible: boolean;
  onChange: (visible: boolean) => void;
  label?: string;
};

/** Segmented Live / Hidden control for edit forms. */
export function VisibilityField({
  visible,
  onChange,
  label = "Site visibility",
}: VisibilityFieldProps) {
  return (
    <div className="adm-vis-field">
      <span className="adm-field__label">{label}</span>
      <div className="adm-vis-field__control" role="group" aria-label={label}>
        <button
          type="button"
          className={`adm-vis-field__opt${visible ? " is-active" : ""}`}
          aria-pressed={visible}
          onClick={() => onChange(true)}
        >
          <EyeIcon />
          <span>Live</span>
        </button>
        <button
          type="button"
          className={`adm-vis-field__opt${!visible ? " is-active" : ""}`}
          aria-pressed={!visible}
          onClick={() => onChange(false)}
        >
          <EyeOffIcon />
          <span>Hidden</span>
        </button>
      </div>
      <p className="adm-vis-field__hint">
        {visible
          ? "Shown on the public site."
          : "Saved in the CMS but hidden from visitors."}
      </p>
    </div>
  );
}

type VisibilityRowToggleProps = {
  visible: boolean;
  onToggle: () => void | Promise<void>;
  disabled?: boolean;
};

/** Compact eye icon at the start of admin table rows. */
export function VisibilityRowToggle({ visible, onToggle, disabled }: VisibilityRowToggleProps) {
  const hint = visible
    ? "Visible on site — click to hide"
    : "Hidden from site — click to show";

  return (
    <button
      type="button"
      className={`adm-vis-row${visible ? " is-live" : " is-hidden"}`}
      aria-pressed={visible}
      aria-label={hint}
      title={hint}
      disabled={disabled}
      onClick={() => void onToggle()}
    >
      {visible ? <EyeIcon /> : <EyeOffIcon />}
    </button>
  );
}

/** @deprecated Use VisibilityRowToggle */
export const VisibilityCell = VisibilityRowToggle;

export function hiddenRowClass(visible: boolean): string | undefined {
  return visible ? undefined : "adm-table__row--hidden";
}

/** Narrow first column header for row visibility toggles. */
export function VisibilityColumnHeader() {
  return (
    <th className="adm-table__cell--show" scope="col">
      <span className="adm-vis-col-head" title="Site visibility" aria-label="Site visibility">
        <EyeIcon />
      </span>
    </th>
  );
}
