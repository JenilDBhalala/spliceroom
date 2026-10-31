import type { Region, RenderState, Slide } from "@/types/post";
import {
  type Ctx, accentOf, anton, blockH, drawContain, drawCover, drawLines, fadeBottom, fitStyled, fitText, fontFace, imageOf, montserrat, rrect,
  shadowOff, shadowOn, swipeTag, toks, uploaded,
} from "./helpers";

export function listCover(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.list;
  const n = p.panelCount;
  const gap = 6;
  const top = H * 0.72;
  const pw = (W - gap * (n - 1)) / n;
  const regs: Region[] = [];
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) {
    const x = i * (pw + gap);
    drawCover(ctx, imageOf(p.panels[i]), p.panels[i], x, 0, pw, top);
    regs.push({ x, y: 0, w: pw, h: top, path: ["posts", "list", "panels", i] });
  }
  fadeBottom(ctx, frame, top - 260, top);
  const accent = accentOf(brand, p.style);
  const lh = 1.0;
  ctx.save();
  const fit = fitStyled(ctx, p.text, p.style, W - 110, H * 0.36, lh, 150, 40);
  const bottom = H - 120;
  const bh = blockH(fit.lines.length, fit.size, lh);
  drawLines(ctx, fit, W / 2, bottom - bh, lh, p.style.color, accent);
  ctx.restore();
  if (p.swipe) swipeTag(ctx, accent, "SWIPE", W - 70, H - 50);
  return regs;
}

export function listItem(ctx: Ctx, { brand, posts, frame }: RenderState, sl: Slide): Region[] {
  const { W, H } = frame;
  const i = sl.i!;
  const it = posts.list.items[i];
  drawCover(ctx, imageOf(it.img), it.img, 0, 0, W, H);
  fadeBottom(ctx, frame, H * 0.6, H * 0.78);
  const cy = it.showRating ? H - 250 : H - 200;
  const logo = uploaded(it.logo);
  if (logo) {
    shadowOn(ctx, 24);
    drawContain(ctx, logo, W / 2, cy, 640, 230);
    shadowOff(ctx);
  } else {
    const cinzel = it.font === "Cinzel";
    const font = (s: number) => fontFace(it.font, s);
    const lh = 0.98;
    const fit = fitText(ctx, toks(it.title, cinzel), font, 760, 230, lh, cinzel ? 120 : 150, 30);
    ctx.save();
    if (cinzel) ctx.letterSpacing = "10px";
    drawLines(ctx, fit, W / 2, cy - blockH(fit.lines.length, fit.size, lh) / 2, lh, it.color, accentOf(brand, posts.list.style));
    ctx.restore();
  }
  if (it.showRating && it.rating) {
    ctx.font = montserrat(900, 56);
    const rw = ctx.measureText(it.rating).width;
    const bw = 124;
    const bh = 64;
    const total = bw + 22 + rw;
    const x0 = W / 2 - total / 2;
    const by = H - 100;
    ctx.fillStyle = "#F5C518";
    rrect(ctx, x0, by, bw, bh, 8);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = anton(46);
    ctx.textAlign = "center";
    ctx.fillText("IMDb", x0 + bw / 2, by + 51);
    ctx.fillStyle = "#fff";
    ctx.font = montserrat(900, 56);
    ctx.textAlign = "left";
    ctx.fillText(it.rating, x0 + bw + 22, by + 54);
  }
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "list", "items", i, "img"] }];
}
