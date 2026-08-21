type CmsTheme = "light" | "dark";

type Props = {
  theme: CmsTheme;
  onToggle: () => void;
};

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const toLight = theme === "dark";
  return (
    <button
      type="button"
      className="adm-theme-toggle"
      onClick={onToggle}
      aria-label={toLight ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={theme === "dark"}
      title={toLight ? "Light mode" : "Dark mode"}
    >
      {toLight ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
