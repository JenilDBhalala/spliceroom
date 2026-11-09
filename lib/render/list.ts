import type { ListPost, Region, RenderState, Slide } from "@/types/post";
import {
  type Ctx, accentOf, anton, blockH, drawContain, drawCover, drawLines, fadeBottom, fitStyled, leadOf, fitText, fontFace, imageOf, linesBox,
  montserrat, movable, rrect, shadowOff, shadowOn, swipeTag, toks, uploaded, lookOf, archivo, textBox, tintOf,
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
  const meta = it.meta?.trim() ?? "";
  // A meta line under the title lifts the title to make room.
  const cy = (it.showRating ? H - 250 : H - 200) - (meta ? 46 : 0);
  let titleBottom = cy;
  const logo = uploaded(it.logo);
  if (logo) {
    const sc = Math.min(640 / logo.naturalWidth, 230 / logo.naturalHeight);
    const [w, h] = [logo.naturalWidth * sc, logo.naturalHeight * sc];
    movable(ctx, "title", { x: W / 2 - w / 2, y: cy - h / 2, w, h }, () => {
      shadowOn(ctx, 24);
      drawContain(ctx, logo, W / 2, cy, 640, 230);
      shadowOff(ctx);
    });
    titleBottom = cy + h / 2;
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
    titleBottom = top + blockH(fit.lines.length, fit.size, lh);
  }
  if (meta) {
    ctx.font = archivo(500, 34);
    ctx.textAlign = "center";
    const y = titleBottom + 52;
    const color = tintOf("meta", "rgba(255,255,255,.82)");
    movable(ctx, "meta", textBox(ctx, meta, W / 2, y, 34), () => {
      ctx.font = archivo(500, 34);
      ctx.textAlign = "center";
      shadowOn(ctx, 12);
      ctx.fillStyle = color;
      ctx.fillText(meta, W / 2, y);
      shadowOff(ctx);
    });
  }
  if (it.showRating && it.rating.trim()) rating(ctx, posts.list.ratingKind ?? "imdb", it.rating.trim(), W / 2, H - 100);
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "list", "items", i, "img"] }];
}

/** A movie's rating centered on cx, its top at y: IMDb badge, tomato score, stars, or the text as typed. */
function rating(ctx: Ctx, kind: NonNullable<ListPost["ratingKind"]>, value: string, cx: number, y: number) {
  const bh = 64;
  if (kind === "imdb") {
    ctx.font = montserrat(900, 56);
    const bw = 124;
    const total = bw + 22 + ctx.measureText(value).width;
    const x0 = cx - total / 2;
    movable(ctx, "rating", { x: x0, y, w: total, h: bh }, () => {
      ctx.fillStyle = "#F5C518";
      rrect(ctx, x0, y, bw, bh, 8);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = anton(46);
      ctx.textAlign = "center";
      ctx.fillText("IMDb", x0 + bw / 2, y + 51);
      ctx.fillStyle = "#fff";
      ctx.font = montserrat(900, 56);
      ctx.textAlign = "left";
      ctx.fillText(value, x0 + bw + 22, y + 54);
    });
    return;
  }
  if (kind === "stars") {
    // Out of 5; a score above 5 counts as out of 10.
    const n = parseFloat(value.replace(",", "."));
    const of5 = Number.isFinite(n) ? Math.max(0, Math.min(5, n > 5 ? n / 2 : n)) : 0;
    const size = 64;
    const gap = 10;
    const total = size * 5 + gap * 4;
    const x0 = cx - total / 2;
    movable(ctx, "rating", { x: x0, y, w: total, h: size }, () => {
      shadowOn(ctx, 12);
      for (let k = 0; k < 5; k++) {
        const sx = x0 + k * (size + gap) + size / 2;
        const sy = y + size / 2;
        star(ctx, sx, sy, size / 2, "rgba(255,255,255,.28)");
        const fill = Math.max(0, Math.min(1, of5 - k));
        if (fill > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(sx - size / 2, sy - size / 2, size * fill, size);
          ctx.clip();
          star(ctx, sx, sy, size / 2, "#F5C518");
          ctx.restore();
        }
      }
      shadowOff(ctx);
    });
    return;
  }
  const text = kind === "tomato" ? `🍅 ${/%$/.test(value) ? value : `${value}%`}` : value;
  ctx.font = montserrat(900, 56);
  ctx.textAlign = "center";
  const color = tintOf("rating", "#ffffff");
  movable(ctx, "rating", textBox(ctx, text, cx, y + 54, 56), () => {
    ctx.font = montserrat(900, 56);
    ctx.textAlign = "center";
    shadowOn(ctx, 14);
    ctx.fillStyle = color;
    ctx.fillText(text, cx, y + 54);
    shadowOff(ctx);
  });
}

/** A five-point star of outer radius r. */
function star(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
