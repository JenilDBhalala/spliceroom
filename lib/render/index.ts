import type { FormatId, Posts, Region, RenderState, Slide, SlideKind } from "@/types/post";
import type { Ctx } from "./helpers";
import { hlClean, hlCover } from "./headline";
import { listCover, listItem } from "./list";
import { newsCover, newsStory } from "./news";
import { lessonItem, lessonsCover } from "./lessons";
import { timeline } from "./timeline";
import { follow } from "./follow";

export { W, H } from "./helpers";

type Renderer = (ctx: Ctx, state: RenderState, slide: Slide) => Region[];

const RENDERERS: Record<SlideKind, Renderer> = {
  hlCover, hlClean, listCover, listItem, newsCover, newsStory, lessonsCover, lessonItem, timeline, follow,
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
  if (fmt === "timeline") return [{ kind: "timeline", label: "Timeline" }];
  return [{ kind: "follow", label: "Follow card" }];
}

/**
 * Draws one slide and returns its draggable photo regions (in 1080×1350 units).
 * `scale` maps the 1080×1350 layout onto the canvas: a 2160px-wide canvas uses 2,
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
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.textBaseline = "alphabetic";
  let regs: Region[] = [];
  try {
    regs = RENDERERS[slide.kind](ctx, state, slide) || [];
  } catch (e) {
    console.error(e);
  }
  ctx.restore();
  return regs;
}
