// Analytics consent (Google Consent Mode v2). The choice is kept in localStorage and
// applied before Google Analytics loads (see CONSENT_DEFAULTS_SCRIPT in app/layout.tsx).
export const CONSENT_KEY = "spliceroom.consent";
export const CONSENT_EVENT = "spliceroom:consent-settings";
export type Consent = "granted" | "denied";

// EU/EEA, UK and Switzerland: analytics stays off until the visitor agrees.
const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
  "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
];

/** Inline script for <head>: consent defaults by region, then any saved choice. Runs before gtag.js. */
export const CONSENT_DEFAULTS_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
var off = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };
gtag("consent", "default", Object.assign({ analytics_storage: "denied", region: ${JSON.stringify(CONSENT_REGIONS)}, wait_for_update: 500 }, off));
gtag("consent", "default", Object.assign({ analytics_storage: "granted" }, off));
try { var c = localStorage.getItem("${CONSENT_KEY}"); if (c) gtag("consent", "update", { analytics_storage: c === "granted" ? "granted" : "denied" }); } catch (e) {}
`;

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {}
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", { analytics_storage: v });
}

/** Re-open the consent banner (the "Cookie settings" link). */
export const openConsentSettings = () => window.dispatchEvent(new Event(CONSENT_EVENT));
