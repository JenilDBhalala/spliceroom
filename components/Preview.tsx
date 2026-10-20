import { useEffect, useRef, useState } from "react";
import type { Framing, ImageSlot, Region } from "@/types/post";
import { H, W, renderSlide } from "@/lib/render";
import { imageOf, overflow } from "@/lib/render/helpers";
import { getIn, loadFileInto, useEditor, useSlides } from "@/lib/store";
import { useRedrawTick } from "@/lib/useRedrawTick";

/** The big slide preview: drag to reposition, scroll to zoom, drop or paste an image. */
export default function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regionsRef = useRef<Region[]>([]);
  const dragRef = useRef<{ reg: Region; x: number; y: number } | null>(null);
  const [grab, setGrab] = useState(false);
  const [dragging, setDragging] = useState(false);
  const brand = useEditor((s) => s.brand);
  const posts = useEditor((s) => s.posts);
  const { slides, sel } = useSlides();
  const tick = useRedrawTick();
  const slide = slides[sel];
  // Canvas width in device pixels, so the slide is drawn 1:1 with the screen (retina, browser zoom).
  const [pxWidth, setPxWidth] = useState(W);

  useEffect(() => {
    const cv = canvasRef.current!;
    const ro = new ResizeObserver(([entry]) => {
      const device = entry.devicePixelContentBoxSize?.[0]?.inlineSize ?? 0;
      setPxWidth(Math.max(1, Math.round(device), Math.round(entry.contentRect.width * devicePixelRatio)));
    });
    // device-pixel-content-box also fires on browser zoom; Safari lacks it and falls back to contentRect × DPR.
    try {
      ro.observe(cv, { box: "device-pixel-content-box" });
    } catch {
      ro.observe(cv);
    }
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      const pxHeight = Math.round((pxWidth * H) / W);
      if (cv.width !== pxWidth || cv.height !== pxHeight) {
        cv.width = pxWidth;
        cv.height = pxHeight;
      }
      regionsRef.current = renderSlide(ctx, { brand, posts }, slide, pxWidth / W);
      setGrab(regionsRef.current.length > 0);
    });
    return () => cancelAnimationFrame(raf);
  }, [brand, posts, slide, tick, pxWidth]);

  const toCanvas = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height];
  };
  const hit = (x: number, y: number) =>
    [...regionsRef.current].reverse().find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);

  // Wheel zoom needs a non-passive listener so the page doesn't scroll.
  useEffect(() => {
    const cv = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      const [x, y] = toCanvas(e);
      const reg = hit(x, y);
      if (!reg) return;
      e.preventDefault();
      const { update } = useEditor.getState();
      const f = getIn<Framing>(useEditor.getState(), reg.path);
      update(reg.path, { zoom: Math.max(1, Math.min(3, f.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06))) });
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    return () => cv.removeEventListener("wheel", onWheel);
  }, []);

  // Ctrl+V pastes into the last touched image box, else the slide's main photo.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (!item) return;
      e.preventDefault();
      const { activeSlot, showToast } = useEditor.getState();
      const first = regionsRef.current[0];
      const target = activeSlot ?? (first && (first.imgPath ?? first.path));
      if (!target) return showToast("Click a photo box first, then paste.");
      loadFileInto(target, item.getAsFile());
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div className="preview relative aspect-[4/5] max-w-full overflow-hidden rounded-md bg-black shadow-[0_18px_50px_rgba(0,0,0,.55)]">
      <canvas
        ref={canvasRef}
        aria-label="Slide preview"
        className={`block size-full touch-none ${dragging ? "cursor-grabbing" : grab ? "cursor-grab" : ""}`}
        onPointerDown={(e) => {
          const [x, y] = toCanvas(e);
          const reg = hit(x, y);
          if (!reg) return;
          dragRef.current = { reg, x, y };
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          if (!drag) return;
          const [x, y] = toCanvas(e);
          const state = useEditor.getState();
          const f = getIn<Framing>(state, drag.reg.path);
          const im = imageOf(getIn<ImageSlot>(state, drag.reg.imgPath ?? drag.reg.path));
          if (im) {
            const [ex, ey] = overflow(im, f, drag.reg.w, drag.reg.h);
            const patch: Partial<Framing> = {};
            if (ex > 0) patch.ox = Math.max(-1, Math.min(1, f.ox - (2 * (x - drag.x)) / ex));
            if (ey > 0) patch.oy = Math.max(-1, Math.min(1, f.oy - (2 * (y - drag.y)) / ey));
            state.update(drag.reg.path, patch);
          }
          drag.x = x;
          drag.y = y;
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const [x, y] = toCanvas(e);
          const reg = hit(x, y) ?? regionsRef.current[0];
          if (reg) loadFileInto(reg.imgPath ?? reg.path, e.dataTransfer.files[0]);
        }}
      />
    </div>
  );
}
