import { useEffect, useRef } from "react";
import type { FormatId } from "@/types/post";
import { track } from "@/lib/analytics";
import { renderSlide, slidesFor } from "@/lib/render";
import { useEditor, useRenderState } from "@/lib/store";
import { TEMPLATE_GROUPS } from "@/lib/templates";
import { useRedrawTick } from "@/lib/useRedrawTick";
import NewsLink from "./NewsLink";

/** Full-screen sheet on phones, centered dialog on larger screens. Each card shows a live preview. */
export default function TemplatePicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const fmt = useEditor((s) => s.fmt);
  const setFmt = useEditor((s) => s.setFmt);

  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const pick = (id: FormatId) => {
    setFmt(id);
    track("template_select", { template: id });
    onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="template-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-panel p-0 text-fg backdrop:bg-black/70 md:m-auto md:h-auto md:max-h-[86vh] md:max-w-4xl md:rounded-2xl md:border md:border-line"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-panel px-4 pt-[max(14px,env(safe-area-inset-top,0px))] pb-3.5 md:px-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="template-title" className="m-0 font-display text-2xl leading-none tracking-[.02em] uppercase">
            What do you want to make?
          </h2>
          <p className="m-0 text-[12.5px] text-muted">Pick one to start. You can change every word, photo and color, and switch any time.</p>
        </div>
        <button type="button" className="btn btn-ghost min-h-10" onClick={onClose} autoFocus>
          Close
        </button>
      </div>
      <div className="flex flex-col gap-7 px-4 pt-5 pb-[calc(28px+env(safe-area-inset-bottom,0px))] md:px-6">
        {open && <NewsLink from="picker" onDone={onClose} />}
        {open &&
          TEMPLATE_GROUPS.map((g) => (
            <section key={g.name} className="flex flex-col gap-3">
              <h3 className="m-0 text-[11px] font-bold tracking-[.12em] text-muted uppercase">{g.name}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {g.templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-current={t.id === fmt}
                    onClick={() => pick(t.id)}
                    className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-line bg-raise p-2 text-left hover:border-muted aria-[current=true]:border-accent aria-[current=true]:ring-1 aria-[current=true]:ring-accent"
                  >
                    <Thumb id={t.id} />
                    <span className="px-1 text-sm font-semibold">{t.name}</span>
                    <span className="px-1 pb-1 text-xs leading-snug text-muted">{t.blurb}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
      </div>
    </dialog>
  );
}

/** The template's first slide, rendered with the current content and size. */
function Thumb({ id }: { id: FormatId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRenderState();
  const tick = useRedrawTick();
  const { W, H } = state.frame;

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const c = ref.current;
      if (!c || !c.clientWidth) return;
      const px = Math.round(c.clientWidth * devicePixelRatio);
      c.width = px;
      c.height = Math.round((px * H) / W);
      renderSlide(c.getContext("2d")!, state, slidesFor(id, state.posts)[0], px / W);
    });
    return () => cancelAnimationFrame(raf);
  }, [id, state, tick, W, H]);

  return <canvas ref={ref} style={{ aspectRatio: `${W} / ${H}` }} className="block w-full rounded-lg bg-black" />;
}
