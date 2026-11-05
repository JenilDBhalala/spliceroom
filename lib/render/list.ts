import type { Region, RenderState, Slide } from "@/types/post";
import {
  type Ctx, accentOf, anton, blockH, drawContain, drawCover, drawLines, fadeBottom, fitStyled, leadOf, fitText, fontFace, imageOf, linesBox,
  montserrat, movable, rrect, shadowOff, shadowOn, swipeTag, toks, uploaded, lookOf,
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
  const lh = leadOf(p.style, 1.0);
  ctx.save();
  const st = lookOf("text", p.style);
  const fit = fitStyled(ctx, p.text, st, W - 110, H * 0.36, lh, 150, 40);
  const bottom = H - 120;
  const bh = blockH(fit.lines.length, fit.size, lh);
  movable(ctx, "text", linesBox(fit, W / 2, bottom - bh, lh), () => drawLines(ctx, fit, W / 2, bottom - bh, lh, st.color, accentOf(brand, st)));
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
    const sc = Math.min(640 / logo.naturalWidth, 230 / logo.naturalHeight);
    const [w, h] = [logo.naturalWidth * sc, logo.naturalHeight * sc];
    movable(ctx, "title", { x: W / 2 - w / 2, y: cy - h / 2, w, h }, () => {
      shadowOn(ctx, 24);
      drawContain(ctx, logo, W / 2, cy, 640, 230);
      shadowOff(ctx);
    });
  } else {
    const cinzel = it.font === "Cinzel";
    const font = (s: number) => fontFace(it.font, s);
    const lh = 0.98;
    const fit = fitText(ctx, toks(it.title, cinzel), font, 760, 230, lh, cinzel ? 120 : 150, 30);
    ctx.save();
    if (cinzel) ctx.letterSpacing = "10px";
    const top = cy - blockH(fit.lines.length, fit.size, lh) / 2;
    movable(ctx, "title", linesBox(fit, W / 2, top, lh), () => drawLines(ctx, fit, W / 2, top, lh, it.color, accentOf(brand, posts.list.style)));
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
    movable(ctx, "rating", { x: x0, y: by, w: total, h: bh }, () => {
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
    });
  }
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "list", "items", i, "img"] }];
}
