/** Once-per-session splash gate — sessionStorage + in-memory guards for StrictMode. */

const STORAGE_KEY = "sb-splash-seen-v2";

let consumedThisRuntime = false;
/** Sticky offer decision so StrictMode remounts keep the same answer. */
let offeredDecision: boolean | null = null;
let completedThisRuntime = false;

function hasReplayFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.has("splash") || params.has("loader") || params.has("preview");
  } catch {
    return false;
  }
}

export function hasSeenSplashThisSession(): boolean {
  if (hasReplayFlag()) return false;
  if (consumedThisRuntime) return true;
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function shouldOfferSplash(): boolean {
  if (hasReplayFlag()) return true;
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
  if (hasReplayFlag()) return isHome;
  if (completedThisRuntime) return false;
  if (offeredDecision !== null) return offeredDecision;
  offeredDecision = isHome && shouldOfferSplash();
  if (offeredDecision) markSplashSeen();
  return offeredDecision;
}

export function markSplashCompletedRuntime(): void {
  completedThisRuntime = true;
}
