import { createContext } from "react";
import type { CatalogueStatus, MappedCatalogue } from "./types";

export type CatalogueContextValue = {
  status: CatalogueStatus;
  error: string | null;
  catalogues: MappedCatalogue[];
  current: MappedCatalogue | undefined;
};

export const CatalogueContext = createContext<CatalogueContextValue | null>(null);
