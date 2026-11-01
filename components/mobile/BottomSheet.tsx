import { useRef, useState, type ReactNode } from "react";

export type SheetSnap = "half" | "full";
/** Sheet heights in px for a viewport height; full still leaves a strip of the preview visible. */
const heights = (vh: number) => ({ half: Math.round(vh * 0.42), full: Math.max(Math.round(vh * 0.42), vh - 290) });

interface Props {
  title: string;
  snap: SheetSnap;
  onSnap: (s: SheetSnap) => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet that sits in the layout (so the preview above shrinks instead of being covered).
 * Drag the handle: up for full height, down for half, further down to close. Tapping it toggles.
 */
export default function BottomSheet({ title, snap, onSnap, onClose, children }: Props) {
  const drag = useRef<{ y: number; h: number; moved: boolean } | null>(null);
  const [live, setLive] = useState<number | null>(null);
  const vh = () => (typeof window === "undefined" ? 800 : innerHeight);

  const end = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const hs = heights(vh());
    const h = live ?? hs[snap];
    setLive(null);
    if (!d.moved) return onSnap(snap === "half" ? "full" : "half");
    if (h < hs.half * 0.7) onClose();
    else onSnap(h > (hs.half + hs.full) / 2 ? "full" : "half");
  };

  return (
    <section
      aria-label={title}
      className="flex min-h-0 flex-none flex-col rounded-t-2xl border-t border-line bg-panel shadow-[0_-12px_40px_rgba(0,0,0,.45)] transition-[height] duration-200 ease-out data-[dragging=true]:transition-none"
      data-dragging={live !== null}
      style={{ height: live ?? (snap === "half" ? "42dvh" : "max(42dvh, calc(100dvh - 290px))") }}
    >
      <div
        className="flex flex-none cursor-grab touch-none flex-col items-center gap-1.5 pt-2 pb-1 select-none"
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, h: e.currentTarget.parentElement!.getBoundingClientRect().height, moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dy = e.clientY - d.y;
          if (Math.abs(dy) > 6) d.moved = true;
          if (d.moved) setLive(Math.max(80, Math.min(heights(vh()).full + 40, d.h - dy)));
        }}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <span aria-hidden className="h-1.5 w-10 rounded-full bg-line" />
        <div className="flex w-full items-center justify-between px-4">
          <h2 className="m-0 font-display text-xl leading-none tracking-[.02em] uppercase">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="grid size-9 cursor-pointer place-items-center rounded-full text-muted hover:bg-raise hover:text-fg"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 14 14">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-4 pt-2 pb-6">{children}</div>
    </section>
  );
}
