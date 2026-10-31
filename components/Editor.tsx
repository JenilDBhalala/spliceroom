"use client";

import { useEffect, useSyncExternalStore } from "react";
import { canvasFamilies } from "@/app/fonts";
import { notifyRedraw } from "@/lib/images";
import { fontFaces, setFontFamilies } from "@/lib/render/fonts";
import { resetPlaceholders } from "@/lib/render/placeholder";
import { useEditor } from "@/lib/store";
import Preview from "./Preview";
import SlidePanel from "./SlidePanel";
import SlideStrip from "./SlideStrip";
import Toast from "./Toast";
import TopBar from "./TopBar";

setFontFamilies(canvasFamilies);

export default function Editor() {
  const accent = useEditor((s) => s.brand.accent);
  // Saved work loads from IndexedDB asynchronously; wait so the sample content doesn't flash first.
  const hydrated = useSyncExternalStore(
    (cb) => useEditor.persist.onFinishHydration(cb),
    () => useEditor.persist.hasHydrated(),
    () => false,
  );

  // Ask the browser to keep saved drafts instead of clearing them when space runs low.
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
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

  if (!hydrated) {
    return <div className="grid min-h-dvh place-items-center text-sm text-muted">Loading your work…</div>;
  }

  return (
    // Phones: the page scrolls and the preview stays pinned on top while you edit below it.
    // Tablets and up: fixed-height app with the preview and the panel scrolling separately.
    <div className="min-h-dvh md:grid md:h-dvh md:grid-rows-[auto_minmax(0,1fr)]">
      <TopBar />
      <main className="md:grid md:min-h-0 md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="sticky top-0 z-10 flex min-w-0 flex-col items-center gap-2 border-b border-line bg-bg px-[max(16px,env(safe-area-inset-left,0px))] pt-3 pb-1 md:static md:gap-3.5 md:overflow-auto md:border-b-0 md:py-[22px]">
          <Preview />
          <p className="text-center text-xs text-muted md:text-[12.5px]">
            <span className="md:hidden">Drag a photo to move it. Pinch to zoom.</span>
            <span className="hidden md:inline">Drag a photo on the preview to reposition it. Scroll on it to zoom. Paste an image with Ctrl+V.</span>
          </p>
          <SlideStrip />
        </section>
        <SlidePanel />
      </main>
      <Toast />
    </div>
  );
}
