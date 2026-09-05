import React, { useCallback, useEffect, useState } from "react";
import {
  ChangesStore,
  extractComputedTypography,
  getUniqueSelector,
  type TypographyStyleProps,
} from "./ChangesManager";
import { InspectorOverlay } from "./InspectorOverlay";
import { EditorPanel } from "./EditorPanel";
import { ReportModal } from "./ReportModal";
import "./type-inspector.css";

export const TypographyInspector: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [lockedElement, setLockedElement] = useState<HTMLElement | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [computedStyles, setComputedStyles] = useState<TypographyStyleProps | null>(null);
  const [selectorInfo, setSelectorInfo] = useState<{ cssSelector: string; domPath: string }>({
    cssSelector: "",
    domPath: "",
  });
  const [changeCount, setChangeCount] = useState<number>(() => ChangesStore.getAll().length);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Sync stored changes count
  const refreshChanges = useCallback(() => {
    setChangeCount(ChangesStore.getAll().length);
    ChangesStore.applyAllStoredToDom();
  }, []);

  useEffect(() => {
    window.addEventListener("typography-inspector-updated", refreshChanges);
    // Initial apply
    ChangesStore.applyAllStoredToDom();
    return () => {
      window.removeEventListener("typography-inspector-updated", refreshChanges);
    };
  }, [refreshChanges]);

  // Global keydown listener for 'C' / 'c' toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "c" || e.key === "C") {
        setIsActive((prev) => {
          const next = !prev;
          if (!next) {
            setLockedElement(null);
            setHoveredElement(null);
          }
          return next;
        });
      } else if (e.key === "Escape") {
        if (showReportModal) {
          setShowReportModal(false);
        } else if (lockedElement) {
          setLockedElement(null);
        } else if (isActive) {
          setIsActive(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, lockedElement, showReportModal]);

  // Mouse move and hover element tracking when active
  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });

      if (lockedElement) return; // Don't switch highlight if element is locked for editing

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!el || el.closest(".type-insp-root")) {
        setHoveredElement(null);
        return;
      }

      // Only inspect elements with text or relevant typography tags
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0
      );
      const isTypographyTag = /^(H[1-6]|P|SPAN|A|BUTTON|LABEL|LI|BLOCKQUOTE|STRONG|EM|B|I|DIV)$/i.test(
        el.tagName
      );

      if (hasDirectText || isTypographyTag) {
        setHoveredElement(el);
        setComputedStyles(extractComputedTypography(el));
        setSelectorInfo(getUniqueSelector(el));
      } else {
        setHoveredElement(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest(".type-insp-root")) return;

      if (hoveredElement) {
        e.preventDefault();
        e.stopPropagation();
        setLockedElement(hoveredElement);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick, { capture: true });
    };
  }, [isActive, lockedElement, hoveredElement]);

  if (!isActive && !showReportModal) {
    return null;
  }

  return (
    <div className="type-insp-root">
      {/* Visual Overlay & Cursor Tooltip */}
      {isActive && (
        <InspectorOverlay
          targetElement={hoveredElement}
          lockedElement={lockedElement}
          cursorPos={cursorPos}
          computedStyles={computedStyles}
          selector={selectorInfo.cssSelector}
        />
      )}

      {/* In-Place Live Editor HUD */}
      {isActive && lockedElement && computedStyles && (
        <EditorPanel
          element={lockedElement}
          originalStyles={computedStyles}
          domPath={selectorInfo.domPath}
          cssSelector={selectorInfo.cssSelector}
          onClose={() => setLockedElement(null)}
          onSaved={() => {
            refreshChanges();
            setLockedElement(null);
          }}
        />
      )}

      {/* Floating Status & Manager Bar */}
      {isActive && (
        <div className="type-insp-bar">
          <div className="type-insp-status-dot" />
          <div className="type-insp-bar-text">
            <span>Typography Inspector</span>
            <span className="type-insp-bar-badge">Press 'C' to toggle</span>
          </div>

          <button
            className="type-insp-btn"
            onClick={() => setShowReportModal(true)}
            title="View and export all recorded edits"
          >
            📋 Report <span className="type-insp-bar-badge">{changeCount}</span>
          </button>

          <button
            className="type-insp-btn-close"
            onClick={() => setIsActive(false)}
            title="Close Inspector (Press 'C')"
          >
            ✕
          </button>
        </div>
      )}

      {/* Export Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onCleared={refreshChanges}
        />
      )}
    </div>
  );
};
