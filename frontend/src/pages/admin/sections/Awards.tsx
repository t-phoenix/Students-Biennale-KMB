import { useMemo, useState } from "react";
import { useAllArtworks } from "../../../lib/catalogue";
import { parseAwardees, serializeAwardees } from "../../../lib/programmes";
import { enrichAwardWinners } from "../../../lib/programmes/mappers";
import { refreshProgrammes } from "../../../lib/programmes/cache";
import { useSupabaseCrud } from "../../../lib/admin/hooks";
import { FormField } from "../../../components/admin/FormField";
import type { SectionProps } from "./types";

interface Programme {
  id: string;
  title: string;
  slug: string;
  subtype: string;
  state: string;
  dates: string | null;
  place: string | null;
  summary: string | null;
  body: string | null;
  published: boolean;
  sort_order: number | null;
}

type WinnerDraft = {
  name: string;
  artwork: string;
  institution: string;
};

type WinnerView = WinnerDraft & {
  key: string;
  programmeId: string;
  heading: string;
  image: string;
  winnerIndex: number;
};

const EMPTY_WINNER: WinnerDraft = { name: "", artwork: "", institution: "" };

export function Awards({ notify, confirm }: SectionProps) {
  const intl = useSupabaseCrud<Programme>("programmes", {
    filter: { subtype: "international-award" },
    orderBy: "sort_order",
  });
  const natl = useSupabaseCrud<Programme>("programmes", {
    filter: { subtype: "national-award" },
    orderBy: "sort_order",
  });
  const { artworks } = useAllArtworks();
  const [editing, setEditing] = useState<{
    programmeId: string;
    heading: string;
    index: number | "new";
    draft: WinnerDraft;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const international = useMemo(
    () =>
      intl.rows.flatMap((row) => {
        const parsed = parseAwardees(row.body);
        return enrichAwardWinners(parsed, artworks).map((winner, index) => ({
          key: `${row.id}-${index}`,
          programmeId: row.id,
          heading: row.title,
          name: winner.name,
          artwork: winner.artwork,
          institution: winner.institution,
          image: winner.image,
          winnerIndex: index,
        }));
      }),
    [artworks, intl.rows],
  );
  const national = useMemo(
    () =>
      natl.rows.flatMap((row) => {
        const parsed = parseAwardees(row.body);
        return enrichAwardWinners(parsed, artworks).map((winner, index) => ({
          key: `${row.id}-${index}`,
          programmeId: row.id,
          heading: row.title,
          name: winner.name,
          artwork: winner.artwork,
          institution: winner.institution,
          image: winner.image,
          winnerIndex: index,
        }));
      }),
    [artworks, natl.rows],
  );

  const save = async () => {
    if (!editing?.draft.name || !editing.draft.artwork) return;
    const crud = intl.rows.some((row) => row.id === editing.programmeId) ? intl : natl;
    const programme = [...intl.rows, ...natl.rows].find((row) => row.id === editing.programmeId);
    if (!programme) return;
    const current = parseAwardees(programme.body);
    const next =
      editing.index === "new"
        ? [...current, editing.draft]
        : current.map((item, index) => (index === editing.index ? editing.draft : item));
    setBusy(true);
    try {
      await crud.update(programme.id, {
        body: serializeAwardees(editing.heading || programme.title, next),
      } as Partial<Programme>);
      await refreshProgrammes();
      notify("success", "Award updated");
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (winner: WinnerView, index: number) => {
    if (!(await confirm(`Remove ${winner.name} from awards?`))) return;
    const crud = intl.rows.some((row) => row.id === winner.programmeId) ? intl : natl;
    const programme = [...intl.rows, ...natl.rows].find((row) => row.id === winner.programmeId);
    if (!programme) return;
    const next = parseAwardees(programme.body).filter((_, i) => i !== index);
    try {
      await crud.update(programme.id, {
        body: serializeAwardees(programme.title, next),
      } as Partial<Programme>);
      await refreshProgrammes();
      notify("success", "Award removed");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  if (intl.loading || natl.loading) {
    return (
      <div className="adm-loader">
        <div className="adm-spinner" />
      </div>
    );
  }

  const renderTable = (label: string, rows: WinnerView[], programmes: Programme[]) => (
    <div style={{ marginBottom: 32 }}>
      <div className="adm-section__header">
        <h3 style={{ fontSize: 18, fontWeight: 500 }}>{label}</h3>
        {programmes[0] && (
          <button
            className="adm-btn adm-btn--secondary adm-btn--small"
            onClick={() =>
              setEditing({
                programmeId: programmes[0].id,
                heading: programmes[0].title,
                index: "new",
                draft: { ...EMPTY_WINNER },
              })
            }
          >
            + Add {label.replace(/s$/, "")}
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <div className="adm-empty">No {label.toLowerCase()} yet.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Artist</th>
              <th>Artwork</th>
              <th>Institution</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((winner) => (
              <tr key={winner.key}>
                <td>
                  {winner.image ? (
                    <img src={winner.image} alt="" className="adm-table__thumb" />
                  ) : (
                    "—"
                  )}
                </td>
                <td>{winner.name}</td>
                <td>{winner.artwork}</td>
                <td>{winner.institution || "—"}</td>
                <td>
                  <div className="adm-table__actions">
                    <button
                      className="adm-btn adm-btn--secondary adm-btn--small"
                      onClick={() =>
                        setEditing({
                          programmeId: winner.programmeId,
                          heading: winner.heading,
                          index: winner.winnerIndex,
                          draft: {
                            name: winner.name,
                            artwork: winner.artwork,
                            institution: winner.institution,
                          },
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="adm-btn adm-btn--danger adm-btn--small"
                      onClick={() => handleDelete(winner, winner.winnerIndex)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Awards</h2>
      </div>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        Each award winner is listed separately. Images come from the matching artwork in the catalogue when available.
      </p>

      {editing && (
        <div className="adm-card">
          <FormField
            label="Artist"
            value={editing.draft.name}
            onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, name: v } })}
            required
          />
          <FormField
            label="Artwork title"
            value={editing.draft.artwork}
            onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, artwork: v } })}
            required
          />
          <FormField
            label="Institution"
            value={editing.draft.institution}
            onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, institution: v } })}
          />
          <div className="adm-form-actions">
            <button className="adm-btn adm-btn--primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : editing.index === "new" ? "Create" : "Update"}
            </button>
            <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {renderTable("International Awards", international, intl.rows)}
      {renderTable("National Awards", national, natl.rows)}
    </div>
  );
}
