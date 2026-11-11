import { useEffect, useRef, useState } from "react";
import type { Framing, ImageSlot, Region, TextMove, TextMoves } from "@/types/post";
import { renderSlide } from "@/lib/render";
import { MIN_ZOOM, imageOf, overflow } from "@/lib/render/helpers";
import { getIn, loadFileInto, slideLayers, useEditor, useRenderState, useSlides } from "@/lib/store";
import { useRedrawTick } from "@/lib/useRedrawTick";

type Pt = { x: number; y: number };

/** Screen pixels a pointer must travel before a press counts as a drag. */
const TAP_SLOP = 6;
/** Template text snaps back into its original column or row within this fraction of the slide. */
const SNAP = 0.012;

/**
 * The big slide preview: drag a photo to reposition it, scroll or pinch to zoom,
 * drop or paste an image into it. `fit` sizes it to fill its container (a size container).
 * Template text blocks can be dragged and resized the same way.
 * `onItemTap` fires when a canvas layer or text block is tapped (released without dragging).
 */
export default function Preview({ fit = false, onItemTap }: { fit?: boolean; onItemTap?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regionsRef = useRef<Region[]>([]);
  // Active pointers (canvas units) and the gesture they drive: one finger drags, two pinch.
  // `rect` is the canvas's screen box when the gesture began: the layout can change mid-gesture
  // (a phone's sheet opening shrinks the preview), and re-measuring then would make things jump.
  // Nothing moves until the pointer travels TAP_SLOP px, so a tap never nudges.
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<{
    reg: Region;
    last: Pt;
    rect: DOMRect;
    start: { x: number; y: number };
    moved: boolean;
    pinch?: { dist: number; value: number };
    /** Text drags track the unsnapped position, so snapping never sticks. */
    raw?: { dx: number; dy: number };
  } | null>(null);
  const [grab, setGrab] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Outline of the selected layer or template text block, in layout units.
  const [selBox, setSelBox] = useState<Region | null>(null);
  const layerSel = useEditor((s) => s.layerSel);
  const textSel = useEditor((s) => s.textSel?.key ?? null);
  // Guide lines while a text block sits snapped on its original column (v) or row (h).
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });
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
      setSelBox(regionsRef.current.find((r) => (r.layer && r.layer.id === layerSel) || (r.text && r.text.key === textSel)) ?? null);
    });
    return () => cancelAnimationFrame(raf);
  }, [state, slide, tick, pxWidth, W, H, layerSel, textSel]);

  const toCanvas = (e: { clientX: number; clientY: number }, rect?: DOMRect): Pt => {
    const r = rect ?? canvasRef.current!.getBoundingClientRect();
    const f = frameRef.current;
    return { x: ((e.clientX - r.left) * f.W) / r.width, y: ((e.clientY - r.top) * f.H) / r.height };
  };
  // Canvas layers stack in order (front wins); in templates the smallest thing under the pointer wins,
  // so text and inset photos can be grabbed on top of a full-slide photo.
  const hit = ({ x, y }: Pt) => {
    const hits = regionsRef.current.filter((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (hits.some((r) => r.layer)) return hits[hits.length - 1];
    return hits.sort((a, b) => a.w * a.h - b.w * b.h)[0];
  };
  const moveOf = (reg: Region): TextMove => getIn<TextMoves | undefined>(useEditor.getState(), reg.path)?.[reg.text!.key] ?? { dx: 0, dy: 0, s: 1 };
  // A region's "size": photo zoom, text block scale, or for canvas layers the font size (text) or width (photo).
  const scaleOf = (reg: Region) => {
    if (reg.text) return moveOf(reg).s;
    const o = getIn<Record<string, number>>(useEditor.getState(), reg.path);
    return reg.layer ? o[reg.layer.resize] : o.zoom;
  };
  const setScale = (reg: Region, v: number) => {
    const { update } = useEditor.getState();
    if (reg.text) return update(reg.path, { [reg.text.key]: { ...moveOf(reg), s: Math.max(0.3, Math.min(3, v)) } });
    if (!reg.layer) return update(reg.path, { zoom: Math.max(MIN_ZOOM, Math.min(3, v)) });
    const [lo, hi] = reg.layer.resize === "size" ? [10, 420] : [0.05, 1.2];
    update(reg.path, { [reg.layer.resize]: Math.max(lo, Math.min(hi, v)) });
  };
  /** Where a dropped or pasted image goes for a region (null for text). */
  const imageTarget = (reg: Region) => {
    if (reg.text) return null;
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
    // Bound once: the helpers read the latest state from the store and refs on every call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Layers: arrow keys nudge (Shift for bigger steps), Delete removes, Escape deselects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable], dialog")) return;
      const st = useEditor.getState();
      if (!st.layerSel) return;
      const { path, layers } = slideLayers(st);
      const i = layers.findIndex((l) => l.id === st.layerSel);
      if (i < 0) return;
      const l = layers[i];
      const step = e.shiftKey ? 0.02 : 0.005;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key]) {
        e.preventDefault();
        const [dx, dy] = moves[e.key];
        st.update([...path, i], { x: Math.max(0, Math.min(1, l.x + dx)), y: Math.max(0, Math.min(1, l.y + dy)) });
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
      const first = regionsRef.current.find((r) => !r.text);
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
      setGuides({ v: false, h: false });
      if (!g.moved) onItemTap?.();
    }
  };

  return (
    <div
      className={`${fit ? "preview-fit" : "preview"} relative max-w-full overflow-hidden rounded-md bg-black shadow-[0_18px_50px_rgba(0,0,0,.55)]`}
      style={{ aspectRatio: `${W} / ${H}`, "--ar": W / H } as React.CSSProperties}
    >
      <canvas
        ref={canvasRef}
        aria-label="Slide preview"
        className={`block size-full touch-none ${dragging ? "cursor-grabbing" : grab ? "cursor-grab" : ""}`}
        onPointerDown={(e) => {
          if (!gesture.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pt = toCanvas(e, rect);
            const reg = hit(pt);
            const st = useEditor.getState();
            st.setLayerSel(reg?.layer?.id ?? null);
            st.setTextSel(reg?.text ? { ...reg.text } : null);
            // A template photo: its box in the panel lights up (and pastes go there).
            if (reg && !reg.text && !reg.layer) st.setActiveSlot(reg.imgPath ?? reg.path);
            if (!reg) return;
            gesture.current = { reg, last: pt, rect, start: { x: e.clientX, y: e.clientY }, moved: false };
            setDragging(true);
          }
          const g = gesture.current;
          pointers.current.set(e.pointerId, toCanvas(e, g.rect));
          e.currentTarget.setPointerCapture(e.pointerId);
          if (pointers.current.size === 2) {
            g.moved = true;
            g.pinch = { dist: distance(), value: scaleOf(g.reg) };
          }
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g || !pointers.current.has(e.pointerId)) return;
          const pt = toCanvas(e, g.rect);
          pointers.current.set(e.pointerId, pt);
          if (!g.moved) {
            if (Math.hypot(e.clientX - g.start.x, e.clientY - g.start.y) < TAP_SLOP) return;
            g.moved = true;
          }
          if (g.pinch && pointers.current.size >= 2) {
            setScale(g.reg, (g.pinch.value * distance()) / Math.max(1, g.pinch.dist));
            return;
          }
          const st = useEditor.getState();
          if (g.reg.text) {
            const f = frameRef.current;
            const m = moveOf(g.reg);
            const raw = (g.raw ??= { dx: m.dx, dy: m.dy });
            raw.dx += (pt.x - g.last.x) / f.W;
            raw.dy += (pt.y - g.last.y) / f.H;
            const snap = (v: number) => (Math.abs(v) < SNAP ? 0 : v);
            const dx = Math.max(-1, Math.min(1, snap(raw.dx)));
            const dy = Math.max(-1, Math.min(1, snap(raw.dy)));
            setGuides({ v: dx === 0, h: dy === 0 });
            st.update(g.reg.path, { [g.reg.text.key]: { ...m, dx, dy } });
            g.last = pt;
            return;
          }
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
            // Zoomed in, dragging pans over what's cropped; zoomed out (negative overflow), it moves the photo in the free space.
            if (Math.abs(ex) > 0.5) patch.ox = Math.max(-1, Math.min(1, f.ox - (2 * (pt.x - g.last.x)) / ex));
            if (Math.abs(ey) > 0.5) patch.oy = Math.max(-1, Math.min(1, f.oy - (2 * (pt.y - g.last.y)) / ey));
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
      {dragging && selBox?.text && guides.v && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-accent/80" style={{ left: `${((selBox.x + selBox.w / 2) / W) * 100}%` }} />
      )}
      {dragging && selBox?.text && guides.h && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 h-px bg-accent/80" style={{ top: `${((selBox.y + selBox.h / 2) / H) * 100}%` }} />
      )}
      {selBox && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-sm border-2 border-dashed border-accent shadow-[0_0_0_1px_rgba(0,0,0,.5)]"
          style={{
            left: `${(selBox.x / W) * 100}%`,
            top: `${(selBox.y / H) * 100}%`,
            width: `${(selBox.w / W) * 100}%`,
            height: `${(selBox.h / H) * 100}%`,
            transform: selBox.rotate ? `rotate(${selBox.rotate}deg)` : undefined,
          }}
        />
      )}
    </div>
  );
}
