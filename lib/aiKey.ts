// A visitor's own Gemini key and model, kept only in this browser (localStorage) and sent with news requests.
import { useSyncExternalStore } from "react";

export interface OwnAi {
  key: string;
  model: string;
}

const STORE = "spliceroom.gemini";
const listeners = new Set<() => void>();
let cached: OwnAi | null | undefined;

export function getOwnAi(): OwnAi | null {
  if (cached !== undefined) return cached;
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? "null") as OwnAi | null;
    cached = v?.key ? v : null;
  } catch {
    cached = null;
  }
  return cached;
}

/** Saves (or with null, forgets) the key; private windows may refuse to store it, so it lasts until the tab closes. */
export function setOwnAi(v: OwnAi | null) {
  cached = v;
  try {
    if (v) localStorage.setItem(STORE, JSON.stringify(v));
    else localStorage.removeItem(STORE);
  } catch {}
  listeners.forEach((l) => l());
}

export function useOwnAi() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getOwnAi,
    () => null,
  );
}

/** Headers that hand the key and model to our server for one request. */
export function ownAiHeaders(v = getOwnAi()): Record<string, string> {
  return v ? { "x-gemini-key": v.key, ...(v.model ? { "x-gemini-model": v.model } : {}) } : {};
}
