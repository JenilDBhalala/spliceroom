"use client";

import { useEffect, useSyncExternalStore } from "react";
import { canvasFamilies } from "@/app/fonts";
import { onUndoKey } from "@/lib/history";
import { notifyRedraw } from "@/lib/images";
import { fontFaces, setFontFamilies } from "@/lib/render/fonts";
import { resetPlaceholders } from "@/lib/render/placeholder";
import { useEditor } from "@/lib/store";
import { useIsPhone } from "@/lib/useMediaQuery";
import MobileShell from "./mobile/MobileShell";
import Preview from "./Preview";
import SlidePanel from "./SlidePanel";
import SlideStrip from "./SlideStrip";
import Toast from "./Toast";
import TopBar from "./TopBar";

setFontFamilies(canvasFamilies);

/** `onReady` fires once saved work has loaded and the editor is on screen. */
export default function Editor({ onReady }: { onReady?: () => void }) {
  const accent = useEditor((s) => s.brand.accent);
  const fmt = useEditor((s) => s.fmt);
  const phone = useIsPhone();
  // Saved work loads from IndexedDB asynchronously; wait so the sample content doesn't flash first.
  const hydrated = useSyncExternalStore(
    (cb) => useEditor.persist.onFinishHydration(cb),
    () => useEditor.persist.hasHydrated(),
    () => false,
  );

  // Ask the browser to keep saved drafts instead of clearing them when space runs low,
  // and (in production) register the service worker so the installed app opens offline.
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    addEventListener("keydown", onUndoKey);
    return () => removeEventListener("keydown", onUndoKey);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-accent", accent);
  }, [accent]);

  // Canvas text needs the web fonts loaded first.
  useEffect(() => {
    Promise.all(fontFaces().map((f) => document.fonts.load(f).catch(() => {})))
      .then(() => document.fonts.ready)
      .then(() => {
        resetPlaceholders();
        notifyRedraw();
      });
  }, []);

  useEffect(() => {
    if (hydrated) onReady?.();
  }, [hydrated, onReady]);

  // The page's server-rendered intro stays visible until saved work is restored.
  if (!hydrated) return null;

  if (phone) {
    return (
      <>
        <MobileShell />
        <Toast />
      </>
    );
  }

  // Tablets and up: fixed-height app with the preview and the panel scrolling separately.
  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)]">
      <TopBar />
      <main className="grid min-h-0 grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="flex min-w-0 flex-col items-center gap-3.5 overflow-auto px-[max(16px,env(safe-area-inset-left,0px))] py-[22px]">
          <Preview />
          <p className="text-center text-[12.5px] text-muted">
            {fmt === "custom"
              ? "Click text or a photo on the post to select it. Drag to move it, scroll on it to resize. Ctrl+Z undoes."
              : "Drag a photo on the post to move it, scroll on it to zoom. Paste an image with Ctrl+V. Ctrl+Z undoes."}
          </p>
          <SlideStrip />
        </section>
        <SlidePanel />
      </main>
      <Toast />
    </div>
  );
}
