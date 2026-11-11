import type { Brand, Frame, ImageSlot, Region, RenderState, Slide, TextStyle } from "@/types/post";
import {
  type Ctx, type Wrapped, accentOf, blockH, drawCover, drawLines, fadeBottom, fontFace, imageOf, montserrat, movable, shadowOff, shadowOn,
  toks, wrap, lookOf, tintOf, newsTag, sourceLine, SOURCE_H, TAG_H, fitStyled, leadOf, linesBox, rrect, shadeLight,
} from "./helpers";

type Box = { x: number; y: number; w: number; h: number };

/** Dark or light text, whichever reads on `bg`. */
const inkOn = (bg: string) => (shadeLight(bg) ? "#0b0b0b" : "#ffffff");

/** Room the swipe cue takes at the bottom of a slide. */
const SWIPE_H = 58;

/** "SWIPE FOR MORE ›", centered at the bottom; on every slide but the last. */
function swipeCue(ctx: Ctx, { W, H }: Frame, ink: string) {
  const text = "SWIPE FOR MORE";
  const y = H - 46;
  ctx.font = montserrat(900, 30);
  ctx.letterSpacing = "3px";
  const tw = ctx.measureText(text).width;
  ctx.letterSpacing = "0px";
  const x = W / 2 - (tw + 30) / 2;
  const color = tintOf("swipe", ink);
  movable(ctx, "swipe", { x: x - 10, y: y - 34, w: tw + 50, h: 46 }, () => {
    ctx.font = montserrat(900, 30);
    ctx.letterSpacing = "3px";
    ctx.textAlign = "left";
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.letterSpacing = "0px";
    // A drawn chevron, so it doesn't depend on the font having an arrow.
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + tw + 16, y - 25);
    ctx.lineTo(x + tw + 28, y - 12);
    ctx.lineTo(x + tw + 16, y + 1);
    ctx.stroke();
  });
}

/** The photo inset with a rounded theme-color border, as in the Frame design. */
function framedPhoto(ctx: Ctx, slot: ImageSlot, box: Box, accent: string) {
  ctx.save();
  rrect(ctx, box.x, box.y, box.w, box.h, 28);
  ctx.clip();
  drawCover(ctx, imageOf(slot), slot, box.x, box.y, box.w, box.h);
  ctx.restore();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  rrect(ctx, box.x, box.y, box.w, box.h, 28);
  ctx.stroke();
}

export function newsCover(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.news;
  const design = p.design ?? "photo";
  const st = lookOf("text", p.style);
  const accent = accentOf(brand, st);
  const tagH = p.tag?.trim() ? TAG_H : 0;
  const srcH = p.source?.trim() ? SOURCE_H : 0;

  if (design !== "photo") {
    // Band: photo on top, a theme-color band holding the headline. Frame: the photo inset on a dark slide.
    const band = design === "band";
    const photo: Box = band ? { x: 0, y: 0, w: W, h: H * 0.6 } : { x: 54, y: 54, w: W - 108, h: H * 0.58 };
    ctx.fillStyle = band ? accent : "#0b0b0b";
    ctx.fillRect(0, 0, W, H);
    if (band) drawCover(ctx, imageOf(p.img), p.img, photo.x, photo.y, photo.w, photo.h);
    else framedPhoto(ctx, p.img, photo, accent);
    const ink = band ? inkOn(accent) : st.color;
    const textTop = photo.y + photo.h + (tagH ? 46 : 40);
    const swH = p.swipe ? SWIPE_H : 0;
    const bottom = H - 50 - srcH - swH;
    ctx.save();
    const look = band ? { ...st, color: ink } : st;
    const lh = leadOf(st, 1.02);
    const fit = fitStyled(ctx, p.text, look, W - 120, bottom - textTop, lh, 96, 32);
    const textH = blockH(fit.lines.length, fit.size, lh);
    const top = textTop + Math.max(0, (bottom - textTop - textH) / 2);
    // On the band the theme color is the background, so highlighted words keep the text color.
    movable(ctx, "text", linesBox(fit, W / 2, top, lh), () => drawLines(ctx, fit, W / 2, top, lh, look.color, band ? look.color : accent));
    ctx.restore();
    // The tag sits on the photo's bottom edge, dark on the band so it doesn't vanish into it.
    if (tagH) newsTag(ctx, p.tag!, band ? "#0b0b0b" : accent, W / 2, photo.y + photo.h - 31);
    if (srcH) sourceLine(ctx, p.source!, W / 2, H - 50 - swH, band ? ink : undefined);
    if (p.swipe) swipeCue(ctx, frame, band ? ink : accent);
    return [{ ...photo, path: ["posts", "news", "img"] }];
  }

  const regs: Region[] = [{ x: 0, y: 0, w: W, h: H, path: ["posts", "news", "img"] }];
  drawCover(ctx, imageOf(p.img), p.img, 0, 0, W, H);
  fadeBottom(ctx, frame, H * 0.52, H * 0.8);
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
  // A tag above and a source line below take room from the headline.
  const bottom = H - 105 - srcH;
  const top = p.coverStyle === "even" ? evenHeadline(ctx, p.text, st, brand, frame, bottom, H * 0.4 - tagH - srcH - 30) : stretchedHeadline(ctx, p.text, st, frame, bottom, H * 0.4 - tagH - srcH - 30);
  if (tagH) newsTag(ctx, p.tag!, accent, W / 2, top - tagH);
  else {
    // Without a tag, a short theme-color bar marks the headline.
    ctx.fillStyle = accent;
    rrect(ctx, W / 2 - 50, top - 34, 100, 8, 4);
    ctx.fill();
  }
  if (srcH) sourceLine(ctx, p.source!, W / 2, bottom + srcH);
  if (p.swipe) swipeCue(ctx, frame, accent);
  return regs;
}

/** Each line sized to fill the full width; returns the headline's top. */
function stretchedHeadline(ctx: Ctx, text: string, st: TextStyle, { W }: Frame, bottom: number, maxH: number) {
  let lines = (st.caps ? (text || "").toUpperCase() : text || "")
    .replace(/\*/g, "")
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
  const gap = 16 * (st.leading ?? 1);
  const spacing = (size: number) => `${(st.font === "Cinzel" ? 6 : 0) + (st.tracking ?? 0) * size}px`;
  ctx.save();
  ctx.letterSpacing = spacing(100);
  ctx.font = fontFace(st.font, 100, st.weight);
  // A size multiplier below 1 shrinks lines; above 1 is capped so lines never run off the slide.
  const k = Math.min(st.scale || 1, (W - 60) / maxW);
  let sizes = lines.map((l) => Math.min(210, (100 * maxW) / Math.max(1, ctx.measureText(l).width)) * k);
  let total = sizes.reduce((a, s) => a + s * 0.73, 0) + gap * (lines.length - 1);
  if (total > maxH) {
    const f = (maxH - gap * (lines.length - 1)) / (total - gap * (lines.length - 1));
    sizes = sizes.map((s) => s * f);
    total = maxH;
  }
  movable(ctx, "text", { x: 75, y: bottom - total, w: maxW, h: total + 20 }, () => {
    let y = bottom - total;
    ctx.fillStyle = st.color;
    ctx.textAlign = "center";
    lines.forEach((l, i) => {
      ctx.letterSpacing = spacing(sizes[i]);
      ctx.font = fontFace(st.font, sizes[i], st.weight);
      y += sizes[i] * 0.73;
      ctx.fillText(l, W / 2, y);
      y += gap;
    });
  });
  ctx.restore();
  return bottom - total;
}

/** Every line the same size, wrapped and centered like a headline cover; returns the headline's top. */
function evenHeadline(ctx: Ctx, text: string, st: TextStyle, brand: Brand, { W }: Frame, bottom: number, maxH: number) {
  const lh = leadOf(st, 1.02);
  ctx.save();
  const fit = fitStyled(ctx, text, st, W - 110, maxH, lh, 110, 36);
  const top = bottom - blockH(fit.lines.length, fit.size, lh);
  movable(ctx, "text", linesBox(fit, W / 2, top, lh), () => drawLines(ctx, fit, W / 2, top, lh, st.color, accentOf(brand, st)));
  ctx.restore();
  return top;
}

export function newsStory(ctx: Ctx, { brand, posts, frame }: RenderState, sl: Slide): Region[] {
  const { W, H } = frame;
  const i = sl.i!;
  const p = posts.news;
  const st = p.stories[i];
  const design = p.design ?? "photo";
  const accent = accentOf(brand, p.style);
  const path = ["posts", "news", "stories", i, "img"];
  let photo: Box;
  let text: Box;
  let color = tintOf("text", "#ffffff");
  let em = accent;
  if (design === "band") {
    photo = { x: 0, y: 0, w: W, h: H * 0.62 };
    text = { x: 65, y: photo.h + 40, w: W - 130, h: H - photo.h - 80 };
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, H);
    drawCover(ctx, imageOf(st.img), st.img, photo.x, photo.y, photo.w, photo.h);
    color = tintOf("text", inkOn(accent));
    em = color;
  } else if (design === "frame") {
    photo = { x: 54, y: 54, w: W - 108, h: H * 0.6 };
    text = { x: 65, y: photo.y + photo.h + 36, w: W - 130, h: H - photo.y - photo.h - 76 };
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, W, H);
    framedPhoto(ctx, st.img, photo, accent);
  } else {
    photo = { x: 0, y: 0, w: W, h: H * 0.74 };
    text = { x: 65, y: H * 0.735 + 10, w: W - 130, h: H * 0.25 };
    drawCover(ctx, imageOf(st.img), st.img, 0, 0, W, photo.h);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, photo.h, W, H);
    fadeBottom(ctx, frame, H * 0.56, H * 0.72);
  }
  // Every slide but the last asks for a swipe; the follow card, when on, comes after the last story.
  const more = p.swipe && (i < p.stories.length - 1 || p.follow);
  if (more) text.h = Math.min(text.h, H - SWIPE_H - 40 - text.y);
  storyText(ctx, st.text, text, color, em);
  if (more) swipeCue(ctx, frame, design === "band" ? color : accent);
  // "2/4": where this slide sits in the carousel, in the theme color.
  slideBadge(ctx, `${i + 2}/${p.stories.length + 1}`, accent, design === "frame" ? photo.x + 26 : 40, design === "frame" ? photo.y + 26 : 40);
  return [{ ...photo, path }];
}

/** Story paragraphs, as large as fits the box, centered in it. */
function storyText(ctx: Ctx, raw: string, box: Box, color: string, em: string) {
  const paras = (raw || "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lh = 1.13;
  let fits: Wrapped[] = [];
  let size: number;
  const totalH = () => fits.reduce((a, f) => a + blockH(f.lines.length, size, lh), 0) + size * 0.95 * (fits.length - 1);
  for (size = 56; size >= 22; size -= 2) {
    ctx.font = montserrat(800, size);
    fits = paras.map((pp) => {
      const r = wrap(ctx, toks(pp.replace(/\n/g, " ")), box.w);
      r.size = size;
      return r;
    });
    if (!fits.some((f) => f.over) && totalH() <= box.h) break;
  }
  // Like the reference, an overflowing text ends the loop one step below the minimum.
  const y0 = box.y + (box.h - totalH()) / 2;
  const bodyW = Math.max(0, ...fits.flatMap((f) => f.lines.map((L) => L.w)));
  const cx = box.x + box.w / 2;
  movable(ctx, "text", { x: cx - bodyW / 2, y: y0, w: bodyW, h: totalH() + size * 0.22 }, () => {
    let y = y0;
    fits.forEach((f) => {
      drawLines(ctx, f, cx, y, lh, color, em);
      y += blockH(f.lines.length, size, lh) + size * 0.95;
    });
  });
}

/** A small theme-color pill with the slide number, top left. */
function slideBadge(ctx: Ctx, label: string, accent: string, x: number, y: number) {
  ctx.font = montserrat(800, 30);
  const w = ctx.measureText(label).width + 36;
  const bg = tintOf("badge", accent);
  movable(ctx, "badge", { x, y, w, h: 52 }, () => {
    ctx.fillStyle = bg;
    rrect(ctx, x, y, w, 52, 26);
    ctx.fill();
    ctx.font = montserrat(800, 30);
    ctx.textAlign = "center";
    ctx.fillStyle = inkOn(bg);
    ctx.fillText(label, x + w / 2, y + 37);
  });
}
