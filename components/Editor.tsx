"use client";

import { useEffect } from "react";
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

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] max-[900px]:h-auto max-[900px]:min-h-full">
      <TopBar />
      <main className="grid min-h-0 grid-cols-[minmax(0,1fr)_400px] max-[900px]:grid-cols-[minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col items-center gap-3.5 overflow-auto py-[22px] pr-4 pl-[max(16px,env(safe-area-inset-left,0px))] max-[900px]:pr-[max(16px,env(safe-area-inset-right,0px))]">
          <Preview />
          <p className="text-center text-[12.5px] text-muted">
            Drag a photo on the preview to reposition it. Scroll on it to zoom. Paste an image with Ctrl+V.
          </p>
          <SlideStrip />
        </section>
        <SlidePanel />
      </main>
      <Toast />
    </div>
  );
}
