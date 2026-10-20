// Decoded images keyed by their data URL, so editor state stays plain data.
const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();
const listeners = new Set<() => void>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => {
        cache.set(src, im);
        pending.delete(src);
        listeners.forEach((fn) => fn());
        resolve(im);
      };
      im.onerror = () => {
        pending.delete(src);
        reject(new Error("Could not decode image"));
      };
      im.src = src;
    });
    pending.set(src, p);
  }
  return p;
}

/** The decoded image if ready; otherwise starts loading it and returns null. */
export function imageFor(src: string | null): HTMLImageElement | null {
  if (!src) return null;
  const hit = cache.get(src);
  if (hit) return hit;
  loadImage(src).catch(() => {});
  return null;
}

/** Called whenever a new image finishes decoding (so canvases can redraw). */
export function onImageLoaded(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () =>
      loadImage(fr.result as string).then(() => resolve(fr.result as string), reject);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

/** Ask canvases to redraw (e.g. after web fonts finish loading). */
export function notifyRedraw() {
  listeners.forEach((fn) => fn());
}
