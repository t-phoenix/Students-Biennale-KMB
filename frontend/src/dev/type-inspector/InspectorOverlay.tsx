import React from "react";
import type { TypographyStyleProps } from "./ChangesManager";

interface InspectorOverlayProps {
  targetElement: HTMLElement | null;
  lockedElement: HTMLElement | null;
  cursorPos: { x: number; y: number };
  computedStyles: TypographyStyleProps | null;
  selector: string;
}

export const InspectorOverlay: React.FC<InspectorOverlayProps> = ({
  targetElement,
  lockedElement,
  cursorPos,
  computedStyles,
  selector,
}) => {
  const activeEl = lockedElement || targetElement;
  if (!activeEl || !computedStyles) return null;

  const rect = activeEl.getBoundingClientRect();
  const isLocked = Boolean(lockedElement);

  // Position tooltip relative to cursor with edge-collision prevention
  const tooltipWidth = 260;
  const tooltipHeight = 180;
  const padding = 15;

  let left = cursorPos.x + padding;
  let top = cursorPos.y + padding;

  if (left + tooltipWidth > window.innerWidth) {
    left = cursorPos.x - tooltipWidth - padding;
  }
  if (top + tooltipHeight > window.innerHeight) {
    top = cursorPos.y - tooltipHeight - padding;
  }

  const tagName = activeEl.tagName.toUpperCase();

  return (
    <>
      {/* Visual Bounding Box Outline */}
      <div
        className={`type-insp-highlight-box ${isLocked ? "is-locked" : ""}`}
        style={{
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }}
      />

      {/* Floating Hover Tooltip (Shown when not editing locked element) */}
      {!isLocked && (
        <div
          className="type-insp-tooltip"
          style={{
            top: `${Math.max(10, top)}px`,
            left: `${Math.max(10, left)}px`,
          }}
        >
          <div className="type-insp-tooltip-header">
            <span className="type-insp-tag-badge">&lt;{tagName}&gt;</span>
            <span className="type-insp-selector-badge" title={selector}>
              {selector}
            </span>
          </div>

          <div className="type-insp-grid">
            <div className="type-insp-prop">
              <span className="type-insp-prop-label">Size</span>
              <span className="type-insp-prop-val">{computedStyles.fontSize}</span>
            </div>
            <div className="type-insp-prop">
              <span className="type-insp-prop-label">Weight</span>
              <span className="type-insp-prop-val">{computedStyles.fontWeightLabel}</span>
            </div>
            <div className="type-insp-prop">
              <span className="type-insp-prop-label">Font Family</span>
              <span className="type-insp-prop-val" title={computedStyles.fontFamily}>
                {computedStyles.fontFamily}
              </span>
            </div>
            <div className="type-insp-prop">
              <span className="type-insp-prop-label">Line Height</span>
              <span className="type-insp-prop-val">{computedStyles.lineHeight}</span>
            </div>
            <div className="type-insp-prop">
              <span className="type-insp-prop-label">Letter Spacing</span>
              <span className="type-insp-prop-val">{computedStyles.letterSpacing}</span>
            </div>
            <div className="type-insp-prop">
              <span className="type-insp-prop-label">Transform</span>
              <span className="type-insp-prop-val">{computedStyles.textTransform}</span>
            </div>
          </div>

          <div className="type-insp-tooltip-hint">
            💡 Click text to edit &amp; record changes
          </div>
        </div>
      )}
    </>
  );
};
