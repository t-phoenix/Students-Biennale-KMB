import { useCallback, useEffect, useMemo, useState } from "react";
import { useAllArtworks } from "../../../lib/catalogue";
import { enrichAwardWinners } from "../../../lib/programmes/mappers";
import { refreshProgrammes } from "../../../lib/programmes/cache";
import { requireSupabase } from "../../../lib/supabase";
import { MoveButtons } from "../../../components/admin/MoveButtons";
import { SearchableSelect } from "../../../components/admin/SearchableSelect";
import type { SectionProps } from "./types";

interface Programme {
  id: string;
  title: string;
  subtype: string;
  sort_order: number | null;
}

type CatalogueArtist = {
  personId: string;
  name: string;
  institution: string;
};

type CatalogueArtwork = {
  id: string;
  title: string;
  artists: CatalogueArtist[];
};

type WinnerDraft = {
  id?: string;
  programmeId: string;
  artworkId: string;
  personIds: string[];
};

type WinnerView = {
  id: string;
  programmeId: string;
  programmeTitle: string;
  artworkId: string;
  artworkTitle: string;
  image: string;
  artists: { personId?: string; name: string; institution: string }[];
  venue?: string;
  year?: string;
  sortOrder: number;
};

const DEV_HELP =
  "Can’t find an artwork or artist? Ask a developer to add it to the catalogue (artworks / people), then refresh this page.";

function emptyDraft(programmeId: string): WinnerDraft {
  return { programmeId, artworkId: "", personIds: [] };
}

export function Awards({ notify, confirm }: SectionProps) {
  const sb = requireSupabase();
  const { artworks: catalogueArtworks } = useAllArtworks();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [catalogue, setCatalogue] = useState<CatalogueArtwork[]>([]);
  const [winners, setWinners] = useState<WinnerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WinnerDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [artistQuery, setArtistQuery] = useState("");

  const loadCatalogueOptions = useCallback(async () => {
    const { data, error } = await sb
      .from("artworks")
      .select(
        "id, title, published, artwork_contributors(person_id, display_name, institution_name, sort_order)",
      )
      .eq("published", true)
      .order("title");
    if (error) throw error;

    setCatalogue(
      (data ?? []).map((row) => {
        const contributors = (
          (
            row as {
              artwork_contributors?: {
                person_id: string | null;
                display_name: string;
                institution_name: string | null;
                sort_order: number;
              }[];
            }
          ).artwork_contributors ?? []
        )
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .filter((c) => Boolean(c.person_id))
          .map((c) => ({
            personId: c.person_id as string,
            name: c.display_name,
            institution: c.institution_name ?? "",
          }));

        return {
          id: row.id,
          title: row.title,
          artists: contributors,
        };
      }),
    );
  }, [sb]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await loadCatalogueOptions();

      const [{ data: progRows }, { data: winnerRows }] = await Promise.all([
        sb
          .from("programmes")
          .select("id, title, subtype, sort_order")
          .in("subtype", ["international-award", "national-award"])
          .order("sort_order"),
        sb
          .from("award_winners")
          .select(
            "id, programme_id, artwork_id, sort_order, active, artworks(title), award_winner_artists(person_id, sort_order, people(name))",
          )
          .eq("active", true)
          .order("sort_order"),
      ]);

      const progs = (progRows ?? []) as Programme[];
      setProgrammes(progs);

      const cards = (winnerRows ?? []).map((row) => {
        const artworksRel = (row as { artworks?: { title: string } | { title: string }[] | null })
          .artworks;
        const artworkTitle = Array.isArray(artworksRel)
          ? artworksRel[0]?.title ?? ""
          : artworksRel?.title ?? "";

        const artists = (
          (
            row as {
              award_winner_artists?: {
                person_id: string;
                sort_order: number;
                people?: { name: string } | { name: string }[] | null;
              }[];
            }
          ).award_winner_artists ?? []
        )
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((artist) => {
            const peopleRel = artist.people;
            const name = Array.isArray(peopleRel)
              ? peopleRel[0]?.name ?? ""
              : peopleRel?.name ?? "";
            return { personId: artist.person_id, name, institution: "" };
          });

        const programme = progs.find((p) => p.id === row.programme_id);
        return {
          id: row.id,
          programmeId: row.programme_id,
          programmeTitle: programme?.title ?? row.programme_id,
          artworkId: row.artwork_id,
          artworkTitle,
          image: "",
          artists,
          sortOrder: row.sort_order,
        };
      });

      const enriched = enrichAwardWinners(
        cards.map((card) => ({
          id: card.id,
          name: card.artists[0]?.name ?? "",
          artwork: card.artworkTitle,
          institution: card.artists[0]?.institution ?? "",
          artworkId: card.artworkId,
          image: "",
          artists: card.artists.map((a) => ({
            name: a.name,
            institution: a.institution,
            personId: a.personId,
          })),
        })),
        catalogueArtworks,
      );

      setWinners(
        cards.map((card, index) => ({
          ...card,
          image: enriched[index]?.image || "",
          artworkTitle: enriched[index]?.artwork || card.artworkTitle,
          artists:
            enriched[index]?.artists?.map((a, artistIndex) => ({
              personId: card.artists[artistIndex]?.personId ?? a.personId,
              name: a.name,
              institution: a.institution,
            })) ?? card.artists,
          venue: enriched[index]?.venue,
          year: enriched[index]?.year,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [catalogueArtworks, loadCatalogueOptions, sb]);

  useEffect(() => {
    load();
  }, [load]);

  const international = useMemo(
    () =>
      winners.filter((w) =>
        programmes.some((p) => p.id === w.programmeId && p.subtype === "international-award"),
      ),
    [programmes, winners],
  );
  const national = useMemo(
    () =>
      winners.filter((w) =>
        programmes.some((p) => p.id === w.programmeId && p.subtype === "national-award"),
      ),
    [programmes, winners],
  );

  const artworkOptions = useMemo(
    () =>
      catalogue.map((artwork) => ({
        id: artwork.id,
        label: artwork.title,
        meta: artwork.artists.map((a) => a.name).join(", ") || undefined,
      })),
    [catalogue],
  );

  const selectedArtwork = useMemo(
    () => catalogue.find((artwork) => artwork.id === editing?.artworkId) ?? null,
    [catalogue, editing?.artworkId],
  );

  const selectedArtworkPreview = useMemo(() => {
    if (!editing?.artworkId) return null;
    return catalogueArtworks.find((artwork) => artwork.id === editing.artworkId) ?? null;
  }, [catalogueArtworks, editing?.artworkId]);

  const artistOptions = useMemo(() => {
    if (!selectedArtwork) return [];
    const q = artistQuery.trim().toLowerCase();
    return selectedArtwork.artists.filter((artist) => {
      if (editing?.personIds.includes(artist.personId)) return false;
      if (!q) return true;
      return `${artist.name} ${artist.institution}`.toLowerCase().includes(q);
    });
  }, [artistQuery, editing?.personIds, selectedArtwork]);

  const openEdit = (winner?: WinnerView, programmeId?: string) => {
    setArtistQuery("");
    if (!winner) {
      if (!programmeId) return;
      setEditing(emptyDraft(programmeId));
      return;
    }
    setEditing({
      id: winner.id,
      programmeId: winner.programmeId,
      artworkId: winner.artworkId,
      personIds: winner.artists
        .map((artist) => artist.personId)
        .filter((id): id is string => Boolean(id)),
    });
  };

  // When opening edit, resolve person ids from DB if catalogue name match failed
  useEffect(() => {
    if (!editing?.id || editing.personIds.length) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb
        .from("award_winner_artists")
        .select("person_id, sort_order")
        .eq("award_winner_id", editing.id!)
        .order("sort_order");
      if (cancelled || !data?.length) return;
      setEditing((prev) =>
        prev && prev.id === editing.id
          ? { ...prev, personIds: data.map((row) => row.person_id) }
          : prev,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [editing?.id, editing?.personIds.length, sb]);

  const save = async () => {
    if (!editing?.artworkId) {
      notify("error", "Select an artwork from the catalogue");
      return;
    }
    if (!editing.personIds.length) {
      notify("error", "Select at least one artist linked to this artwork");
      return;
    }
    setBusy(true);
    try {
      const siblings = winners.filter((w) => w.programmeId === editing.programmeId);
      const sortOrder = editing.id
        ? siblings.find((w) => w.id === editing.id)?.sortOrder ?? siblings.length
        : siblings.length;

      let winnerId = editing.id;
      if (winnerId) {
        const { error } = await sb
          .from("award_winners")
          .update({ artwork_id: editing.artworkId })
          .eq("id", winnerId);
        if (error) throw error;
        await sb.from("award_winner_artists").delete().eq("award_winner_id", winnerId);
      } else {
        const { data, error } = await sb
          .from("award_winners")
          .insert({
            programme_id: editing.programmeId,
            artwork_id: editing.artworkId,
            sort_order: sortOrder,
            active: true,
          })
          .select("id")
          .single();
        if (error) throw error;
        winnerId = data.id;
      }

      const { error: artistError } = await sb.from("award_winner_artists").insert(
        editing.personIds.map((personId, index) => ({
          award_winner_id: winnerId!,
          person_id: personId,
          sort_order: index,
        })),
      );
      if (artistError) throw artistError;

      await refreshProgrammes();
      await load();
      notify("success", editing.id ? "Award updated" : "Award created");
      setEditing(null);
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (winner: WinnerView) => {
    if (!(await confirm(`Remove award for “${winner.artworkTitle}”?`))) return;
    try {
      const { error } = await sb.from("award_winners").delete().eq("id", winner.id);
      if (error) throw error;
      await refreshProgrammes();
      await load();
      notify("success", "Award removed");
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const moveWinner = async (list: WinnerView[], winner: WinnerView, delta: -1 | 1) => {
    const index = list.findIndex((item) => item.id === winner.id);
    const neighbor = list[index + delta];
    if (!neighbor) return;
    try {
      await sb.from("award_winners").update({ sort_order: neighbor.sortOrder }).eq("id", winner.id);
      await sb.from("award_winners").update({ sort_order: winner.sortOrder }).eq("id", neighbor.id);
      await refreshProgrammes();
      await load();
    } catch (e: unknown) {
      notify("error", e instanceof Error ? e.message : "Failed to reorder");
    }
  };

  const addArtist = (personId: string) => {
    if (!editing) return;
    if (editing.personIds.includes(personId)) return;
    setEditing({ ...editing, personIds: [...editing.personIds, personId] });
    setArtistQuery("");
  };

  const removeArtist = (personId: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      personIds: editing.personIds.filter((id) => id !== personId),
    });
  };

  if (loading) {
    return (
      <div className="adm-loader">
        <div className="adm-spinner" />
      </div>
    );
  }

  const renderTable = (label: string, rows: WinnerView[], subtype: string) => {
    const programme = programmes.find((p) => p.subtype === subtype);
    return (
      <div style={{ marginBottom: 32 }}>
        <div className="adm-section__header">
          <h3 style={{ fontSize: 18, fontWeight: 500 }}>{label}</h3>
          {programme && (
            <button
              className="adm-btn adm-btn--secondary adm-btn--small"
              onClick={() => openEdit(undefined, programme.id)}
            >
              + Add winner
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
                <th>Artwork</th>
                <th>Artists</th>
                <th>Venue</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((winner, i) => (
                <tr key={winner.id}>
                  <td>
                    {winner.image ? (
                      <img src={winner.image} alt="" className="adm-table__thumb" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <strong>{winner.artworkTitle}</strong>
                    {winner.year ? <div style={{ fontSize: 12 }}>{winner.year}</div> : null}
                  </td>
                  <td>
                    {winner.artists.map((artist) => (
                      <div key={`${artist.name}-${artist.institution}`}>
                        {artist.name}
                        {artist.institution ? (
                          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                            {artist.institution}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </td>
                  <td>{winner.venue || "—"}</td>
                  <td>
                    <div className="adm-table__actions">
                      <MoveButtons
                        index={i}
                        total={rows.length}
                        onMove={(delta) => moveWinner(rows, winner, delta)}
                      />
                      <button
                        className="adm-btn adm-btn--secondary adm-btn--small"
                        onClick={() => openEdit(winner)}
                      >
                        Edit
                      </button>
                      <button
                        className="adm-btn adm-btn--danger adm-btn--small"
                        onClick={() => handleDelete(winner)}
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
  };

  const selectedArtists = (selectedArtwork?.artists ?? []).filter((artist) =>
    editing?.personIds.includes(artist.personId),
  );

  return (
    <div className="adm-section">
      <div className="adm-section__header">
        <h2 className="adm-section__title">Awards</h2>
      </div>
      <p className="adm-help">
        Awards link to existing catalogue artworks and artists — title, venue, materials,
        description, and images come from the artwork record. {DEV_HELP}
      </p>

      {editing && (
        <div className="adm-card">
          <SearchableSelect
            label="Artwork"
            required
            value={editing.artworkId || null}
            options={artworkOptions}
            placeholder="Search artworks by title or artist…"
            emptyHint={DEV_HELP}
            onChange={(id) =>
              setEditing({
                ...editing,
                artworkId: id ?? "",
                personIds: [],
              })
            }
          />

          {selectedArtworkPreview || selectedArtwork ? (
            <div className="adm-preview">
              {selectedArtworkPreview?.image ? (
                <img src={selectedArtworkPreview.image} alt="" />
              ) : (
                <div />
              )}
              <div>
                <div className="adm-preview__title">
                  {selectedArtworkPreview?.title || selectedArtwork?.title}
                </div>
                <div className="adm-preview__meta">
                  {[selectedArtworkPreview?.venue, selectedArtworkPreview?.year]
                    .filter(Boolean)
                    .join(" · ") || "Catalogue details load from the artwork"}
                </div>
                {selectedArtworkPreview?.dimensions ? (
                  <div className="adm-preview__meta">{selectedArtworkPreview.dimensions}</div>
                ) : null}
              </div>
            </div>
          ) : null}

          <label className="adm-field__label">
            Artists<span className="adm-field__req">*</span>
          </label>
          <p className="adm-help" style={{ marginTop: 0 }}>
            Choose artists linked to this artwork. Add more than one if the award is shared.
          </p>

          {selectedArtists.length ? (
            <div className="adm-chip-list">
              {selectedArtists.map((artist) => (
                <span className="adm-chip" key={artist.personId}>
                  {artist.name}
                  <button type="button" onClick={() => removeArtist(artist.personId)} aria-label="Remove">
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="adm-help">No artists selected yet.</p>
          )}

          {editing.artworkId ? (
            <>
              <input
                className="adm-field__input"
                value={artistQuery}
                placeholder="Search artists on this artwork…"
                onChange={(e) => setArtistQuery(e.target.value)}
                disabled={!selectedArtwork}
              />
              {!selectedArtwork?.artists.length ? (
                <p className="adm-help" style={{ marginTop: 8 }}>
                  This artwork has no linked artists yet. {DEV_HELP}
                </p>
              ) : artistOptions.length === 0 ? (
                <p className="adm-help" style={{ marginTop: 8 }}>
                  {artistQuery.trim()
                    ? `No artist matches “${artistQuery.trim()}”. ${DEV_HELP}`
                    : "All linked artists for this artwork are already selected."}
                </p>
              ) : (
                <ul className="adm-search-select__list" style={{ marginTop: 8 }}>
                  {artistOptions.map((artist) => (
                    <li key={artist.personId}>
                      <button
                        type="button"
                        className="adm-search-select__option"
                        onClick={() => addArtist(artist.personId)}
                      >
                        <span>{artist.name}</span>
                        {artist.institution ? <small>{artist.institution}</small> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="adm-help">Select an artwork first to choose artists.</p>
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

      {renderTable("International Awards", international, "international-award")}
      {renderTable("National Awards", national, "national-award")}
    </div>
  );
}
