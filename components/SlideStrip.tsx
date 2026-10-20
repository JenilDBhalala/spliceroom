import { useEffect, useRef } from "react";
import { H, W, renderSlide } from "@/lib/render";
import { useEditor, useSlides } from "@/lib/store";
import { useRedrawTick } from "@/lib/useRedrawTick";

const THUMB_W = 76;

const addClass =
  "h-[95px] w-[76px] flex-none cursor-pointer rounded border-[1.5px] border-dashed border-line bg-transparent p-1.5 text-xs font-semibold text-muted hover:border-accent hover:text-accent";

export default function SlideStrip() {
  const brand = useEditor((s) => s.brand);
  const posts = useEditor((s) => s.posts);
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
      const px = Math.round(THUMB_W * devicePixelRatio);
      slides.forEach((sl, i) => {
        const c = thumbs.current[i];
        if (!c) return;
        if (c.width !== px) {
          c.width = px;
          c.height = Math.round((px * H) / W);
        }
        renderSlide(c.getContext("2d")!, { brand, posts }, sl, px / W);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [brand, posts, slides, tick]);

  return (
    <div className="flex max-w-full gap-2.5 overflow-x-auto px-1 pt-1 pb-2">
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
            className="block h-[95px] w-[76px] rounded bg-black outline-offset-2 group-aria-[current=true]:outline-2 group-aria-[current=true]:outline-accent"
          />
          <span className="text-[11px] text-muted tabular-nums">{`${i + 1}. ${sl.label}`}</span>
        </button>
      ))}
      {fmt === "list" && (
        <button type="button" className={addClass} onClick={addListItem}>
          + Add movie
        </button>
      )}
      {fmt === "news" && (
        <button type="button" className={addClass} onClick={addStory}>
          + Add story slide
        </button>
      )}
      {fmt === "lessons" && (
        <button type="button" className={addClass} onClick={addLesson}>
          + Add lesson
        </button>
      )}
    </div>
  );
}
