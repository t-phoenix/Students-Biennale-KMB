import { createContext } from "react";
import type { HomeCms, HomeCmsStatus } from "./types";

export type HomeCmsContextValue = HomeCms & {
  status: HomeCmsStatus;
};

export const HomeCmsContext = createContext<HomeCmsContextValue | null>(null);
