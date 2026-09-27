import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useParams, useSearchParams } from "react-router-dom";
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

const STORAGE_KEY = "edition_view_mode";

function getStoredView(): "grid" | "list" | null {
  try {
    const val = sessionStorage.getItem(STORAGE_KEY);
    if (val === "grid" || val === "list") return val;
  } catch {}
  return null;
}

export function EditionSearchProvider({ children }: { children: ReactNode }) {
  const { yearId = LATEST_EDITION.id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  const initialView = useMemo(() => {
    const param = searchParams.get("view");
    if (param === "grid" || param === "list") return param;
    const stored = getStoredView();
    if (stored) return stored;
    return "grid";
  }, [searchParams]);

  const [view, setViewState] = useState<"grid" | "list">(initialView);

  // Sync state if URL search param changes (e.g. browser back/forward button)
  useEffect(() => {
    const param = searchParams.get("view");
    if (param === "grid" || param === "list") {
      setViewState(param);
      try {
        sessionStorage.setItem(STORAGE_KEY, param);
      } catch {}
    } else {
      const stored = getStoredView();
      if (stored) {
        setViewState(stored);
      }
    }
  }, [searchParams]);

  const setView = useCallback(
    (newView: "grid" | "list") => {
      setViewState(newView);
      try {
        sessionStorage.setItem(STORAGE_KEY, newView);
      } catch {}
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newView === "grid") {
            next.delete("view");
          } else {
            next.set("view", newView);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

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
    [query, view, setView, results],
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
