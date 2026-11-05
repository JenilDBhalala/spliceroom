import type { Brand, Frame, Framing, ImageSlot, PhotoFx, PostSize, Region, SlotPath, TextBlock, TextLooks, TextMoves, TextStyle } from "@/types/post";
import { imageFor } from "@/lib/images";
import { F, fontFace } from "./fonts";
import { placeholderImage } from "./placeholder";

/** Slides are always laid out 1080 units wide; the height depends on the post size. */
export const W = 1080;
export const FRAMES: Record<PostSize, Frame> = {
  portrait: { W, H: 1350 },
  square: { W, H: 1080 },
  story: { W, H: 1920 },
};

export type Ctx = CanvasRenderingContext2D;
export type Drawable = HTMLImageElement | HTMLCanvasElement;

export const montserrat = (weight: number, size: number) => `${weight} ${size}px ${F.montserrat}, Arial Black, sans-serif`;
export const archivo = (weight: number, size: number) => `${weight} ${size}px ${F.archivo}, Arial, sans-serif`;
export const anton = (size: number) => `400 ${size}px ${F.anton}, Impact, sans-serif`;
export const bebas = (size: number) => `400 ${size}px ${F.bebas}, Impact, sans-serif`;
export const cinzel = (size: number) => `700 ${size}px ${F.cinzel}, Georgia, serif`;
export const playfair = (size: number) => `700 ${size}px ${F.playfair}, Georgia, serif`;

export { fontFace } from "./fonts";

/* ---------- movable text blocks ---------- */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Set by renderSlide around each slide: the user's moves and looks, and where to report text regions.
let moving: {
  moves: TextMoves;
  looks: TextLooks;
  path: SlotPath;
  prefix: string;
  frame: Frame;
  regions: Region[];
  /** What lookOf / tintOf said about each block, for its region. */
  blocks: Map<string, Pick<TextBlock, "look" | "base">>;
} | null = null;

export function beginMoves(moves: TextMoves | undefined, looks: TextLooks | undefined, path: SlotPath, prefix: string, frame: Frame) {
  moving = { moves: moves ?? {}, looks: looks ?? {}, path, prefix, frame, regions: [], blocks: new Map() };
}

/** The template's text style for one block, with that block's own look on top. Call before laying the block out. */
export function lookOf(key: string, base: TextStyle): TextStyle {
  if (!moving) return base;
  moving.blocks.set(key, { look: "style", base: { color: base.color, font: base.font, accent: base.accent, caps: base.caps } });
  const own = moving.looks[`${moving.prefix}.${key}`];
  return own ? { ...base, ...own } : base;
}

/** A fixed-style block's color, or the color the user picked for it. */
export function tintOf(key: string, color: string): string {
  if (!moving) return color;
  moving.blocks.set(key, { look: "color", base: { color } });
  return moving.looks[`${moving.prefix}.${key}`]?.color ?? color;
}

/** Text regions drawn since beginMoves. */
export function endMoves(): Region[] {
  const r = moving?.regions ?? [];
  moving = null;
  return r;
}

/**
 * Draws a template text block (laid out in `box`) shifted and scaled by the user's move for `key`,
 * and reports it as a draggable region. Keys are per slide kind, so moving a lesson's title moves it on every lesson.
 * Returns where a box inside the block ends up (for photo regions inside a moved card).
 */
export function movable(ctx: Ctx, key: string, box: Box, draw: () => void): (b: Box) => Box {
  if (!moving) {
    draw();
    return (b) => b;
  }
  const k = `${moving.prefix}.${key}`;
  const m = moving.moves[k];
  const opacity = moving.looks[k]?.opacity ?? 1;
  const { W, H } = moving.frame;
  const s = m?.s ?? 1;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const dx = (m?.dx ?? 0) * W;
  const dy = (m?.dy ?? 0) * H;
  ctx.save();
  if (m) {
    ctx.translate(cx + dx, cy + dy);
    if (m.r) ctx.rotate((m.r * Math.PI) / 180);
    ctx.scale(s, s);
    ctx.translate(-cx, -cy);
  }
  if (opacity < 1) ctx.globalAlpha *= opacity;
  draw();
  ctx.restore();
  // A little slack around the text makes it easier to grab.
  const pad = 16;
  const w = box.w * s + pad * 2;
  const h = box.h * s + pad * 2;
  const block = moving.blocks.get(key) ?? { look: "none", base: { color: "" } };
  moving.regions.push({ x: cx + dx - w / 2, y: cy + dy - h / 2, w, h, path: moving.path, text: { key: k, ...block, home: { cx: cx / W, cy: cy / H } } });
  return (b) => ({ x: cx + dx + (b.x - cx) * s, y: cy + dy + (b.y - cy) * s, w: b.w * s, h: b.h * s });
}

/** The box wrapped lines cover when drawn with drawLines at (x0, top). */
export function linesBox(res: Wrapped, x0: number, top: number, lh: number, align: "center" | "left" = "center"): Box {
  const w = Math.max(0, ...res.lines.map((L) => L.w));
  return { x: align === "left" ? x0 : x0 - w / 2, y: top, w, h: blockH(res.lines.length, res.size, lh) + res.size * 0.22 };
}

/** The box of one line of text drawn at baseline (x, y) with the current font and textAlign. */
export function textBox(ctx: Ctx, text: string, x: number, y: number, size: number): Box {
  const w = ctx.measureText(text).width;
  const a = ctx.textAlign;
  const x0 = a === "center" ? x - w / 2 : a === "right" || a === "end" ? x - w : x;
  return { x: x0, y: y - size * 0.8, w, h: size };
}

/* ---------- template text style ---------- */

export const accentOf = (brand: Brand, style: TextStyle) => style.accent ?? brand.accent;

/**
 * Fits `text` using the template style: its font, caps setting and size multiplier.
 * Cinzel gets letter spacing; call inside ctx.save()/restore() since it sets ctx.letterSpacing.
 */
export function fitStyled(ctx: Ctx, text: string, style: TextStyle, maxW: number, maxH: number, lh: number, maxS: number, minS = 20) {
  const base = style.font === "Cinzel" ? Math.round(maxS / 15) : 0;
  const tracking = style.tracking ?? 0;
  const k = style.scale || 1;
  // Letter spacing scales with the size being tried, so it's set alongside the font.
  const font = (s: number) => {
    ctx.letterSpacing = `${base + tracking * s}px`;
    return fontFace(style.font, s, style.weight);
  };
  return fitText(ctx, toks(text, style.caps), font, maxW, maxH, lh, Math.round(maxS * k), Math.round(minS * k));
}

/** A template's line height with the style's line-spacing multiplier applied. */
export const leadOf = (style: TextStyle, lh: number) => lh * (style.leading ?? 1);

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

/**
 * Applies a photo's adjustments for drawing it in the x/y/w/h box (call inside save/restore).
 * Canvas filters ignore the transform, so blur is scaled by hand like shadows.
 */
export function applyFx(ctx: Ctx, fx: PhotoFx | undefined, x: number, y: number, w: number) {
  if (!fx) return;
  if (fx.opacity !== undefined && fx.opacity < 1) ctx.globalAlpha *= fx.opacity;
  const f = [
    fx.brightness !== undefined && fx.brightness !== 1 && `brightness(${fx.brightness})`,
    fx.contrast !== undefined && fx.contrast !== 1 && `contrast(${fx.contrast})`,
    fx.saturate !== undefined && fx.saturate !== 1 && `saturate(${fx.saturate})`,
    fx.gray && `grayscale(${fx.gray})`,
    fx.blur && `blur(${fx.blur * ctx.getTransform().a}px)`,
  ].filter(Boolean);
  if (f.length) ctx.filter = f.join(" ");
  if (fx.flip) {
    ctx.translate(x * 2 + w, 0);
    ctx.scale(-1, 1);
  }
}

/** Draws `im` filling the box, framed by `f` (and adjusted by its `fx`, if it is a photo slot). */
export function drawCover(ctx: Ctx, im: Drawable | null, f: Framing & { fx?: PhotoFx }, x: number, y: number, w: number, h: number) {
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
  applyFx(ctx, f.fx, x, y, w);
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

export function fadeBottom(ctx: Ctx, { W, H }: Frame, y0: number, y1: number) {
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

/** Instagram-style blue verified badge centered on (x, y); `s` scales the 25px-radius original. */
export function verifiedBadge(ctx: Ctx, x: number, y: number, s = 1) {
  ctx.fillStyle = "#3897f0";
  ctx.beginPath();
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const rr = (k % 2 ? 21 : 25) * s;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 5 * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y + 1 * s);
  ctx.lineTo(x - 2 * s, y + 8 * s);
  ctx.lineTo(x + 10 * s, y - 7 * s);
  ctx.stroke();
}

/** Circle-clipped photo (avatar), or nothing if the slot is empty. */
export function drawAvatar(ctx: Ctx, slot: ImageSlot, cx: number, cy: number, r: number, fallback: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = fallback;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  const im = uploaded(slot);
  if (im) drawCover(ctx, im, slot, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

export function swipeTag(ctx: Ctx, accent: string, text: string, x: number, y: number) {
  ctx.font = montserrat(900, 34);
  ctx.textAlign = "right";
  const color = tintOf("swipe", accent);
  movable(ctx, "swipe", textBox(ctx, text, x, y, 34), () => {
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  });
}
