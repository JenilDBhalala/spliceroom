import { sendGAEvent } from "@next/third-parties/google";

/** Send a GA4 event when Google Analytics is loaded (production only); a no-op otherwise. */
export function track(event: string, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined" || !("dataLayer" in window)) return;
  sendGAEvent("event", event, params);
}
