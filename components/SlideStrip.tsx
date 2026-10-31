import { useEffect, useRef } from "react";
import { renderSlide } from "@/lib/render";
import { useEditor, useRenderState, useSlides } from "@/lib/store";
import { useRedrawTick } from "@/lib/useRedrawTick";

const THUMB = "w-14 md:w-[76px]";

const addClass = `${THUMB} flex-none cursor-pointer self-start rounded border-[1.5px] border-dashed border-line bg-transparent p-1 text-[11px] font-semibold leading-tight text-muted hover:border-accent hover:text-accent md:text-xs`;

export default function SlideStrip() {
  const state = useRenderState();
  const { W, H } = state.frame;
  const fmt = useEditor((s) => s.fmt);
  const select = useEditor((s) => s.select);
  const addListItem = useEditor((s) => s.addListItem);
  const addStory = useEditor((s) => s.addStory);
  const addLesson = useEditor((s) => s.addLesson);
  const { slides, sel } = useSlides();
  const tick = useRedrawTick();
  const thumbs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Thumbnails are drawn directly at their device-pixel size, not shrunk from a full render.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      slides.forEach((sl, i) => {
        const c = thumbs.current[i];
        if (!c || !c.clientWidth) return;
        const px = Math.round(c.clientWidth * devicePixelRatio);
        const ph = Math.round((px * H) / W);
        if (c.width !== px || c.height !== ph) {
          c.width = px;
          c.height = ph;
        }
        renderSlide(c.getContext("2d")!, state, sl, px / W);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [state, slides, tick, W, H]);

  // One-slide templates with nothing to add need no strip.
  const canAdd = fmt === "list" || fmt === "news" || fmt === "lessons";
  if (slides.length === 1 && !canAdd) return null;

  return (
    <div className="flex max-w-full gap-2 overflow-x-auto px-1 pt-1 pb-2 md:gap-2.5">
      {slides.map((sl, i) => (
        <button
          key={i}
          type="button"
          aria-current={i === sel}
          aria-label={`Slide ${i + 1}: ${sl.label}`}
          className="group flex flex-none cursor-pointer flex-col items-center gap-[5px] border-0 bg-transparent p-0"
          onClick={() => select(i)}
        >
          <canvas
            ref={(el) => {
              thumbs.current[i] = el;
            }}
            style={{ aspectRatio: `${W} / ${H}` }}
            className={`${THUMB} block rounded bg-black outline-offset-2 group-aria-[current=true]:outline-2 group-aria-[current=true]:outline-accent`}
          />
          <span className={`${THUMB} truncate text-center text-[11px] text-muted tabular-nums`}>{`${i + 1}. ${sl.label}`}</span>
        </button>
      ))}
      {fmt === "list" && (
        <button type="button" className={addClass} style={{ aspectRatio: `${W} / ${H}` }} onClick={addListItem}>
          + Add movie
        </button>
      )}
      {fmt === "news" && (
        <button type="button" className={addClass} style={{ aspectRatio: `${W} / ${H}` }} onClick={addStory}>
          + Add story slide
        </button>
      )}
      {fmt === "lessons" && (
        <button type="button" className={addClass} style={{ aspectRatio: `${W} / ${H}` }} onClick={addLesson}>
          + Add lesson
        </button>
      )}
    </div>
  );
}
