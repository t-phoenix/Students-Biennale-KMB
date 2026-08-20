import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./admin-shared.css";

export type SearchOption = {
  id: string;
  label: string;
  meta?: string;
};

type Props = {
  label: string;
  value: string | null;
  options: SearchOption[];
  onChange: (id: string | null) => void;
  placeholder?: string;
  emptyHint?: string;
  required?: boolean;
  disabled?: boolean;
};

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Search…",
  emptyHint = "No matches. If it’s missing, ask a developer to add it to the catalogue.",
  required,
  disabled,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 40);
    return options
      .filter((option) => {
        const hay = `${option.label} ${option.meta ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [options, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="adm-field" ref={rootRef}>
      <label className="adm-field__label">
        {label}
        {required ? <span className="adm-field__req">*</span> : null}
      </label>
      <button
        type="button"
        className="adm-field__input adm-search-select__trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selected ? (
          <span>
            <strong>{selected.label}</strong>
            {selected.meta ? (
              <span className="adm-search-select__meta"> — {selected.meta}</span>
            ) : null}
          </span>
        ) : (
          <span className="adm-search-select__placeholder">{placeholder}</span>
        )}
      </button>

      {open ? (
        <div className="adm-search-select__panel" id={listId}>
          <input
            className="adm-field__input"
            autoFocus
            value={query}
            placeholder={placeholder}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="adm-search-select__list">
            {filtered.length === 0 ? (
              <li className="adm-search-select__empty">{emptyHint}</li>
            ) : (
              filtered.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className={
                      option.id === value
                        ? "adm-search-select__option is-active"
                        : "adm-search-select__option"
                    }
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {option.meta ? <small>{option.meta}</small> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
          {value ? (
            <button
              type="button"
              className="adm-btn adm-btn--ghost adm-btn--small"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Clear selection
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
