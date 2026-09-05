import React, { useState } from "react";
import { ChangesStore } from "./ChangesManager";

interface ReportModalProps {
  onClose: () => void;
  onCleared: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ onClose, onCleared }) => {
  const [activeTab, setActiveTab] = useState<"markdown" | "css" | "table" | "json">("markdown");
  const [copied, setCopied] = useState(false);

  const records = ChangesStore.getAll();
  const mdReport = ChangesStore.generateMarkdownReport();
  const cssReport = ChangesStore.generateCssDiff();
  const jsonReport = JSON.stringify(records, null, 2);

  const handleCopy = () => {
    let content = "";
    if (activeTab === "markdown") content = mdReport;
    else if (activeTab === "css") content = cssReport;
    else if (activeTab === "json") content = jsonReport;
    else content = mdReport;

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteItem = (id: string) => {
    ChangesStore.remove(id);
    onCleared();
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all recorded typography edits?")) {
      ChangesStore.clearAll();
      onCleared();
      onClose();
    }
  };

  return (
    <div className="type-insp-modal-backdrop" onClick={onClose}>
      <div className="type-insp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="type-insp-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
              📋 Typography Audit &amp; Correction Document
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
              {records.length} {records.length === 1 ? "change" : "changes"} recorded across pages
            </p>
          </div>
          <button className="type-insp-btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="type-insp-modal-tabs">
          <button
            className={`type-insp-tab ${activeTab === "markdown" ? "active" : ""}`}
            onClick={() => setActiveTab("markdown")}
          >
            📄 Markdown Spec Sheet
          </button>
          <button
            className={`type-insp-tab ${activeTab === "css" ? "active" : ""}`}
            onClick={() => setActiveTab("css")}
          >
            🎨 CSS Overrides
          </button>
          <button
            className={`type-insp-tab ${activeTab === "table" ? "active" : ""}`}
            onClick={() => setActiveTab("table")}
          >
            📊 Detailed Table ({records.length})
          </button>
          <button
            className={`type-insp-tab ${activeTab === "json" ? "active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            { } JSON
          </button>
        </div>

        <div className="type-insp-modal-body">
          {activeTab === "markdown" && (
            <pre className="type-insp-code-preview">{mdReport}</pre>
          )}

          {activeTab === "css" && (
            <pre className="type-insp-code-preview">{cssReport}</pre>
          )}

          {activeTab === "json" && (
            <pre className="type-insp-code-preview">{jsonReport}</pre>
          )}

          {activeTab === "table" && (
            <div style={{ overflowX: "auto" }}>
              {records.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "30px" }}>
                  No changes recorded yet. Click any text on the website to edit!
                </p>
              ) : (
                <table className="type-insp-table">
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Element Snippet</th>
                      <th>Tag</th>
                      <th>Original</th>
                      <th>Modified</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td><code>{r.route}</code></td>
                        <td>"{r.textSnippet.slice(0, 30)}"</td>
                        <td>
                          <span className="type-insp-tag-badge">&lt;{r.proposedTag}&gt;</span>
                        </td>
                        <td>
                          {r.original.fontSize} · {r.original.fontWeight} · lh:{r.original.lineHeight}
                        </td>
                        <td style={{ color: "#b4cf45", fontWeight: 600 }}>
                          {r.modified.fontSize} · {r.modified.fontWeight} · lh:{r.modified.lineHeight}
                        </td>
                        <td>
                          <button
                            className="type-insp-btn"
                            style={{ padding: "3px 8px", fontSize: "11px", background: "rgba(232,50,57,0.2)" }}
                            onClick={() => handleDeleteItem(r.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="type-insp-modal-footer">
          <button
            className="type-insp-btn"
            style={{ color: "#e83239", borderColor: "rgba(232,50,57,0.3)" }}
            onClick={handleClearAll}
          >
            🗑️ Clear All Changes
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="type-insp-btn" onClick={handleCopy}>
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Document"}
            </button>
            <button
              className="type-insp-btn type-insp-btn-primary"
              onClick={() => {
                if (activeTab === "css") {
                  handleDownload("typography-changes.css", cssReport);
                } else if (activeTab === "json") {
                  handleDownload("typography-audit.json", jsonReport);
                } else {
                  handleDownload("typography-audit-report.md", mdReport);
                }
              }}
            >
              📥 Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
