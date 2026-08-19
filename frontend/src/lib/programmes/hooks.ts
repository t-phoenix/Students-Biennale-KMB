import { useEffect, useMemo, useState } from "react";
import { useAllArtworks } from "../catalogue";
import { FALLBACK_PROGRAMMES, LEGACY_WORKSHOP_IDS } from "./fallbacks";
import { loadProgrammes, peekProgrammes, refreshProgrammes } from "./cache";
import { toResidencySlides, withCatalogueAwards } from "./mappers";
import type { MappedProgrammes, ProgrammeStatus } from "./types";

export function useProgrammes(): MappedProgrammes & { status: ProgrammeStatus; error: string | null } {
  const peeked = peekProgrammes();
  const [data, setData] = useState<MappedProgrammes>(peeked ?? FALLBACK_PROGRAMMES);
  const [status, setStatus] = useState<ProgrammeStatus>(peeked ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);
  const { artworks } = useAllArtworks();

  useEffect(() => {
    let cancelled = false;
    const initial = peekProgrammes();
    (async () => {
      try {
        const loaded = await loadProgrammes();
        if (cancelled) return;
        setData(loaded);
        setStatus("ready");
        const refreshed = await refreshProgrammes();
        if (!cancelled) setData(refreshed);
      } catch (err) {
        if (cancelled) return;
        setData(initial ?? FALLBACK_PROGRAMMES);
        setError(err instanceof Error ? err.message : "Could not load programmes");
        setStatus("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enriched = useMemo(() => withCatalogueAwards(data, artworks), [artworks, data]);

  return { ...enriched, status, error };
}

export function usePastWorkshop(id: string) {
  const programmes = useProgrammes();
  const slug = LEGACY_WORKSHOP_IDS[id] ?? id;
  const idx = programmes.pastWorkshops.findIndex((item) => item.id === slug || item.id === id);
  const workshop = idx >= 0 ? programmes.pastWorkshops[idx] : undefined;
  const next = workshop
    ? programmes.pastWorkshops[(idx + 1) % programmes.pastWorkshops.length]
    : undefined;
  return { ...programmes, workshop, next };
}

export function useResidencySlides() {
  const programmes = useProgrammes();
  return {
    ...programmes,
    slides: toResidencySlides(programmes.residencies),
  };
}
