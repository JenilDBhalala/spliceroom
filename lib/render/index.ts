import type { FormatId, Posts, Region, RenderState, Slide, SlideKind } from "@/types/post";
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
import { custom } from "./custom";

export { W, FRAMES } from "./helpers";

type Renderer = (ctx: Ctx, state: RenderState, slide: Slide) => Region[];

const RENDERERS: Record<SlideKind, Renderer> = {
  custom,
  hlCover, hlClean, listCover, listItem, newsCover, newsStory, lessonsCover, lessonItem, timeline, poster, meme, tweet, quote, compare,
  follow,
};

/** The post whose text moves each slide kind uses (the blank canvas has layers instead). */
export const POST_OF: Record<Exclude<SlideKind, "custom">, Exclude<keyof Posts, "custom">> = {
  hlCover: "headline", hlClean: "headline", listCover: "list", listItem: "list", newsCover: "news", newsStory: "news",
  lessonsCover: "lessons", lessonItem: "lessons", timeline: "timeline", poster: "poster", meme: "meme", tweet: "tweet",
  quote: "quote", compare: "compare", follow: "follow",
};

/** Slides with a "Swipe" tag or years in the bottom-right corner put the page name bottom-left instead. */
const WATERMARK_LEFT = new Set<SlideKind>(["listCover", "newsCover", "lessonsCover", "timeline"]);

/** Single-slide templates: slide kind and strip label. */
const SINGLE: Partial<Record<FormatId, Slide>> = {
  custom: { kind: "custom", label: "Canvas" },
  timeline: { kind: "timeline", label: "Timeline" },
  poster: { kind: "poster", label: "Poster" },
  meme: { kind: "meme", label: "Meme" },
  tweet: { kind: "tweet", label: "Post" },
  quote: { kind: "quote", label: "Quote" },
  compare: { kind: "compare", label: "Comparison" },
};

export function slidesFor(fmt: FormatId, posts: Posts): Slide[] {
  if (fmt === "headline") {
    return [{ kind: "hlCover", label: "Cover" }, ...(posts.headline.clean ? [{ kind: "hlClean", label: "Photo" } as Slide] : [])];
  }
  if (fmt === "list") {
    const p = posts.list;
    return [
      { kind: "listCover", label: "Cover" },
      ...p.items.map((it, i): Slide => ({ kind: "listItem", i, label: it.title || `Movie ${i + 1}` })),
      ...(p.follow ? [{ kind: "follow", label: "Follow" } as Slide] : []),
    ];
  }
  if (fmt === "news") {
    const p = posts.news;
    return [
      { kind: "newsCover", label: "Cover" },
      ...p.stories.map((_, i): Slide => ({ kind: "newsStory", i, label: `Story ${i + 1}` })),
      ...(p.follow ? [{ kind: "follow", label: "Follow" } as Slide] : []),
    ];
  }
  if (fmt === "lessons") {
    const p = posts.lessons;
    return [
      { kind: "lessonsCover", label: "Cover" },
      ...p.lessons.map((ls, i): Slide => ({ kind: "lessonItem", i, label: ls.title || `Lesson ${i + 1}` })),
      ...(p.follow ? [{ kind: "follow", label: "Follow" } as Slide] : []),
    ];
  }
  const single = SINGLE[fmt];
  if (single) return [single];
  return [{ kind: "follow", label: "Follow card" }];
}

/**
 * Draws one slide and returns its draggable regions (in layout units, 1080 wide): photos, then text blocks.
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
  } catch (e) {
    console.error(e);
  }
  const text = endMoves();
  ctx.restore();
  return [...regs, ...text];
}
