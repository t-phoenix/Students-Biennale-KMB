import { useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { LATEST_EDITION } from "../data/site";
import { useModalPortal } from "../lib/useModalPortal";

export function PreviousEditionsButton({
  isOpen,
  onClick,
  className = "",
}: {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`edition__archive-toggle${isOpen ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
    >
      <span>Previous Editions</span>
      <svg
        className="edition__archive-chevron"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

export function PreviousEditionsModal({
  open,
  onClose,
  currentYearId,
}: {
  open: boolean;
  onClose: () => void;
  currentYearId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useModalPortal({
    open,
    onClose,
    panelRef,
    initialFocusRef: closeBtnRef,
  });

  if (!open || typeof document === "undefined") return null;

  const editionsList = [
    {
      id: LATEST_EDITION.id,
      title: "Students' Biennale 2025–26",
      subtitle: "Sensing Grounds",
      isCurrent: true,
    },
    {
      id: "2022-23",
      title: "Students' Biennale 2022–23",
      subtitle: "In the Making",
    },
    {
      id: "2020-21",
      title: "Students' Biennale 2020–21",
      subtitle: "Words are Thinking Marks",
    },
    {
      id: "2018-19",
      title: "Students' Biennale 2018–19",
      subtitle: "Making as Learning",
    },
    {
      id: "2016-17",
      title: "Students' Biennale 2016–17",
      subtitle: "Second Edition",
    },
    {
      id: "2014-15",
      title: "Students' Biennale 2014–15",
      subtitle: "Inaugural Edition",
    },
  ];

  return createPortal(
    <div className="edition-modal" role="presentation" data-lenis-prevent>
      <button
        type="button"
        className="edition-modal__scrim"
        aria-label="Close Previous Editions modal"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="edition-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edition-modal-title"
      >
        <div className="edition-modal__handle" aria-hidden="true" />
        <div className="edition-modal__header">
          <div>
            <p className="edition-modal__kicker">Students&apos; Biennale</p>
            <h2 id="edition-modal-title" className="edition-modal__title">
              Previous Editions
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="edition-modal__close-btn"
            onClick={onClose}
            aria-label="Close Previous Editions modal"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="edition-modal__list" aria-label="Available editions">
          {editionsList.map((ed) => {
            const isSelected = ed.id === currentYearId;
            const targetUrl = ed.isCurrent
              ? `/editions/${ed.id}/curators`
              : `/editions/${ed.id}`;
            return (
              <NavLink
                key={ed.id}
                to={targetUrl}
                onClick={onClose}
                className={`edition-modal__item${isSelected ? " is-selected" : ""}`}
              >
                <div className="edition-modal__item-content">
                  <div className="edition-modal__item-heading-row">
                    <span className="edition-modal__item-year">
                      {ed.id.replace("-", "–")}
                    </span>
                    {ed.isCurrent && (
                      <span className="edition-modal__current-pill">
                        Current Edition
                      </span>
                    )}
                    {isSelected && (
                      <span className="edition-modal__active-pill">
                        Viewing
                      </span>
                    )}
                  </div>
                  {ed.subtitle && (
                    <span className="edition-modal__item-subtitle">
                      {ed.subtitle}
                    </span>
                  )}
                </div>
                <div className="edition-modal__item-arrow" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>,
    document.body
  );
}
