import { useState } from "react";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { requireSupabase } from "../../../lib/supabase";
import { refreshProgrammesCovers } from "../../../lib/programmesCms";
import { FormField } from "../../../components/admin/FormField";
import { ImageUpload } from "../../../components/admin/ImageUpload";
import { MoveButtons } from "../../../components/admin/MoveButtons";
import {
  VisibilityColumnHeader,
  VisibilityField,
  VisibilityRowToggle,
  hiddenRowClass,
} from "../../../components/admin/VisibilityToggle";
import type { SectionProps } from "./types";

interface Cover {
  id: string;
  image_url: string;
  sort_order: number;
  active: boolean;
  show_on_home: boolean;
}

const EMPTY: Omit<Cover, "id"> = {
  image_url: "",
  sort_order: 0,
  active: true,
  show_on_home: false,
};

const LAST_COVER_MSG = "Keep at least one live programmes cover visible.";

async function clearHomeFlag(exceptId?: string) {
  const sb = requireSupabase();
  let q = sb.from("programmes_covers").update({ show_on_home: false }).eq("show_on_home", true);
  if (exceptId) q = q.neq("id", exceptId);
  const { error } = await q;
  if (error) throw error;
}

export function ProgrammesCovers({ notify, confirm }: SectionProps) {
  const { rows, loading, create, update, remove } = useSupabaseCrud<Cover>(
    "programmes_covers",
    { orderBy: "sort_order" },
  );
  const [editing, setEditing] = useState<Partial<Cover> | null>(null);
  const [busy, setBusy] = useState(false);

  const visibleCount = rows.filter((r) => r.active).length;
  const isLastVisible = (row: Cover) => row.active && visibleCount === 1;

  const bustCache = async () => {
    try {
      await refreshProgrammesCovers();
    } catch {
      /* public cache refresh is best-effort */
    }
  };

  const save = async () => {
    if (!editing?.image_url) return;
    const hidingLast =
      editing.active === false &&
      (editing.id
        ? rows.find((r) => r.id === editing.id)?.active && visibleCount === 1
        : visibleCount === 0);
    if (hidingLast) {
      notify("error", LAST_COVER_MSG);
      return;
    }
    setBusy(true);
    try {
      if (editing.show_on_home) await clearHomeFlag(editing.id);

      if (editing.id) {
        const { id, ...patch } = editing;
        await update(id, patch);
        notify("success", "Cover updated");
      } else {
        await create(editing as never);
        notify("success", "Cover created");
      }
      await bustCache();
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const setAsHome = async (row: Cover) => {
    if (row.show_on_home) return;
    setBusy(true);
    try {
      await clearHomeFlag();
      await update(row.id, { show_on_home: true });
      await bustCache();
      notify("success", "Home programmes banner updated");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to set home cover");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (row: Cover) => {
    if (isLastVisible(row)) {
      notify("error", LAST_COVER_MSG);
      return;
    }
    try {
      await update(row.id, { active: !row.active });
      await bustCache();
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to update active state");
    }
  };

  const handleDelete = async (row: Cover) => {
    if (isLastVisible(row)) {
      notify("error", LAST_COVER_MSG);
      return;
    }
    if (!(await confirm("Delete this programmes cover?"))) return;
    try {
      await remove(row.id);
      await bustCache();
      notify("success", "Cover deleted");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const move = async (row: Cover, delta: -1 | 1) => {
    const next = row.sort_order + delta;
    if (next < 0 || next >= rows.length) return;
    try {
      await update(row.id, { sort_order: next });
      await bustCache();
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

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Programmes Covers</h2>
        <button
          className="adm-btn adm-btn--primary"
          onClick={() => setEditing({ ...EMPTY, sort_order: 0 })}
        >
          + Add Cover
        </button>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        Carousel images for the Programmes page hero. Mark one as <strong>Home</strong> to replace
        the banner in the Upcoming Programmes section on the home page. Sort order is 0-based:
        saving at 0 inserts at the front. Use Up/Down to swap.
      </p>

      {editing && (
        <div className="adm-card">
          <ImageUpload
            value={editing.image_url ?? ""}
            onChange={(v) => setEditing({ ...editing, image_url: v })}
          />
          <FormField
            label="Sort Order"
            value={String(editing.sort_order ?? 0)}
            onChange={(v) =>
              setEditing({
                ...editing,
                sort_order: Number.isNaN(parseInt(v, 10)) ? 0 : parseInt(v, 10),
              })
            }
            type="number"
          />
          <VisibilityField
            visible={editing.active !== false}
            onChange={(visible) => setEditing({ ...editing, active: visible })}
          />
          <label className="adm-field">
            <span className="adm-field__label">Use as Home programmes banner</span>
            <input
              type="checkbox"
              checked={editing.show_on_home === true}
              onChange={(e) => setEditing({ ...editing, show_on_home: e.target.checked })}
            />
          </label>
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
        <div className="adm-empty">No covers yet. Add your first programmes hero image.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <VisibilityColumnHeader />
                <th className="adm-table__cell--meta">Image</th>
                <th className="adm-table__cell--meta">Home</th>
                <th className="adm-table__cell--num">Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={hiddenRowClass(r.active)}>
                  <td>
                    <VisibilityRowToggle
                      visible={r.active}
                      onToggle={() => toggleActive(r)}
                      disabled={busy}
                    />
                  </td>
                  <td>
                    {r.image_url && (
                      <img src={r.image_url} alt="" className="adm-table__thumb" />
                    )}
                  </td>
                  <td>
                    {r.show_on_home ? (
                      <strong>Home</strong>
                    ) : (
                      <button
                        type="button"
                        className="adm-btn adm-btn--secondary adm-btn--small"
                        disabled={busy || !r.active}
                        onClick={() => setAsHome(r)}
                      >
                        Set Home
                      </button>
                    )}
                  </td>
                  <td>{r.sort_order}</td>
                  <td>
                    <div className="adm-table__actions">
                      <MoveButtons index={i} total={rows.length} onMove={(delta) => move(r, delta)} />
                      <button
                        className="adm-btn adm-btn--secondary adm-btn--small"
                        onClick={() => setEditing({ ...r })}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
