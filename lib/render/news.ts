import type { Region, RenderState, Slide } from "@/types/post";
import {
  H, W, type Ctx, type Wrapped, blockH, drawCover, drawLines, fadeBottom, imageOf, montserrat, shadowOff, shadowOn, swipeTag, toks, wrap,
} from "./helpers";

export function newsCover(ctx: Ctx, { brand, posts }: RenderState): Region[] {
  const p = posts.news;
  const regs: Region[] = [{ x: 0, y: 0, w: W, h: H, path: ["posts", "news", "img"] }];
  drawCover(ctx, imageOf(p.img), p.img, 0, 0, W, H);
  fadeBottom(ctx, H * 0.52, H * 0.8);
  if (p.insetOn) {
    const cx = 220;
    const cy = 220;
    const r = 165;
    ctx.save();
    shadowOn(ctx, 30);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
    ctx.fill();
    shadowOff(ctx);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, imageOf(p.inset), p.inset, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    regs.push({ x: cx - r, y: cy - r, w: r * 2, h: r * 2, path: ["posts", "news", "inset"] });
  }
  // each line is sized to fill the full width
  let lines = (p.text || "")
    .toUpperCase()
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 1 && lines[0].length > 16) {
    const words = lines[0].split(/\s+/);
    lines = [];
    let cur = "";
    words.forEach((w) => {
      if (cur && (cur + " " + w).length > 15) {
        lines.push(cur);
        cur = w;
      } else cur = cur ? cur + " " + w : w;
    });
    if (cur) lines.push(cur);
  }
  const maxW = W - 150;
  const gap = 16;
  ctx.font = montserrat(900, 100);
  let sizes = lines.map((l) => Math.min(210, (100 * maxW) / Math.max(1, ctx.measureText(l).width)));
  let total = sizes.reduce((a, s) => a + s * 0.73, 0) + gap * (lines.length - 1);
  const maxH = H * 0.4;
  if (total > maxH) {
    const f = (maxH - gap * (lines.length - 1)) / (total - gap * (lines.length - 1));
    sizes = sizes.map((s) => s * f);
    total = maxH;
  }
  let y = H - 105 - total;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  lines.forEach((l, i) => {
    ctx.font = montserrat(900, sizes[i]);
    y += sizes[i] * 0.73;
    ctx.fillText(l, W / 2, y);
    y += gap;
  });
  if (p.swipe) swipeTag(ctx, brand.accent, "SWIPE", W - 70, H - 42);
  return regs;
}

export function newsStory(ctx: Ctx, { brand, posts }: RenderState, sl: Slide): Region[] {
  const i = sl.i!;
  const st = posts.news.stories[i];
  drawCover(ctx, imageOf(st.img), st.img, 0, 0, W, H * 0.74);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, H * 0.74, W, H);
  fadeBottom(ctx, H * 0.56, H * 0.72);
  const paras = (st.text || "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lh = 1.13;
  const maxW = W - 130;
  const maxH = H * 0.25;
  let fits: Wrapped[] = [];
  let size: number;
  const totalH = () => fits.reduce((a, f) => a + blockH(f.lines.length, size, lh), 0) + size * 0.95 * (fits.length - 1);
  for (size = 56; size >= 22; size -= 2) {
    ctx.font = montserrat(800, size);
    fits = paras.map((pp) => {
      const r = wrap(ctx, toks(pp.replace(/\n/g, " ")), maxW);
      r.size = size;
      return r;
    });
    if (!fits.some((f) => f.over) && totalH() <= maxH) break;
  }
  // Like the reference, an overflowing text ends the loop one step below the minimum.
  let y = H * 0.735 + (maxH - totalH()) / 2 + 10;
  fits.forEach((f) => {
    drawLines(ctx, f, W / 2, y, lh, "#fff", brand.accent);
    y += blockH(f.lines.length, size, lh) + size * 0.95;
  });
  return [{ x: 0, y: 0, w: W, h: H * 0.74, path: ["posts", "news", "stories", i, "img"] }];
}
