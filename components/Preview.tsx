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
  const gesture = useRef<{ reg: Region; last: Pt; pinch?: { dist: number; value: number } } | null>(null);
  const [grab, setGrab] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Outline of the selected blank-canvas layer, in layout units.
  const [selBox, setSelBox] = useState<Region | null>(null);
  const layerSel = useEditor((s) => (s.fmt === "custom" ? s.layerSel : null));
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
      setSelBox(regionsRef.current.find((r) => r.layer && r.layer.id === layerSel) ?? null);
    });
    return () => cancelAnimationFrame(raf);
  }, [state, slide, tick, pxWidth, W, H, layerSel]);

  const toCanvas = (e: { clientX: number; clientY: number }): Pt => {
    const r = canvasRef.current!.getBoundingClientRect();
    const f = frameRef.current;
    return { x: ((e.clientX - r.left) * f.W) / r.width, y: ((e.clientY - r.top) * f.H) / r.height };
  };
  const hit = ({ x, y }: Pt) => [...regionsRef.current].reverse().find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  // A region's "size": photo zoom, or for canvas layers the font size (text) or width (photo).
  const scaleOf = (reg: Region) => {
    const o = getIn<Record<string, number>>(useEditor.getState(), reg.path);
    return reg.layer ? o[reg.layer.resize] : o.zoom;
  };
  const setScale = (reg: Region, v: number) => {
    const { update } = useEditor.getState();
    if (!reg.layer) return update(reg.path, { zoom: Math.max(1, Math.min(3, v)) });
    const [lo, hi] = reg.layer.resize === "size" ? [10, 420] : [0.05, 1.2];
    update(reg.path, { [reg.layer.resize]: Math.max(lo, Math.min(hi, v)) });
  };
  /** Where a dropped or pasted image goes for a region (null for text layers). */
  const imageTarget = (reg: Region) => {
    if (!reg.layer) return reg.imgPath ?? reg.path;
    return reg.layer.resize === "w" ? [...reg.path, "img"] : null;
  };
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
      setScale(reg, scaleOf(reg) * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    return () => cv.removeEventListener("wheel", onWheel);
  }, []);

  // Canvas layers: arrow keys nudge (Shift for bigger steps), Delete removes, Escape deselects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable], dialog")) return;
      const st = useEditor.getState();
      if (st.fmt !== "custom" || !st.layerSel) return;
      const i = st.posts.custom.layers.findIndex((l) => l.id === st.layerSel);
      if (i < 0) return;
      const l = st.posts.custom.layers[i];
      const step = e.shiftKey ? 0.02 : 0.005;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) {
        e.preventDefault();
        const [dx, dy] = moves[e.key];
        st.update(["posts", "custom", "layers", i], { x: Math.max(0, Math.min(1, l.x + dx)), y: Math.max(0, Math.min(1, l.y + dy)) });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        st.removeLayer(l.id);
      } else if (e.key === "Escape") st.setLayerSel(null);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // Ctrl+V pastes into the last touched image box, else the slide's main photo.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (!item) return;
      e.preventDefault();
      const { activeSlot, showToast } = useEditor.getState();
      const first = regionsRef.current[0];
      const target = activeSlot ?? (first && imageTarget(first));
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
            const st = useEditor.getState();
            if (st.fmt === "custom") st.setLayerSel(reg?.layer?.id ?? null);
            if (!reg) return;
            gesture.current = { reg, last: pt };
            setDragging(true);
          }
          pointers.current.set(e.pointerId, pt);
          e.currentTarget.setPointerCapture(e.pointerId);
          if (pointers.current.size === 2) {
            const g = gesture.current;
            g.pinch = { dist: distance(), value: scaleOf(g.reg) };
          }
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g || !pointers.current.has(e.pointerId)) return;
          const pt = toCanvas(e);
          pointers.current.set(e.pointerId, pt);
          if (g.pinch && pointers.current.size >= 2) {
            setScale(g.reg, (g.pinch.value * distance()) / Math.max(1, g.pinch.dist));
            return;
          }
          const st = useEditor.getState();
          if (g.reg.layer) {
            const l = getIn<{ x: number; y: number }>(st, g.reg.path);
            const f = frameRef.current;
            st.update(g.reg.path, {
              x: Math.max(0, Math.min(1, l.x + (pt.x - g.last.x) / f.W)),
              y: Math.max(0, Math.min(1, l.y + (pt.y - g.last.y) / f.H)),
            });
            g.last = pt;
            return;
          }
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
          const target = reg && imageTarget(reg);
          if (target) loadFileInto(target, e.dataTransfer.files[0]);
        }}
      />
      {selBox && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-sm border-2 border-dashed border-accent shadow-[0_0_0_1px_rgba(0,0,0,.5)]"
          style={{
            left: `${(selBox.x / W) * 100}%`,
            top: `${(selBox.y / H) * 100}%`,
            width: `${(selBox.w / W) * 100}%`,
            height: `${(selBox.h / H) * 100}%`,
          }}
        />
      )}
    </div>
  );
}
