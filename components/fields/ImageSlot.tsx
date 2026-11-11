import { useEffect, useRef, useState } from "react";
import type { Framing, PhotoFx, ImageSlot as Slot, SlotPath } from "@/types/post";
import { MIN_ZOOM } from "@/lib/render/helpers";
import { getIn, loadFileInto, useEditor } from "@/lib/store";
import Slider from "./Slider";
import Toggle from "./Toggle";

interface Props {
  label: string;
  path: SlotPath;
  /** Framing to edit when it lives apart from the image (the clean slide). */
  framingPath?: SlotPath;
  /** Logos: shown whole, no zoom. */
  contain?: boolean;
  tip?: string;
  /** Shown instead of `tip` while the box is empty. */
  empty?: string;
}

const samePath = (a: SlotPath | null, b: SlotPath) => !!a && a.length === b.length && a.every((k, i) => k === b[i]);
/** Each adjustment's "unchanged" value. */
const FX_NONE: Required<PhotoFx> = { opacity: 1, brightness: 1, contrast: 1, saturate: 1, gray: 0, blur: 0, flip: false };
const pct = (v: number) => `${Math.round(v * 100)}%`;
const signed = (v: number) => `${v >= 1 ? "+" : ""}${Math.round((v - 1) * 100)}`;

/**
 * An image box that takes a click, a drop or Ctrl+V (after it was touched).
 * Tapping its photo on the preview highlights it here; "Adjust" holds opacity, light and color, blur and flip.
 */
export default function ImageSlot({ label, path, framingPath, contain, tip = "Tap to add a photo, or drop or paste one", empty }: Props) {
  const slot = useEditor((s) => getIn<Slot>(s, path));
  const framing = useEditor((s) => getIn<Framing>(s, framingPath ?? path));
  const update = useEditor((s) => s.update);
  const resetFraming = useEditor((s) => s.resetFraming);
  const setImage = useEditor((s) => s.setImage);
  const setActiveSlot = useEditor((s) => s.setActiveSlot);
  const active = useEditor((s) => samePath(s.activeSlot, path));
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const fPath = framingPath ?? path;

  // Picked on the preview: bring this box into view.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  // The slot can vanish for a frame when its slide is deleted.
  if (!slot || !framing) return null;
  const fx: PhotoFx = slot.fx ?? {};
  const setFx = (patch: PhotoFx) => update(path, { fx: { ...fx, ...patch } });
  const adjusted = Object.entries(fx).some(([k, v]) => v !== undefined && v !== FX_NONE[k as keyof PhotoFx]);

  return (
    <div
      ref={ref}
      className={`grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-[10px] border bg-raise p-2.5 ${over || active ? "border-accent" : "border-line"}`}
      onPointerDown={() => setActiveSlot(path)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        loadFileInto(path, e.dataTransfer.files[0]);
      }}
    >
      <button
        type="button"
        aria-label={`Choose ${label}`}
        className="checker grid size-16 cursor-pointer place-items-center overflow-hidden rounded-md text-[22px] text-muted"
        onClick={() => {
          setActiveSlot(path);
          fileRef.current?.click();
        }}
      >
        {slot.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.src} alt="" className={`size-full ${contain ? "object-contain" : "object-cover"}`} />
        ) : (
          <span>+</span>
        )}
      </button>
      <div className="flex min-w-0 flex-col gap-1.5">
        <b className="text-[12.5px]">{label}</b>
        <small className="text-[11.5px] text-muted">{slot.src ? tip : empty || tip}</small>
        {(slot.src || slot.ph) && !contain && (
          <div className="flex items-center gap-2 text-[11.5px] text-muted">
            <span>Zoom</span>
            <input
              type="range"
              min={MIN_ZOOM}
              max={3}
              step={0.01}
              aria-label={`${label} zoom`}
              value={framing.zoom}
              onChange={(e) => update(fPath, { zoom: +e.target.value })}
              className="min-w-0 flex-1 accent-accent"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {(slot.src || slot.ph) && !contain && (
            <button type="button" className="btn btn-small btn-ghost" onClick={() => resetFraming(fPath)}>
              Reset position
            </button>
          )}
          {(slot.src || slot.ph) && (
            <button type="button" aria-expanded={adjusting} className="btn btn-small btn-ghost aria-expanded:border-accent" onClick={() => setAdjusting(!adjusting)}>
              Adjust{adjusted ? " •" : ""}
            </button>
          )}
          {slot.src && !framingPath && (
            <button type="button" className="btn btn-small btn-ghost btn-danger" onClick={() => setImage(path, null)}>
              Remove
            </button>
          )}
        </div>
      </div>
      {adjusting && (
        <div className="col-span-2 flex flex-col gap-2.5 border-t border-line pt-3">
          <Slider label="Opacity" value={fx.opacity ?? 1} min={0} max={1} step={0.05} format={pct} onChange={(opacity) => setFx({ opacity })} />
          <Slider label="Brightness" value={fx.brightness ?? 1} min={0.3} max={1.8} step={0.05} format={signed} onChange={(brightness) => setFx({ brightness })} />
          <Slider label="Contrast" value={fx.contrast ?? 1} min={0.4} max={1.8} step={0.05} format={signed} onChange={(contrast) => setFx({ contrast })} />
          <Slider label="Saturation" value={fx.saturate ?? 1} min={0} max={2} step={0.05} format={signed} onChange={(saturate) => setFx({ saturate })} />
          <Slider label="Black & white" value={fx.gray ?? 0} min={0} max={1} step={0.05} format={pct} onChange={(gray) => setFx({ gray })} />
          <Slider label="Blur" value={fx.blur ?? 0} min={0} max={30} step={1} format={(v) => `${v}`} onChange={(blur) => setFx({ blur })} />
          <Toggle label="Flip (mirror)" checked={!!fx.flip} onChange={(flip) => setFx({ flip })} />
          {adjusted && (
            <button type="button" className="btn btn-small btn-ghost self-start" onClick={() => update(path, { fx: undefined })}>
              Reset adjustments
            </button>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          loadFileInto(path, e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
