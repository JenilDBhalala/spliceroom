import { useEffect, useRef, useState } from "react";
import type { Framing, ImageSlot, Region } from "@/types/post";
import { renderSlide } from "@/lib/render";
import { imageOf, overflow } from "@/lib/render/helpers";
import { getIn, loadFileInto, useEditor, useRenderState, useSlides } from "@/lib/store";
import { useRedrawTick } from "@/lib/useRedrawTick";

type Pt = { x: number; y: number };

/**
 * The big slide preview: drag a photo to reposition it, scroll or pinch to zoom,
 * drop or paste an image into it.
 */
export default function Preview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regionsRef = useRef<Region[]>([]);
  // Active pointers (canvas units) and the gesture they drive: one finger drags, two pinch.
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<{ reg: Region; last: Pt; pinch?: { dist: number; zoom: number } } | null>(null);
  const [grab, setGrab] = useState(false);
  const [dragging, setDragging] = useState(false);
  const state = useRenderState();
  const { W, H } = state.frame;
  const frameRef = useRef(state.frame);
  const { slides, sel } = useSlides();
  const tick = useRedrawTick();
  const slide = slides[sel];
  // Canvas width in device pixels, so the slide is drawn 1:1 with the screen (retina, browser zoom).
  const [pxWidth, setPxWidth] = useState(W);

  useEffect(() => {
    frameRef.current = state.frame;
  }, [state.frame]);

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
      regionsRef.current = renderSlide(ctx, state, slide, pxWidth / W);
      setGrab(regionsRef.current.length > 0);
    });
    return () => cancelAnimationFrame(raf);
  }, [state, slide, tick, pxWidth, W, H]);

  const toCanvas = (e: { clientX: number; clientY: number }): Pt => {
    const r = canvasRef.current!.getBoundingClientRect();
    const f = frameRef.current;
    return { x: ((e.clientX - r.left) * f.W) / r.width, y: ((e.clientY - r.top) * f.H) / r.height };
  };
  const hit = ({ x, y }: Pt) => [...regionsRef.current].reverse().find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  const setZoom = (reg: Region, zoom: number) => useEditor.getState().update(reg.path, { zoom: Math.max(1, Math.min(3, zoom)) });
  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  // Wheel zoom needs a non-passive listener so the page doesn't scroll.
  useEffect(() => {
    const cv = canvasRef.current!;
    const onWheel = (e: WheelEvent) => {
      const reg = hit(toCanvas(e));
      if (!reg) return;
      e.preventDefault();
      const f = getIn<Framing>(useEditor.getState(), reg.path);
      setZoom(reg, f.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
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
      if (!target) return showToast("Tap a photo box first, then paste.");
      loadFileInto(target, item.getAsFile());
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const endPointer = (id: number) => {
    pointers.current.delete(id);
    const g = gesture.current;
    if (!g) return;
    if (pointers.current.size === 1) {
      // Pinch ended with one finger still down: keep dragging from where it is.
      g.pinch = undefined;
      g.last = [...pointers.current.values()][0];
    } else if (pointers.current.size === 0) {
      gesture.current = null;
      setDragging(false);
    }
  };

  return (
    <div
      className="preview relative max-w-full overflow-hidden rounded-md bg-black shadow-[0_18px_50px_rgba(0,0,0,.55)]"
      style={{ aspectRatio: `${W} / ${H}`, "--ar": W / H } as React.CSSProperties}
    >
      <canvas
        ref={canvasRef}
        aria-label="Slide preview"
        className={`block size-full touch-none ${dragging ? "cursor-grabbing" : grab ? "cursor-grab" : ""}`}
        onPointerDown={(e) => {
          const pt = toCanvas(e);
          if (!gesture.current) {
            const reg = hit(pt);
            if (!reg) return;
            gesture.current = { reg, last: pt };
            setDragging(true);
          }
          pointers.current.set(e.pointerId, pt);
          e.currentTarget.setPointerCapture(e.pointerId);
          if (pointers.current.size === 2) {
            const g = gesture.current;
            g.pinch = { dist: distance(), zoom: getIn<Framing>(useEditor.getState(), g.reg.path).zoom };
          }
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g || !pointers.current.has(e.pointerId)) return;
          const pt = toCanvas(e);
          pointers.current.set(e.pointerId, pt);
          if (g.pinch && pointers.current.size >= 2) {
            setZoom(g.reg, (g.pinch.zoom * distance()) / Math.max(1, g.pinch.dist));
            return;
          }
          const st = useEditor.getState();
          const f = getIn<Framing>(st, g.reg.path);
          const im = imageOf(getIn<ImageSlot>(st, g.reg.imgPath ?? g.reg.path));
          if (im) {
            const [ex, ey] = overflow(im, f, g.reg.w, g.reg.h);
            const patch: Partial<Framing> = {};
            if (ex > 0) patch.ox = Math.max(-1, Math.min(1, f.ox - (2 * (pt.x - g.last.x)) / ex));
            if (ey > 0) patch.oy = Math.max(-1, Math.min(1, f.oy - (2 * (pt.y - g.last.y)) / ey));
            st.update(g.reg.path, patch);
          }
          g.last = pt;
        }}
        onPointerUp={(e) => endPointer(e.pointerId)}
        onPointerCancel={(e) => endPointer(e.pointerId)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const reg = hit(toCanvas(e)) ?? regionsRef.current[0];
          if (reg) loadFileInto(reg.imgPath ?? reg.path, e.dataTransfer.files[0]);
        }}
      />
    </div>
  );
}
