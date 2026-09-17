import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  markSplashCompletedRuntime,
  resolveInitialSplashOffer,
} from "./session";

type SplashContextValue = {
  /** Splash was offered on this first home landing (defers hero entrance). */
  willShow: boolean;
  /** Overlay currently visible. */
  active: boolean;
  /** Splash finished — or was never offered. Safe to run page entrances. */
  completed: boolean;
  markComplete: () => void;
};

const SplashContext = createContext<SplashContextValue | null>(null);

function isHomePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/";
}

export function SplashProvider({ children }: { children: ReactNode }) {
  const offeredRef = useRef(
    typeof window !== "undefined"
      ? resolveInitialSplashOffer(isHomePath(window.location.pathname))
      : false,
  );
  const [active, setActive] = useState(offeredRef.current);
  const [completed, setCompleted] = useState(!offeredRef.current);

  const markComplete = useCallback(() => {
    markSplashCompletedRuntime();
    setActive(false);
    setCompleted(true);
  }, []);

  const value = useMemo<SplashContextValue>(
    () => ({
      willShow: offeredRef.current,
      active,
      completed,
      markComplete,
    }),
    [active, completed, markComplete],
  );

  return <SplashContext.Provider value={value}>{children}</SplashContext.Provider>;
}

export function useSplash(): SplashContextValue {
  const ctx = useContext(SplashContext);
  if (!ctx) {
    return {
      willShow: false,
      active: false,
      completed: true,
      markComplete: () => undefined,
    };
  }
  return ctx;
}
