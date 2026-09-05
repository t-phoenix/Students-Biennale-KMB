import React, { useEffect, useState } from "react";
import {
  ChangesStore,
  getWeightLabel,
  type TypographyChangeRecord,
  type TypographyStyleProps,
} from "./ChangesManager";

interface EditorPanelProps {
  element: HTMLElement;
  originalStyles: TypographyStyleProps;
  domPath: string;
  cssSelector: string;
  onClose: () => void;
  onSaved: () => void;
}

const TAG_CHOICES = ["H1", "H2", "H3", "H4", "H5", "H6", "Label", "Body", "Caption"];

export const EditorPanel: React.FC<EditorPanelProps> = ({
  element,
  originalStyles,
  domPath,
  cssSelector,
  onClose,
  onSaved,
}) => {
  const currentTag = element.tagName.toUpperCase();

  const [proposedTag, setProposedTag] = useState<string>(currentTag);
  const [fontSizePx, setFontSizePx] = useState<number>(
    parseFloat(originalStyles.fontSize) || 16
  );
  const [fontWeight, setFontWeight] = useState<string>(
    originalStyles.fontWeight || "400"
  );
  const [lineHeight, setLineHeight] = useState<string>(
    originalStyles.lineHeight === "normal" ? "1.4" : originalStyles.lineHeight
  );
  const [letterSpacing, setLetterSpacing] = useState<string>(
    originalStyles.letterSpacing === "normal" ? "0px" : originalStyles.letterSpacing
  );
  const [textTransform, setTextTransform] = useState<string>(
    originalStyles.textTransform || "none"
  );
  const [notes, setNotes] = useState<string>("");

  // Apply live DOM preview as values change
  useEffect(() => {
    element.style.fontSize = `${fontSizePx}px`;
    element.style.fontWeight = fontWeight;
    element.style.lineHeight = lineHeight;
    element.style.letterSpacing = letterSpacing;
    element.style.textTransform = textTransform;
  }, [element, fontSizePx, fontWeight, lineHeight, letterSpacing, textTransform]);

  const handleSave = () => {
    const record: TypographyChangeRecord = {
      id: `type-change-${Date.now()}`,
      timestamp: Date.now(),
      route: window.location.pathname + window.location.hash,
      domPath,
      cssSelector,
      textSnippet: (element.textContent || "").trim().slice(0, 80),
      currentTag,
      proposedTag,
      original: originalStyles,
      modified: {
        fontFamily: originalStyles.fontFamily,
        fontSize: `${fontSizePx}px`,
        fontWeight,
        fontWeightLabel: getWeightLabel(fontWeight),
        lineHeight,
        letterSpacing,
        textTransform,
      },
      notes: notes.trim(),
    };

    ChangesStore.save(record);
    onSaved();
    onClose();
  };

  const handleReset = () => {
    element.style.fontSize = originalStyles.fontSize;
    element.style.fontWeight = originalStyles.fontWeight;
    element.style.lineHeight = originalStyles.lineHeight;
    element.style.letterSpacing = originalStyles.letterSpacing;
    element.style.textTransform = originalStyles.textTransform;

    setFontSizePx(parseFloat(originalStyles.fontSize) || 16);
    setFontWeight(originalStyles.fontWeight || "400");
    setLineHeight(
      originalStyles.lineHeight === "normal" ? "1.4" : originalStyles.lineHeight
    );
    setLetterSpacing(
      originalStyles.letterSpacing === "normal" ? "0px" : originalStyles.letterSpacing
    );
    setTextTransform(originalStyles.textTransform || "none");
    setProposedTag(currentTag);
  };

  const textPreview = (element.textContent || "").trim().slice(0, 60);

  return (
    <div className="type-insp-editor">
      <div className="type-insp-editor-header">
        <div className="type-insp-editor-title">
          <span>🛠️ Edit Typography</span>
          <span className="type-insp-tag-badge">&lt;{currentTag}&gt;</span>
        </div>
        <button
          className="type-insp-btn-close"
          onClick={() => {
            handleReset();
            onClose();
          }}
          title="Close without saving"
        >
          ✕
        </button>
      </div>

      <div className="type-insp-element-snippet" title={textPreview}>
        "{textPreview || "Selected element"}"
      </div>

      {/* Target Tag Choice */}
      <div className="type-insp-form-group">
        <label className="type-insp-form-label">
          <span>Recommended Semantic Tag / Role</span>
        </label>
        <div className="type-insp-tag-options">
          {TAG_CHOICES.map((t) => (
            <button
              key={t}
              type="button"
              className={`type-insp-tag-pill ${proposedTag === t ? "active" : ""}`}
              onClick={() => setProposedTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size Slider */}
      <div className="type-insp-form-group">
        <label className="type-insp-form-label">
          <span>Font Size</span>
          <span>{fontSizePx}px ({(fontSizePx / 16).toFixed(2)}rem)</span>
        </label>
        <div className="type-insp-slider-row">
          <input
            type="range"
            min="10"
            max="120"
            step="1"
            value={fontSizePx}
            onChange={(e) => setFontSizePx(Number(e.target.value))}
            className="type-insp-slider"
          />
          <input
            type="number"
            value={fontSizePx}
            onChange={(e) => setFontSizePx(Number(e.target.value))}
            className="type-insp-number-input"
          />
        </div>
      </div>

      {/* Font Weight */}
      <div className="type-insp-form-group">
        <label className="type-insp-form-label">
          <span>Font Weight</span>
        </label>
        <select
          value={fontWeight}
          onChange={(e) => setFontWeight(e.target.value)}
          className="type-insp-select"
        >
          <option value="300">300 (Light)</option>
          <option value="400">400 (Regular)</option>
          <option value="500">500 (Medium)</option>
          <option value="600">600 (Semi-Bold)</option>
          <option value="700">700 (Bold)</option>
          <option value="800">800 (Extra-Bold)</option>
          <option value="900">900 (Black)</option>
        </select>
      </div>

      {/* Line Height */}
      <div className="type-insp-form-group">
        <label className="type-insp-form-label">
          <span>Line Height</span>
          <span>{lineHeight}</span>
        </label>
        <input
          type="text"
          value={lineHeight}
          onChange={(e) => setLineHeight(e.target.value)}
          placeholder="e.g. 1.2 or 32px"
          className="type-insp-text-input"
        />
      </div>

      {/* Letter Spacing */}
      <div className="type-insp-form-group">
        <label className="type-insp-form-label">
          <span>Letter Spacing</span>
          <span>{letterSpacing}</span>
        </label>
        <input
          type="text"
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(e.target.value)}
          placeholder="e.g. 0.055em or 1px"
          className="type-insp-text-input"
        />
      </div>

      {/* Text Transform */}
      <div className="type-insp-form-group">
        <label className="type-insp-form-label">
          <span>Text Transform</span>
        </label>
        <div className="type-insp-tag-options">
          {["none", "uppercase", "capitalize", "lowercase"].map((tr) => (
            <button
              key={tr}
              type="button"
              className={`type-insp-tag-pill ${textTransform === tr ? "active" : ""}`}
              onClick={() => setTextTransform(tr)}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* Notes / Reason */}
      <div className="type-insp-form-group">
        <label className="type-insp-form-label">
          <span>Notes / Rationale (Optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Align with H2 token scale"
          className="type-insp-text-input"
        />
      </div>

      {/* Action Buttons */}
      <div className="type-insp-actions">
        <button type="button" className="type-insp-btn" onClick={handleReset}>
          ↺ Reset
        </button>
        <button
          type="button"
          className="type-insp-btn type-insp-btn-primary"
          onClick={handleSave}
        >
          ✓ Save &amp; Record
        </button>
      </div>
    </div>
  );
};
