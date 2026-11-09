import type { Extras, FormatId, Posts, Region, RenderState, Slide, SlideKind, SlotPath } from "@/types/post";
import { type Ctx, beginMoves, endMoves } from "./helpers";
import { hlClean, hlCover } from "./headline";
import { listCover, listItem } from "./list";
import { newsCover, newsStory } from "./news";
import { lessonItem, lessonsCover } from "./lessons";
import { timeline } from "./timeline";
import { poster } from "./poster";
import { meme, watermark } from "./meme";
import { tweet } from "./tweet";
import { quote } from "./quote";
import { compare } from "./compare";
import { follow } from "./follow";
import { custom, drawLayers } from "./custom";
import { scene } from "./scene";

export { W, FRAMES } from "./helpers";

type Renderer = (ctx: Ctx, state: RenderState, slide: Slide) => Region[];

const RENDERERS: Record<SlideKind, Renderer> = {
  custom,
  hlCover, hlClean, listCover, listItem, newsCover, newsStory, lessonsCover, lessonItem, timeline, poster, meme, tweet, quote, compare,
  follow, scene,
};

/** The post whose text moves each slide kind uses (the blank canvas has layers instead). */
export const POST_OF: Record<Exclude<SlideKind, "custom">, Exclude<keyof Posts, "custom">> = {
  hlCover: "headline", hlClean: "headline", listCover: "list", listItem: "list", newsCover: "news", newsStory: "news",
  lessonsCover: "lessons", lessonItem: "lessons", timeline: "timeline", poster: "poster", meme: "meme", tweet: "tweet",
  quote: "quote", compare: "compare", follow: "follow", scene: "scene",
};

/** Slides with a "Swipe" tag or years in the bottom-right corner put the page name bottom-left instead. */
const WATERMARK_LEFT = new Set<SlideKind>(["listCover", "newsCover", "lessonsCover", "timeline"]);

/** Single-slide templates: slide kind and strip label. */
const SINGLE: Partial<Record<FormatId, Pick<Slide, "kind" | "label">>> = {
  custom: { kind: "custom", label: "Canvas" },
  timeline: { kind: "timeline", label: "Timeline" },
  poster: { kind: "poster", label: "Poster" },
  meme: { kind: "meme", label: "Meme" },
  tweet: { kind: "tweet", label: "Post" },
  quote: { kind: "quote", label: "Quote" },
  compare: { kind: "compare", label: "Comparison" },
  scene: { kind: "scene", label: "Scene" },
};

export function slidesFor(fmt: FormatId, posts: Posts): Slide[] {
  // Added layers stay with their slide: carousel items by id, so they follow the item when it's reordered.
  const post = fmt as keyof Posts;
  const one = (kind: SlideKind, label: string, key: string = kind, i?: number): Slide => ({ kind, label, i, own: { post, key } });
  if (fmt === "headline") return [one("hlCover", "Cover"), ...(posts.headline.clean ? [one("hlClean", "Photo")] : [])];
  if (fmt === "list") {
    const p = posts.list;
    return [
      one("listCover", "Cover"),
      ...p.items.map((it, i) => one("listItem", it.title || `Movie ${i + 1}`, `listItem:${it.id}`, i)),
      ...(p.follow ? [one("follow", "Follow")] : []),
    ];
  }
  if (fmt === "news") {
    const p = posts.news;
    return [
      one("newsCover", "Cover"),
      ...p.stories.map((st, i) => one("newsStory", `Story ${i + 1}`, `newsStory:${st.id}`, i)),
      ...(p.follow ? [one("follow", "Follow")] : []),
    ];
  }
  if (fmt === "lessons") {
    const p = posts.lessons;
    return [
      one("lessonsCover", "Cover"),
      ...p.lessons.map((ls, i) => one("lessonItem", ls.title || `Lesson ${i + 1}`, `lessonItem:${ls.id}`, i)),
      ...(p.follow ? [one("follow", "Follow")] : []),
    ];
  }
  const single = SINGLE[fmt];
  if (single) return [one(single.kind, single.label)];
  return [one("follow", "Follow card")];
}

/** Path to the array holding a slide's own layers. */
export const layersPath = (slide: Slide): SlotPath =>
  slide.kind === "custom" ? ["posts", "custom", "layers"] : ["posts", slide.own.post, "extras", slide.own.key];

/**
 * Draws one slide and returns its draggable regions (in layout units, 1080 wide): photos, then text blocks, then added layers.
 * `scale` maps the layout onto the canvas: a 2160px-wide canvas uses 2,
 * so text and shapes are drawn at full resolution instead of being stretched.
 */
export function renderSlide(ctx: Ctx, state: RenderState, slide: Slide, scale = 1): Region[] {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, state.frame.W, state.frame.H);
  ctx.textBaseline = "alphabetic";
  let regs: Region[] = [];
  let added: Region[] = [];
  if (slide.kind !== "custom") {
    const post = POST_OF[slide.kind];
    beginMoves(state.posts[post].moves, state.posts[post].looks, ["posts", post, "moves"], slide.kind, state.frame);
  }
  try {
    regs = RENDERERS[slide.kind](ctx, state, slide) || [];
    // The follow card is the profile itself, and lesson slides already show the page name in their footer.
    const post = slide.kind === "custom" ? "custom" : POST_OF[slide.kind];
    if ((state.posts[post] as { watermark?: boolean }).watermark && slide.kind !== "follow" && slide.kind !== "lessonItem") {
      watermark(ctx, state.brand, state.frame, WATERMARK_LEFT.has(slide.kind) ? "left" : "right");
    }
    if (slide.kind !== "custom") {
      const extras = (state.posts[slide.own.post] as { extras?: Extras }).extras?.[slide.own.key] ?? [];
      added = drawLayers(ctx, extras, state.brand, state.frame, layersPath(slide));
    }
  } catch (e) {
    console.error(e);
  }
  const text = endMoves();
  ctx.restore();
  // Added layers last: they're drawn on top, so they win a tap.
  return [...regs, ...text, ...added];
}
