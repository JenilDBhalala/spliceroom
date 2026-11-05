import type { Brand, Frame, Region, RenderState } from "@/types/post";
import {
  type Ctx, type Wrapped, accentOf, archivo, blockH, drawCover, drawLines, fitStyled, leadOf, imageOf, linesBox, lookOf, movable, shadowOff, shadowOn, textBox,
  tintOf, uploaded,
} from "./helpers";

export function meme(ctx: Ctx, state: RenderState): Region[] {
  return state.posts.meme.mode === "caption" ? captionMeme(ctx, state) : classicMeme(ctx, state);
}

/** Impact-style text with a black outline, top and bottom of the photo. */
function classicMeme(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.meme;
  drawCover(ctx, imageOf(p.img), p.img, 0, 0, W, H);
  const lh = leadOf(p.style, 1.02);
  const maxH = H * 0.27;
  if (p.top.trim()) {
    ctx.save();
    const st = lookOf("top", p.style);
    const fit = fitStyled(ctx, p.top, st, W - 80, maxH, lh, 120, 36);
    movable(ctx, "top", linesBox(fit, W / 2, 46, lh), () => drawOutlined(ctx, fit, W / 2, 46, lh, st.color, accentOf(brand, st)));
    ctx.restore();
  }
  if (p.bottom.trim()) {
    ctx.save();
    const st = lookOf("bottom", p.style);
    const fit = fitStyled(ctx, p.bottom, st, W - 80, maxH, lh, 120, 36);
    const top = H - 46 - blockH(fit.lines.length, fit.size, lh);
    movable(ctx, "bottom", linesBox(fit, W / 2, top, lh), () => drawOutlined(ctx, fit, W / 2, top, lh, st.color, accentOf(brand, st)));
    ctx.restore();
  }
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "meme", "img"] }];
}

/** White caption bar sized to the text, photo filling the rest. */
function captionMeme(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.meme;
  const padX = 60;
  const padY = 54;
  const lh = leadOf(p.style, 1.22);
  ctx.save();
  const st = lookOf("caption", p.style);
  const fit = fitStyled(ctx, p.caption, st, W - padX * 2, H * 0.45, lh, 64, 30);
  const barH = p.caption.trim() ? blockH(fit.lines.length, fit.size, lh) + padY * 2 : 0;
  ctx.fillStyle = p.bar === "dark" ? "#000" : "#fff";
  ctx.fillRect(0, 0, W, barH);
  if (barH) movable(ctx, "caption", linesBox(fit, padX, padY, lh, "left"), () => drawLines(ctx, fit, padX, padY, lh, st.color, accentOf(brand, st), "left"));
  ctx.restore();
  drawCover(ctx, imageOf(p.img), p.img, 0, barH, W, H - barH);
  return [{ x: 0, y: barH, w: W, h: H - barH, path: ["posts", "meme", "img"] }];
}

function drawOutlined(ctx: Ctx, res: Wrapped, cx: number, top: number, lh: number, color: string, emColor: string) {
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = "#000";
  ctx.lineWidth = Math.max(4, res.size * 0.13);
  res.lines.forEach((L, i) => {
    let x = cx - L.w / 2;
    const y = top + res.size * 0.74 + i * res.size * lh;
    L.words.forEach((wd, k) => {
      if (k && !wd.join) x += res.sp;
      ctx.textAlign = "left";
      ctx.strokeText(wd.t, x, y);
      ctx.fillStyle = wd.em ? emColor : color;
      ctx.fillText(wd.t, x, y);
      x += wd.w;
    });
  });
}

/** Small page handle in a bottom corner (drag it anywhere). */
export function watermark(ctx: Ctx, brand: Brand, { W, H }: Frame, corner: "left" | "right" = "right") {
  const logo = uploaded(brand.logo);
  const as = brand.markAs ?? (logo ? "logo" : "handle");
  const x = corner === "right" ? W - 28 : 28;
  if (as === "logo" && logo) {
    const sc = Math.min(220 / logo.naturalWidth, 56 / logo.naturalHeight);
    const [w, h] = [logo.naturalWidth * sc, logo.naturalHeight * sc];
    const left = corner === "right" ? x - w : x;
    movable(ctx, "watermark", { x: left, y: H - 24 - h, w, h }, () => {
      shadowOn(ctx, 8);
      ctx.drawImage(logo, left, H - 24 - h, w, h);
      shadowOff(ctx);
    });
    return;
  }
  if (!brand.name) return;
  const text = as === "name" ? brand.name : `@${brand.name}`;
  ctx.font = archivo(600, 28);
  ctx.textAlign = corner;
  const color = tintOf("watermark", "rgba(255,255,255,.75)");
  movable(ctx, "watermark", textBox(ctx, text, x, H - 28, 28), () => {
    ctx.fillStyle = color;
    shadowOn(ctx, 8);
    ctx.fillText(text, x, H - 28);
    shadowOff(ctx);
  });
}
