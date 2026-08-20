import { useContext } from "react";
import { HomeCmsContext } from "./context";

export function useHomeCms() {
  const ctx = useContext(HomeCmsContext);
  if (!ctx) {
    throw new Error("useHomeCms must be used inside HomeCmsProvider");
  }
  return ctx;
}
