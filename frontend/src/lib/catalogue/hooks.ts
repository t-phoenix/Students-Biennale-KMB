import { useContext, useMemo } from "react";
import { CatalogueContext } from "./context";
import { emptyEditionCatalogue } from "./mappers";
import type { CatalogueStatus, MappedCatalogue } from "./types";

export function useCatalogue() {
  const ctx = useContext(CatalogueContext);
  if (!ctx) {
    throw new Error("useCatalogue must be used inside CatalogueProvider");
  }
  return ctx;
}

export function useEditionCatalogue(yearId: string): {
  status: CatalogueStatus;
  error: string | null;
  catalogue: MappedCatalogue;
} {
  const { status, error, catalogues } = useCatalogue();
  const catalogue =
    catalogues.find((row) => row.years === yearId || row.slug === yearId || row.editionId === yearId) ??
    emptyEditionCatalogue(yearId, 0);
  return { status, error, catalogue };
}

export function useAllArtworks() {
  const { catalogues, status, error } = useCatalogue();
  const artworks = useMemo(
    () =>
      catalogues.flatMap((row) =>
        row.artworks.map((artwork) => ({ ...artwork, year: artwork.year || row.years })),
      ),
    [catalogues],
  );
  return { artworks, catalogues, status, error };
}
