import { useEffect, useRef, useState } from "react";
import type { ImageSlot, NewsPost, SlotPath } from "@/types/post";
import { renderSlide, slidesFor } from "@/lib/render";
import { NEWS_ZOOM, loadFound } from "@/lib/newsClient";
import { useEditor, useRenderState } from "@/lib/store";
import { useRedrawTick } from "@/lib/useRedrawTick";
import RemoteImg from "@/components/RemoteImg";
import { Note } from "./ui";

const P = ["posts", "news"] as const;
const DESIGNS: [NonNullable<NewsPost["design"]>, string][] = [
  ["photo", "Photo"],
  ["band", "Color band"],
  ["frame", "Frame"],
];

/** The three news designs as live mini covers; tap one to use it. */
export function DesignChoices() {
  const design = useEditor((s) => s.posts.news.design ?? "photo");
  const update = useEditor((s) => s.update);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold">Design</span>
      <div role="radiogroup" aria-label="Design" className="grid grid-cols-3 gap-2">
        {DESIGNS.map(([id, name]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={design === id}
            onClick={() => update(P, { design: id })}
            className="flex cursor-pointer flex-col gap-1 rounded-lg border border-line bg-raise p-1 text-xs font-semibold text-muted aria-checked:border-accent aria-checked:text-fg aria-checked:ring-1 aria-checked:ring-accent"
          >
            <CoverThumb design={id} />
            {name}
          </button>
        ))}
      </div>
      <Note>
        These photos come from the news articles and belong to their owners. For more, use official stills and posters the studio has shared,
        or photos you have permission to use, and credit the source in your caption (e.g. &ldquo;Photo: Variety&rdquo;). A credit alone
        isn&rsquo;t permission.
      </Note>
    </div>
  );
}

function CoverThumb({ design }: { design: NonNullable<NewsPost["design"]> }) {
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
      const posts = { ...state.posts, news: { ...state.posts.news, design } };
      renderSlide(c.getContext("2d")!, { ...state, posts }, slidesFor("news", posts)[0], px / W);
    });
    return () => cancelAnimationFrame(raf);
  }, [design, state, tick, W, H]);
  return <canvas ref={ref} style={{ aspectRatio: `${W} / ${H}` }} className="block w-full rounded bg-black" />;
}

/** The headline options written for the story; tap one to put it on the cover. */
export function HeadlineChoices() {
  const headlines = useEditor((s) => s.posts.news.headlines);
  const text = useEditor((s) => s.posts.news.text);
  const update = useEditor((s) => s.update);
  if (!headlines || headlines.length < 2) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold">Headline options</span>
      <div role="radiogroup" aria-label="Headline options" className="flex flex-col gap-1.5">
        {headlines.map((h) => (
          <button
            key={h}
            type="button"
            role="radio"
            aria-checked={h === text}
            onClick={() => update(P, { text: h })}
            className="cursor-pointer rounded-lg border border-line bg-raise px-3 py-2 text-left text-[13px] leading-snug hover:border-muted aria-checked:border-accent aria-checked:ring-1 aria-checked:ring-accent"
          >
            {h.replace(/\*/g, "")}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Photos found for the story; tap one to put it in the photo box at `path`. */
export function FoundPhotos({ path }: { path: SlotPath }) {
  const found = useEditor((s) => s.posts.news.found);
  const update = useEditor((s) => s.update);
  const showToast = useEditor((s) => s.showToast);
  const [busy, setBusy] = useState<string | null>(null);
  if (!found?.length) return null;
  const use = async (url: string) => {
    setBusy(url);
    const src = await loadFound(url);
    setBusy(null);
    if (!src) return showToast("That photo couldn't be loaded. Try another.");
    update(path, { src, zoom: NEWS_ZOOM, ox: 0, oy: -1 } satisfies Partial<ImageSlot>);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold">Photos from the story</span>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {found.map((f) => (
          <button
            key={f.url}
            type="button"
            title={`From ${f.from}`}
            aria-label={`Use photo from ${f.from}`}
            disabled={!!busy}
            onClick={() => use(f.url)}
            className="relative h-20 w-16 flex-none cursor-pointer overflow-hidden rounded-md border border-line bg-raise disabled:opacity-60"
          >
            <RemoteImg src={f.url} className="size-full object-cover" />
            {busy === f.url && <span className="absolute inset-0 grid place-items-center bg-black/60 text-[11px] font-semibold text-white">…</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
