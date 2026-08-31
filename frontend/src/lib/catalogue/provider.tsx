import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LATEST_EDITION } from "../../data/site";
import { loadCatalogues, peekCatalogues, refreshCataloguesIfStale } from "./cache";
import { CatalogueContext } from "./context";
import { mergeCatalogues } from "./mappers";
import { prefetchCatalogueImages } from "../predictivePrefetch";

export function CatalogueProvider({ children }: { children: ReactNode }) {
  const peeked = peekCatalogues();
  const [catalogues, setCatalogues] = useState(peeked ?? []);
  const [status, setStatus] = useState(peeked?.length ? ("ready" as const) : ("loading" as const));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initial = peekCatalogues();
    (async () => {
      try {
        const loaded = await loadCatalogues();
        if (cancelled) return;
        setCatalogues(loaded);
        setStatus("ready");
        const refreshed = await refreshCataloguesIfStale();
        if (!cancelled && refreshed) setCatalogues(refreshed);
      } catch (err) {
        if (cancelled) return;
        const fallback = initial?.length ? initial : mergeCatalogues([]);
        setCatalogues(fallback);
        setError(err instanceof Error ? err.message : "Could not load catalogue");
        setStatus("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !catalogues.length) return;
    prefetchCatalogueImages(catalogues);
  }, [status, catalogues]);

  const value = useMemo(
    () => ({
      status,
      error,
      catalogues,
      current:
        catalogues.find((row) => row.isCurrent) ??
        catalogues.find((row) => row.years === LATEST_EDITION.id),
    }),
    [catalogues, status, error],
  );

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}
