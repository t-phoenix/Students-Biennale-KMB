import { lazy, type ComponentType } from "react";

/**
 * Resilient lazy loader for route code-splitting.
 * Automatically retries failed dynamic imports (e.g. mobile network drops or stale Vite chunk hashes)
 * before falling back or reloading the page.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then(resolve)
          .catch((error: unknown) => {
            if (remaining > 0) {
              window.setTimeout(() => {
                attempt(remaining - 1);
              }, interval);
            } else {
              // If dynamic import failed completely, check if we haven't already reloaded this session
              const reloadKey = "sb-chunk-reload-timestamp";
              const lastReload = sessionStorage.getItem(reloadKey);
              const now = Date.now();
              // Prevent infinite reload loops (only reload once per 10 seconds)
              if (!lastReload || now - Number(lastReload) > 10000) {
                sessionStorage.setItem(reloadKey, String(now));
                window.location.reload();
                return;
              }
              reject(error);
            }
          });
      };
      attempt(retries);
    })
  );
}

/**
 * Registers a global listener for Vite's chunk preloading error event.
 * Automatically reloads the latest index.html when a deployment has invalidated old chunk hashes.
 */
export function registerVitePreloadErrorHandler(): () => void {
  if (typeof window === "undefined") return () => {};

  const onPreloadError = (e: Event) => {
    e.preventDefault();
    const reloadKey = "sb-vite-preload-reload";
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 10000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
    }
  };

  window.addEventListener("vite:preloadError", onPreloadError);
  return () => {
    window.removeEventListener("vite:preloadError", onPreloadError);
  };
}

