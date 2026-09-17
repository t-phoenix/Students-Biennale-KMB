import { lazy, Suspense, useEffect, useState } from "react";
import { useAdminAuth, useNotification, useConfirm } from "../../lib/admin/hooks";
import { NotificationStack } from "../../components/admin/Notification";
import { ConfirmModal } from "../../components/admin/ConfirmModal";
import { ThemeToggle } from "../../components/admin/ThemeToggle";
import { Login } from "./Login";
import type { SectionProps } from "./sections/types";
import "./Admin.css";

const HomeCovers = lazy(() =>
  import("./sections/HomeCovers").then((m) => ({ default: m.HomeCovers })),
);
const ProgrammesCovers = lazy(() =>
  import("./sections/ProgrammesCovers").then((m) => ({ default: m.ProgrammesCovers })),
);
const UpdateCards = lazy(() =>
  import("./sections/UpdateCards").then((m) => ({ default: m.UpdateCards })),
);
const Workshops = lazy(() =>
  import("./sections/Workshops").then((m) => ({ default: m.Workshops })),
);
const ResidenciesSection = lazy(() =>
  import("./sections/Residencies").then((m) => ({ default: m.ResidenciesSection })),
);
const Awards = lazy(() =>
  import("./sections/Awards").then((m) => ({ default: m.Awards })),
);
const PressItems = lazy(() =>
  import("./sections/PressItems").then((m) => ({ default: m.PressItems })),
);

const NAV = [
  { key: "covers", label: "Home Covers" },
  { key: "programmes-covers", label: "Programmes Covers" },
  { key: "cards", label: "Update Cards" },
  { key: "workshops", label: "Workshops" },
  { key: "residencies", label: "Residencies" },
  { key: "awards", label: "Awards" },
  { key: "press", label: "Press" },
] as const;

type Section = (typeof NAV)[number]["key"];
type CmsTheme = "light" | "dark";

const THEME_KEY = "sb-cms-theme";

function readStoredTheme(): CmsTheme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function SectionFallback() {
  return <div className="adm-spinner" aria-hidden="true" />;
}

function ActiveSection({
  section,
  sectionProps,
}: {
  section: Section;
  sectionProps: SectionProps;
}) {
  return (
    <Suspense fallback={<SectionFallback />}>
      {section === "covers" && <HomeCovers {...sectionProps} />}
      {section === "programmes-covers" && <ProgrammesCovers {...sectionProps} />}
      {section === "cards" && <UpdateCards {...sectionProps} />}
      {section === "workshops" && <Workshops {...sectionProps} />}
      {section === "residencies" && <ResidenciesSection {...sectionProps} />}
      {section === "awards" && <Awards {...sectionProps} />}
      {section === "press" && <PressItems {...sectionProps} />}
    </Suspense>
  );
}

export function Admin() {
  const { user, loading: authLoading, signIn, signOut } = useAdminAuth();
  const { notifications, push, dismiss } = useNotification();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const [section, setSection] = useState<Section>("covers");
  const [theme, setTheme] = useState<CmsTheme>(readStoredTheme);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore quota / private mode */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  if (authLoading) {
    return (
      <div className="adm-login" data-theme={theme}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <div className="adm-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Login onSignIn={signIn} theme={theme} onToggleTheme={toggleTheme} />;
  }

  const sectionProps: SectionProps = { notify: push, confirm };

  return (
    <div className="adm-layout" data-theme={theme}>
      <aside className="adm-sidebar">
        <div className="adm-sidebar__brand">
          <img
            className="adm-sidebar__brand-logo"
            src="/logo-sb-mark.svg"
            alt="Students' Biennale"
          />
          <span className="adm-sidebar__title">CMS</span>
        </div>
        <nav className="adm-sidebar__nav" aria-label="CMS sections">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`adm-sidebar__item ${section === item.key ? "adm-sidebar__item--active" : ""}`}
              onClick={() => setSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="adm-sidebar__footer">
          <span className="adm-sidebar__user">{user.email}</span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={signOut}>
            [ Sign Out ]
          </button>
        </div>
      </aside>

      <main className="adm-main">
        <div className="adm-main__top">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <div className="adm-main__body">
          <ActiveSection section={section} sectionProps={sectionProps} />
        </div>
      </main>

      <NotificationStack items={notifications} onDismiss={dismiss} />
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
