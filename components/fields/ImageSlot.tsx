import { useRef, useState } from "react";
import type { Framing, ImageSlot as Slot, SlotPath } from "@/types/post";
import { getIn, loadFileInto, useEditor } from "@/lib/store";

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

/** An image box that takes a click, a drop or Ctrl+V (after it was touched). */
export default function ImageSlot({ label, path, framingPath, contain, tip = "Click, drop or paste an image", empty }: Props) {
  const slot = useEditor((s) => getIn<Slot>(s, path));
  const framing = useEditor((s) => getIn<Framing>(s, framingPath ?? path));
  const update = useEditor((s) => s.update);
  const resetFraming = useEditor((s) => s.resetFraming);
  const setImage = useEditor((s) => s.setImage);
  const setActiveSlot = useEditor((s) => s.setActiveSlot);
  const fileRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const fPath = framingPath ?? path;
  // The slot can vanish for a frame when its slide is deleted.
  if (!slot || !framing) return null;

  return (
    <div
      className={`grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-[10px] border bg-raise p-2.5 ${over ? "border-accent" : "border-line"}`}
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
              min={1}
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
          {slot.src && !framingPath && (
            <button type="button" className="btn btn-small btn-ghost btn-danger" onClick={() => setImage(path, null)}>
              Remove
            </button>
          )}
        </div>
      </div>
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
