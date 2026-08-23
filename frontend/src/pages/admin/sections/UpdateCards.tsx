import { useEffect, useMemo, useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { swapUpdateCardSlots } from "../../../lib/admin/reorder";
import { FormField } from "../../../components/admin/FormField";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import { MoveButtons } from "../../../components/admin/MoveButtons";
import { isSupabaseConfigured, supabase } from "../../../lib/supabase";
import { useProgrammes } from "../../../lib/programmes";
import {
  buildInternalLinkOptions,
  cardModeLabel,
  defaultCtaLabel,
  type UpdateCardLinkOption,
  type UpdateCardMode,
} from "../../../lib/homeCms/updateCardLinks";
import type { SectionProps } from "./types";

interface Card {
  id: string;
  slot: number;
  heading: string;
  body: string;
  detail_body: string | null;
  image_url: string | null;
  link_url: string | null;
  link_external: boolean;
  link_label: string | null;
  link_target_kind: string | null;
  link_target_id: string | null;
  card_type: UpdateCardMode;
  active: boolean;
}

const CARD_MODES: UpdateCardMode[] = ["content", "internal", "external"];

function normalizeMode(value: string | undefined | null): UpdateCardMode {
  if (value === "internal" || value === "external" || value === "content") return value;
  if (value === "programmes" || value === "news") return "internal";
  return "content";
}

export function UpdateCards({ notify, confirm }: SectionProps) {
  const { rows, loading, create, update, remove, reload } = useSupabaseCrud<Card>(
    "update_cards",
    { orderBy: "slot" },
  );
  const programmes = useProgrammes();
  const [cmsPress, setCmsPress] = useState<UpdateCardLinkOption[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let cancelled = false;
    void supabase
      .from("press_items")
      .select("id, title, slug, published_at, published")
      .eq("published", true)
      .order("sort_order")
      .then(({ data }) => {
        if (cancelled || !data) return;
        setCmsPress(
          data.map((row) => ({
            id: row.slug || row.id,
            kind: "press" as const,
            group: "Press (CMS)",
            label: row.title,
            href: `/press?article=${row.slug || row.id}`,
            meta: row.published_at
              ? new Date(row.published_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : undefined,
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const linkOptions = useMemo(() => {
    const base = buildInternalLinkOptions(programmes);
    const seen = new Set(base.filter((o) => o.kind === "press").map((o) => o.id));
    const extra = cmsPress.filter((o) => !seen.has(o.id));
    return [...base, ...extra];
  }, [
    cmsPress,
    programmes.upcomingWorkshops,
    programmes.pastWorkshops,
    programmes.residencies,
    programmes.awardsInternational,
    programmes.awardsNational,
  ]);
  const [editing, setEditing] = useState<Partial<Card> | null>(null);
  const [busy, setBusy] = useState(false);

  const mode = normalizeMode(editing?.card_type);

  const selectedLinkKey =
    editing?.link_target_kind && editing?.link_target_id
      ? `${editing.link_target_kind}:${editing.link_target_id}`
      : "";

  const groupedOptions = useMemo(() => {
    const map = new Map<string, typeof linkOptions>();
    for (const opt of linkOptions) {
      const list = map.get(opt.group) ?? [];
      list.push(opt);
      map.set(opt.group, list);
    }
    return [...map.entries()];
  }, [linkOptions]);

  const save = async () => {
    if (!editing?.heading?.trim() || !editing?.body?.trim()) return;
    const nextMode = normalizeMode(editing.card_type);

    if (nextMode === "content" && !editing.detail_body?.trim()) {
      notify("error", "Option 1 needs long detail content for the spotlight.");
      return;
    }
    if (nextMode === "internal" && !editing.link_url?.trim()) {
      notify("error", "Option 2 needs an internal destination.");
      return;
    }
    if (nextMode === "external" && !editing.link_url?.trim()) {
      notify("error", "Option 3 needs an external URL.");
      return;
    }

    setBusy(true);
    try {
      const payload: Partial<Card> = {
        slot: editing.slot,
        heading: editing.heading.trim(),
        body: editing.body.trim(),
        card_type: nextMode,
        active: editing.active ?? true,
        detail_body: nextMode === "content" ? editing.detail_body?.trim() || null : null,
        image_url: nextMode === "content" ? editing.image_url?.trim() || null : null,
        link_url:
          nextMode === "content" ? null : editing.link_url?.trim() || null,
        link_external: nextMode === "external",
        link_label:
          nextMode === "content"
            ? null
            : editing.link_label?.trim() || defaultCtaLabel(nextMode),
        link_target_kind: nextMode === "internal" ? editing.link_target_kind || null : null,
        link_target_id: nextMode === "internal" ? editing.link_target_id || null : null,
      };

      if (editing.id) {
        await update(editing.id, payload);
        notify("success", "Card updated");
      } else {
        await create(payload as never);
        notify("success", "Card created");
      }
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (row: Card) => {
    if (!(await confirm(`Delete card slot ${row.slot}?`))) return;
    try {
      await remove(row.id);
      notify("success", "Card deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const move = async (row: Card, delta: -1 | 1) => {
    const index = rows.findIndex((r) => r.id === row.id);
    const neighbor = rows[index + delta];
    if (!neighbor) return;
    try {
      await swapUpdateCardSlots(row, neighbor);
      await reload();
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to reorder");
    }
  };

  if (loading) {
    return (
      <div className="adm-loader">
        <div className="adm-spinner" />
      </div>
    );
  }

  const usedSlots = rows.map((r) => r.slot);

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Update Cards</h2>
        {rows.length < 3 && (
          <button
            className="adm-btn adm-btn--primary"
            onClick={() => {
              const nextSlot = [1, 2, 3].find((s) => !usedSlots.includes(s)) ?? 1;
              setEditing({
                slot: nextSlot,
                heading: "",
                body: "",
                detail_body: "",
                image_url: "",
                link_url: "",
                link_external: false,
                link_label: "",
                link_target_kind: null,
                link_target_id: null,
                card_type: "content",
                active: true,
              });
            }}
          >
            + Add Card
          </button>
        )}
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        Max 3 cards on the home hero. Choose an option first — the form fields change with it.
        Option 1 opens a Sensing Grounds–style spotlight. Options 2 and 3 open a short preview
        modal with a CTA before navigating.
      </p>

      {editing && (
        <div className="adm-card">
          <div className="adm-form-row">
            <div className="adm-field">
              <label className="adm-field__label">Slot</label>
              <select
                className="adm-select"
                value={editing.slot ?? 1}
                onChange={(e) => setEditing({ ...editing, slot: Number(e.target.value) })}
              >
                {[1, 2, 3].map((s) => (
                  <option key={s} value={s} disabled={usedSlots.includes(s) && editing.slot !== s}>
                    Slot {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label className="adm-field__label">
                Option <span className="adm-field__req">*</span>
              </label>
              <select
                className="adm-select"
                value={mode}
                onChange={(e) => {
                  const next = e.target.value as UpdateCardMode;
                  setEditing({
                    ...editing,
                    card_type: next,
                    link_external: next === "external",
                    link_label: editing.link_label || defaultCtaLabel(next),
                    detail_body: next === "content" ? editing.detail_body ?? "" : null,
                    image_url: next === "content" ? editing.image_url ?? "" : null,
                    link_target_kind: next === "internal" ? editing.link_target_kind : null,
                    link_target_id: next === "internal" ? editing.link_target_id : null,
                    link_url: next === "content" ? null : editing.link_url ?? "",
                  });
                }}
              >
                {CARD_MODES.map((m) => (
                  <option key={m} value={m}>
                    {cardModeLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FormField
            label="Heading"
            value={editing.heading ?? ""}
            onChange={(v) => setEditing({ ...editing, heading: v })}
            maxLength={60}
            required
            placeholder="Shown on the hero card"
          />
          <FormField
            label="Card preview text"
            value={editing.body ?? ""}
            onChange={(v) => setEditing({ ...editing, body: v })}
            maxLength={140}
            required
            multiline
            placeholder="Short text on the stacked hero card"
          />

          {mode === "content" && (
            <>
              <FormField
                label="Spotlight detail"
                value={editing.detail_body ?? ""}
                onChange={(v) => setEditing({ ...editing, detail_body: v })}
                required
                multiline
                rows={12}
                placeholder="Long content for the spotlight modal. Separate paragraphs with a blank line."
              />
              <div className="adm-field">
                <label className="adm-field__label">Spotlight image (optional)</label>
                <ImageUpload
                  value={editing.image_url ?? ""}
                  onChange={(v) => setEditing({ ...editing, image_url: v })}
                  folder="cms/update-cards"
                />
                <p className="adm-field__hint">
                  Stored in public storage like Home Covers. Shown under the detail text.
                </p>
              </div>
            </>
          )}

          {mode === "internal" && (
            <>
              <div className="adm-field">
                <label className="adm-field__label">
                  Link destination <span className="adm-field__req">*</span>
                </label>
                <select
                  className="adm-select"
                  value={selectedLinkKey}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      setEditing({
                        ...editing,
                        link_target_kind: null,
                        link_target_id: null,
                        link_url: "",
                        link_external: false,
                      });
                      return;
                    }
                    const [kind, ...rest] = value.split(":");
                    const id = rest.join(":");
                    const opt = linkOptions.find((o) => o.kind === kind && o.id === id);
                    setEditing({
                      ...editing,
                      link_target_kind: kind,
                      link_target_id: id,
                      link_url: opt?.href ?? "",
                      link_external: false,
                    });
                  }}
                >
                  <option value="">Select programme, award, or press…</option>
                  {groupedOptions.map(([group, opts]) => (
                    <optgroup key={group} label={group}>
                      {opts.map((opt) => (
                        <option key={`${opt.kind}:${opt.id}`} value={`${opt.kind}:${opt.id}`}>
                          {opt.label}
                          {opt.meta ? ` — ${opt.meta}` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {editing.link_url ? (
                  <p className="adm-field__hint">Resolves to {editing.link_url}</p>
                ) : null}
              </div>
              <FormField
                label="CTA label"
                value={editing.link_label ?? defaultCtaLabel("internal")}
                onChange={(v) => setEditing({ ...editing, link_label: v })}
                maxLength={40}
                placeholder="Know more"
              />
            </>
          )}

          {mode === "external" && (
            <>
              <FormField
                label="External URL"
                value={editing.link_url ?? ""}
                onChange={(v) =>
                  setEditing({ ...editing, link_url: v, link_external: true })
                }
                required
                placeholder="https://…"
              />
              <FormField
                label="CTA label"
                value={editing.link_label ?? defaultCtaLabel("external")}
                onChange={(v) => setEditing({ ...editing, link_label: v })}
                maxLength={40}
                placeholder="Continue"
              />
              <p className="adm-field__hint">
                Visitors see a small confirmation dialog with a friendly note before the
                link opens in a new tab. Default CTA is “Continue”.
              </p>
            </>
          )}

          <div className="adm-form-actions">
            <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editing.id ? "Update" : "Create"}
            </button>
            <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 && !editing ? (
        <div className="adm-empty">No update cards yet.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--cards">
            <colgroup>
              <col className="adm-col--slot" />
              <col className="adm-col--type" />
              <col className="adm-col--heading" />
              <col className="adm-col--body" />
              <col className="adm-col--link" />
              <col className="adm-col--actions" />
            </colgroup>
            <thead>
              <tr>
                <th>Slot</th>
                <th>Option</th>
                <th>Heading</th>
                <th>Preview</th>
                <th>Link / image</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rowMode = normalizeMode(r.card_type);
                return (
                  <tr key={r.id}>
                    <td>{r.slot}</td>
                    <td>{cardModeLabel(rowMode).replace(/^Option (\d).*/, "Opt $1")}</td>
                    <td>
                      <div className="adm-table__clamp adm-table__clamp--2">{r.heading}</div>
                    </td>
                    <td>
                      <div className="adm-table__clamp">{r.body}</div>
                    </td>
                    <td>
                      {rowMode === "content" ? (
                        r.image_url ? (
                          <span className="adm-table__link" title={r.image_url}>
                            Image
                          </span>
                        ) : (
                          "Text only"
                        )
                      ) : r.link_url ? (
                        <span className="adm-table__link" title={r.link_url}>
                          {r.link_url}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="adm-table__actions">
                        <MoveButtons
                          index={i}
                          total={rows.length}
                          onMove={(delta) => move(r, delta)}
                        />
                        <button
                          className="adm-btn adm-btn--secondary adm-btn--small"
                          onClick={() =>
                            setEditing({
                              ...r,
                              card_type: normalizeMode(r.card_type),
                              detail_body: r.detail_body ?? "",
                              image_url: r.image_url ?? "",
                              link_url: r.link_url ?? "",
                              link_label: r.link_label ?? defaultCtaLabel(normalizeMode(r.card_type)),
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="adm-btn adm-btn--danger adm-btn--small"
                          onClick={() => handleDelete(r)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
