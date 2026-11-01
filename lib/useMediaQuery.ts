import { useSyncExternalStore } from "react";

/** Live result of a CSS media query (client only). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** Phones get the app-style shell; matches Tailwind's `md` breakpoint. */
export const useIsPhone = () => useMediaQuery("(max-width: 767px)");
