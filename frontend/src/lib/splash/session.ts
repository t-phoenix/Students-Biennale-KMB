/** Once-per-session splash gate — sessionStorage + in-memory guards for StrictMode. */

const STORAGE_KEY = "sb-splash-seen-v1";

let consumedThisRuntime = false;
/** Sticky offer decision so StrictMode remounts keep the same answer. */
let offeredDecision: boolean | null = null;
let completedThisRuntime = false;

export function hasSeenSplashThisSession(): boolean {
  if (consumedThisRuntime) return true;
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function shouldOfferSplash(): boolean {
  return !hasSeenSplashThisSession();
}

/** Mark splash as consumed for this tab session (idempotent). */
export function markSplashSeen(): void {
  consumedThisRuntime = true;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Private mode / quota — runtime flag still prevents remount replay.
  }
}

/**
 * Resolve whether splash should run on this app boot (home index only).
 * Sticky for the JS runtime so React StrictMode remounts stay consistent.
 */
export function resolveInitialSplashOffer(isHome: boolean): boolean {
  if (completedThisRuntime) return false;
  if (offeredDecision !== null) return offeredDecision;
  offeredDecision = isHome && shouldOfferSplash();
  if (offeredDecision) markSplashSeen();
  return offeredDecision;
}

export function markSplashCompletedRuntime(): void {
  completedThisRuntime = true;
}
