import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { LATEST_EDITION } from "../data/site";
import { useCatalogue, useEditionCatalogue } from "../lib/catalogue";
import { hasSearchResults, searchEditionCatalog, type EditionSearchResults } from "../lib/catalogue/search";

type EditionSearchContextValue = {
  query: string;
  setQuery: (value: string) => void;
  view: "grid" | "list";
  setView: (value: "grid" | "list") => void;
  isSearching: boolean;
  results: EditionSearchResults;
  hasResults: boolean;
};

const EditionSearchContext = createContext<EditionSearchContextValue | null>(null);

export function EditionSearchProvider({ children }: { children: ReactNode }) {
  const { yearId = LATEST_EDITION.id } = useParams();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const { catalogues } = useCatalogue();
  const { catalogue } = useEditionCatalogue(yearId);

  const results = useMemo(
    () => searchEditionCatalog(query, catalogue, catalogues),
    [query, catalogue, catalogues],
  );

  const value = useMemo(
    () => ({
      query,
      setQuery,
      view,
      setView,
      isSearching: Boolean(query.trim()),
      results,
      hasResults: hasSearchResults(results),
    }),
    [query, view, results],
  );

  return <EditionSearchContext.Provider value={value}>{children}</EditionSearchContext.Provider>;
}

export function useEditionSearch() {
  const ctx = useContext(EditionSearchContext);
  if (!ctx) {
    throw new Error("useEditionSearch must be used inside EditionSearchProvider");
  }
  return ctx;
}
