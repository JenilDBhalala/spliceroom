import type { Framing, ImageSlot } from "@/types/post";
import { imageFor } from "@/lib/images";
import { F } from "./fonts";
import { placeholderImage } from "./placeholder";

export const W = 1080;
export const H = 1350;

export type Ctx = CanvasRenderingContext2D;
export type Drawable = HTMLImageElement | HTMLCanvasElement;

export const montserrat = (weight: number, size: number) => `${weight} ${size}px ${F.montserrat}, Arial Black, sans-serif`;
export const archivo = (weight: number, size: number) => `${weight} ${size}px ${F.archivo}, Arial, sans-serif`;
export const anton = (size: number) => `400 ${size}px ${F.anton}, Impact, sans-serif`;
export const bebas = (size: number) => `400 ${size}px ${F.bebas}, Impact, sans-serif`;
export const cinzel = (size: number) => `700 ${size}px ${F.cinzel}, Georgia, serif`;

/** The slot's uploaded image, else its placeholder still, else nothing. */
export function imageOf(s: ImageSlot): Drawable | null {
  return imageFor(s.src) ?? (s.ph ? placeholderImage(s.ph) : null);
}

/** Only the uploaded image (title logos and brand marks have no placeholder). */
export const uploaded = (s: ImageSlot) => imageFor(s.src);

const dims = (im: Drawable) => [
  (im as HTMLImageElement).naturalWidth || im.width,
  (im as HTMLImageElement).naturalHeight || im.height,
];

/** How far the scaled image overflows a w×h box, for drag math. */
export function overflow(im: Drawable, f: Framing, w: number, h: number) {
  const [iw, ih] = dims(im);
  const sc = Math.max(w / iw, h / ih) * f.zoom;
  return [iw * sc - w, ih * sc - h];
}

export function drawCover(ctx: Ctx, im: Drawable | null, f: Framing, x: number, y: number, w: number, h: number) {
  if (!im) return;
  const [iw, ih] = dims(im);
  const sc = Math.max(w / iw, h / ih) * f.zoom;
  const dw = iw * sc;
  const dh = ih * sc;
  const ex = dw - w;
  const ey = dh - h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(im, x - (ex * (f.ox + 1)) / 2, y - (ey * (f.oy + 1)) / 2, dw, dh);
  ctx.restore();
}

export function drawContain(ctx: Ctx, im: Drawable, cx: number, cy: number, mw: number, mh: number) {
  const [iw, ih] = dims(im);
  const sc = Math.min(mw / iw, mh / ih);
  const w = iw * sc;
  const h = ih * sc;
  ctx.drawImage(im, cx - w / 2, cy - h / 2, w, h);
  return { w, h };
}

export function fadeBottom(ctx: Ctx, y0: number, y1: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.45, "rgba(0,0,0,.55)");
  g.addColorStop(0.8, "rgba(0,0,0,.92)");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, y1 - y0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, y1, W, H - y1);
}

export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Canvas shadows ignore the transform, so blur and offset are scaled by hand. */
export function setShadow(ctx: Ctx, color: string, blur: number, offsetY: number) {
  const k = ctx.getTransform().a;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * k;
  ctx.shadowOffsetY = offsetY * k;
}

export function shadowOn(ctx: Ctx, b = 14) {
  setShadow(ctx, "rgba(0,0,0,.55)", b, 2);
}

export function shadowOff(ctx: Ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/* ---------- rich text: *stars* mark highlighted words, \n forces a break ---------- */

/** `join`: no space before this word (text touching a *starred* part, e.g. the quote in `*word*"`). */
export type Token = { br: true } | { br?: false; t: string; em: boolean; join?: boolean };
export interface Word {
  t: string;
  em: boolean;
  w: number;
  join?: boolean;
}
export interface Line {
  w: number;
  words: Word[];
}
export interface Wrapped {
  lines: Line[];
  sp: number;
  over: boolean;
  size: number;
}

export function toks(text: string, upper = true): Token[] {
  const out: Token[] = [];
  (text || "").split("\n").forEach((line, li) => {
    if (li) out.push({ br: true });
    let glued = false; // previous part ended without whitespace
    line.split(/(\*[^*]+\*)/).forEach((part) => {
      if (!part) return;
      const em = /^\*[^*]+\*$/.test(part);
      const s = em ? part.slice(1, -1) : part;
      const startsTight = !/^\s/.test(s);
      s.split(/\s+/)
        .filter(Boolean)
        .forEach((t, k) => out.push({ t: upper ? t.toUpperCase() : t, em, ...(k === 0 && glued && startsTight ? { join: true } : {}) }));
      glued = !/\s$/.test(s) && s.trim() !== "";
    });
  });
  return out;
}

export function wrap(ctx: Ctx, tk: Token[], maxW: number): Wrapped {
  const sp = ctx.measureText(" ").width;
  const lines: Line[] = [{ w: 0, words: [] }];
  let over = false;
  for (const t of tk) {
    if (t.br) {
      lines.push({ w: 0, words: [] });
      continue;
    }
    const w = ctx.measureText(t.t).width;
    if (w > maxW) over = true;
    let L = lines[lines.length - 1];
    // Joined words stay on the previous word's line.
    if (L.words.length && !t.join && L.w + sp + w > maxW) {
      L = { w: 0, words: [] };
      lines.push(L);
    }
    L.w += (L.words.length && !t.join ? sp : 0) + w;
    L.words.push({ t: t.t, em: t.em, w, join: t.join });
  }
  return { lines: lines.filter((l) => l.words.length), sp, over, size: 0 };
}

export const blockH = (n: number, size: number, lh: number) => size * (0.74 + (n - 1) * lh);

/** Largest size (stepping down by 2) whose wrapped block fits maxW × maxH. */
export function fitText(
  ctx: Ctx,
  tk: Token[],
  fontFn: (s: number) => string,
  maxW: number,
  maxH: number,
  lh: number,
  maxS: number,
  minS = 20,
): Wrapped {
  let res!: Wrapped;
  for (let s = maxS; s >= minS; s -= 2) {
    ctx.font = fontFn(s);
    res = wrap(ctx, tk, maxW);
    res.size = s;
    if (!res.over && blockH(res.lines.length, s, lh) <= maxH) return res;
  }
  return res;
}

/** Draws wrapped lines centered on `x`, or starting at `x` when align is "left". */
export function drawLines(
  ctx: Ctx,
  res: Wrapped,
  x0: number,
  top: number,
  lh: number,
  color: string,
  emColor: string,
  align: "center" | "left" = "center",
) {
  res.lines.forEach((L, i) => {
    let x = align === "left" ? x0 : x0 - L.w / 2;
    const y = top + res.size * 0.74 + i * res.size * lh;
    L.words.forEach((wd, k) => {
      if (k && !wd.join) x += res.sp;
      ctx.fillStyle = wd.em ? emColor : color;
      ctx.textAlign = "left";
      ctx.fillText(wd.t, x, y);
      x += wd.w;
    });
  });
}

export function swipeTag(ctx: Ctx, accent: string, text: string, x: number, y: number) {
  ctx.font = montserrat(900, 34);
  ctx.textAlign = "right";
  ctx.fillStyle = accent;
  ctx.fillText(text, x, y);
}
