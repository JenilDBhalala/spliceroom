import { useSyncExternalStore } from "react";
import { CHOSEN_EVENT, consentAnswered } from "./consent";

/** Whether the cookie banner has been answered, so first-run tips can wait for it to go away. */
export function useConsentAnswered() {
  return useSyncExternalStore(
    (cb) => {
      addEventListener(CHOSEN_EVENT, cb);
      return () => removeEventListener(CHOSEN_EVENT, cb);
    },
    consentAnswered,
    () => true,
  );
}
