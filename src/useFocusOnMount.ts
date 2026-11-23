import { useEffect, useRef } from "react";

/** Moves focus to the returned ref's element on mount (when enabled), so screen changes are announced. */
export function useFocusOnMount<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!enabled) return;
    ref.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [enabled]);
  return ref;
}
