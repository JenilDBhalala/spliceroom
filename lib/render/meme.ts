import type { Brand, Frame, Region, RenderState, TextStyle } from "@/types/post";
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
    const st = lookOf("top", p.style, true);
    const fit = fitStyled(ctx, p.top, st, W - 80, maxH, lh, 120, 36);
    movable(ctx, "top", linesBox(fit, W / 2, 46, lh), () => drawOutlined(ctx, fit, W / 2, 46, lh, st, accentOf(brand, st)));
    ctx.restore();
  }
  if (p.bottom.trim()) {
    ctx.save();
    const st = lookOf("bottom", p.style, true);
    const fit = fitStyled(ctx, p.bottom, st, W - 80, maxH, lh, 120, 36);
    const top = H - 46 - blockH(fit.lines.length, fit.size, lh);
    movable(ctx, "bottom", linesBox(fit, W / 2, top, lh), () => drawOutlined(ctx, fit, W / 2, top, lh, st, accentOf(brand, st)));
    ctx.restore();
  }
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "meme", "img"] }];
}

const PAD = { none: 0, small: 28, large: 64 } as const;

/** Caption bar sized to the text, above or below the photo; the photo fills the rest, optionally with space around it. */
function captionMeme(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.meme;
  const padX = 60;
  const padY = 54;
  const lh = leadOf(p.style, 1.22);
  const below = p.captionAt === "bottom";
  const m = PAD[p.pad ?? "none"];
  ctx.save();
  const st = lookOf("caption", p.style);
  const fit = fitStyled(ctx, p.caption, st, W - padX * 2, H * 0.45, lh, 64, 30);
  const barH = p.caption.trim() ? blockH(fit.lines.length, fit.size, lh) + padY * 2 : 0;
  ctx.fillStyle = barColorOf(p);
  ctx.fillRect(0, 0, W, H);
  const barY = below ? H - barH : 0;
  const textY = barY + padY - (below && m ? padY * 0.4 : 0);
  if (barH) movable(ctx, "caption", linesBox(fit, padX, textY, lh, "left"), () => drawLines(ctx, fit, padX, textY, lh, st.color, accentOf(brand, st), "left"));
  ctx.restore();
  // With space around the photo, the caption's own padding is the gap on its side.
  const photo = { x: m, y: below ? m : barH + (barH ? 0 : m), w: W - m * 2, h: H - barH - (barH ? m : m * 2) };
  drawCover(ctx, imageOf(p.img), p.img, photo.x, photo.y, photo.w, photo.h);
  return [{ ...photo, path: ["posts", "meme", "img"] }];
}

/** The caption bar's color, for drafts saved before any color could be picked. */
export const barColorOf = (p: { barColor?: string; bar: "light" | "dark" }) => p.barColor ?? (p.bar === "dark" ? "#000000" : "#ffffff");

/** Meme text: outlined unless the style picks another effect (which `movable` then draws). */
function drawOutlined(ctx: Ctx, res: Wrapped, cx: number, top: number, lh: number, st: TextStyle, emColor: string) {
  const outline = (st.effect ?? "outline") === "outline";
  const color = st.color;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = st.effectColor ?? "#000";
  ctx.lineWidth = Math.max(2, res.size * (st.stroke ?? 0.13));
  // Outlines first, then all the letters, so a thick outline never covers the word before it.
  const pass = (draw: (t: string, x: number, y: number, em: boolean) => void) =>
    res.lines.forEach((L, i) => {
      let x = cx - L.w / 2;
      const y = top + res.size * 0.74 + i * res.size * lh;
      L.words.forEach((wd, k) => {
        if (k && !wd.join) x += res.sp;
        draw(wd.t, x, y, !!wd.em);
        x += wd.w;
      });
    });
  ctx.textAlign = "left";
  if (outline) pass((t, x, y) => ctx.strokeText(t, x, y));
  pass((t, x, y, em) => {
    ctx.fillStyle = em ? emColor : color;
    ctx.fillText(t, x, y);
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
