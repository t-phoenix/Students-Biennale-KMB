import { useState } from "react";
import { useAdminAuth, useNotification, useConfirm } from "../../lib/admin/hooks";
import { NotificationStack } from "../../components/admin/Notification";
import { ConfirmModal } from "../../components/admin/ConfirmModal";
import { Login } from "./Login";
import { HomeCovers } from "./sections/HomeCovers";
import { UpdateCards } from "./sections/UpdateCards";
import { Workshops } from "./sections/Workshops";
import { ResidenciesSection } from "./sections/Residencies";
import { Awards } from "./sections/Awards";
import { PressItems } from "./sections/PressItems";
import "./Admin.css";

const NAV = [
  { key: "covers", label: "Home Covers" },
  { key: "cards", label: "Update Cards" },
  { key: "workshops", label: "Workshops" },
  { key: "residencies", label: "Residencies" },
  { key: "awards", label: "Awards" },
  { key: "press", label: "Press" },
] as const;

type Section = (typeof NAV)[number]["key"];

export function Admin() {
  const { user, loading: authLoading, signIn, signOut } = useAdminAuth();
  const { notifications, push, dismiss } = useNotification();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();
  const [section, setSection] = useState<Section>("covers");

  if (authLoading) {
    return (
      <div className="adm-login">
        <div className="adm-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Login onSignIn={signIn} />;
  }

  const sectionProps = { notify: push, confirm };

  return (
    <div className="adm-layout">
      <aside className="adm-sidebar">
        <div className="adm-sidebar__brand">
          <span className="adm-sidebar__logo">SB</span>
          <span className="adm-sidebar__title">CMS</span>
        </div>
        <nav className="adm-sidebar__nav">
          {NAV.map((item) => (
            <button
              key={item.key}
              className={`adm-sidebar__item ${section === item.key ? "adm-sidebar__item--active" : ""}`}
              onClick={() => setSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="adm-sidebar__footer">
          <span className="adm-sidebar__user">{user.email}</span>
          <button className="adm-btn adm-btn--ghost" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="adm-main">
        {section === "covers" && <HomeCovers {...sectionProps} />}
        {section === "cards" && <UpdateCards {...sectionProps} />}
        {section === "workshops" && <Workshops {...sectionProps} />}
        {section === "residencies" && <ResidenciesSection {...sectionProps} />}
        {section === "awards" && <Awards {...sectionProps} />}
        {section === "press" && <PressItems {...sectionProps} />}
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
