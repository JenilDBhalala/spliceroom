import type { Region, RenderState, Slide } from "@/types/post";
import { brandMark } from "./headline";
import {
  type Ctx, type Wrapped, accentOf, anton, archivo, blockH, drawCover, drawLines, fadeBottom, fitStyled, leadOf, fitText, imageOf, montserrat,
  shadowOff, shadowOn, swipeTag, toks, uploaded, wrap,
} from "./helpers";

export function lessonsCover(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.lessons;
  const accent = accentOf(brand, p.style);
  drawCover(ctx, imageOf(p.img), p.img, 0, 0, W, H);
  fadeBottom(ctx, frame, H * 0.42, H * 0.7);
  if (p.brandLogo) brandMark(ctx, brand);

  // Title (logo PNG or text) sits on the bottom edge; the kicker line goes above it.
  const titleBottom = H - 130;
  let titleTop: number;
  const logo = uploaded(p.logo);
  if (logo) {
    const sc = Math.min(760 / logo.naturalWidth, 260 / logo.naturalHeight);
    const w = logo.naturalWidth * sc;
    const h = logo.naturalHeight * sc;
    titleTop = titleBottom - h;
    shadowOn(ctx, 24);
    ctx.drawImage(logo, W / 2 - w / 2, titleTop, w, h);
    shadowOff(ctx);
  } else {
    const lh = leadOf(p.style, 1.0);
    ctx.save();
    const fit = fitStyled(ctx, p.title, p.style, W - 120, H * 0.24, lh, 150, 44);
    titleTop = titleBottom - blockH(fit.lines.length, fit.size, lh);
    drawLines(ctx, fit, W / 2, titleTop, lh, p.style.color, accent);
    ctx.restore();
  }

  if (p.kicker.trim()) {
    ctx.save();
    ctx.letterSpacing = "6px";
    const lh = 1.2;
    const fit = fitText(ctx, toks(p.kicker), (s) => montserrat(800, s), W - 160, 120, lh, 44, 24);
    const kh = blockH(fit.lines.length, fit.size, lh);
    drawLines(ctx, fit, W / 2, titleTop - 38 - kh, lh, accent, p.style.color);
    ctx.restore();
  }

  if (p.swipe) swipeTag(ctx, accent, "SWIPE", W - 70, H - 50);
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "lessons", "img"] }];
}

export function lessonItem(ctx: Ctx, { brand, posts, frame }: RenderState, sl: Slide): Region[] {
  const { W, H } = frame;
  const p = posts.lessons;
  const accent = accentOf(brand, p.style);
  const i = sl.i!;
  const ls = p.lessons[i];
  const photoH = H * 0.62;
  const left = 70;
  const maxW = W - left * 2;

  drawCover(ctx, imageOf(ls.img), ls.img, 0, 0, W, photoH);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, photoH, W, H - photoH);
  fadeBottom(ctx, frame, H * 0.4, photoH);

  // Accent number overlapping the bottom of the photo.
  let y = photoH - 20;
  if (p.numbers !== "off") {
    const size = p.numbers === "large" ? 170 : 110;
    const baseline = photoH + 40 * (size / 170);
    shadowOn(ctx, 20);
    ctx.font = anton(size);
    ctx.textAlign = "left";
    ctx.fillStyle = accent;
    ctx.fillText(String(i + 1).padStart(2, "0"), left - 4 * (size / 170), baseline);
    shadowOff(ctx);
    y = baseline + 40;
  }

  // Lesson title, then the body text in the space left above the footer.
  const footerY = H - 56;
  const tlh = leadOf(p.style, 1.04);
  ctx.save();
  const title = fitStyled(ctx, ls.title, p.style, maxW, 180, tlh, 76, 36);
  drawLines(ctx, title, left, y, tlh, p.style.color, accent, "left");
  ctx.restore();
  y += blockH(title.lines.length, title.size, tlh) + 30;

  const blh = 1.34;
  const paras = (ls.text || "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  drawBody(ctx, paras, left, y, maxW, footerY - 50 - y, blh, accent);

  // Footer: page name left, progress right.
  ctx.font = montserrat(900, 30);
  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.fillText((brand.name || "").toLowerCase(), left, footerY);
  ctx.font = montserrat(800, 26);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillText(`${String(i + 1).padStart(2, "0")} / ${String(p.lessons.length).padStart(2, "0")}`, W - left, footerY);

  return [{ x: 0, y: 0, w: W, h: photoH, path: ["posts", "lessons", "lessons", i, "img"] }];
}

/** Paragraphs at the largest size (40 down to 22) that fits maxW × maxH, separated by a gap. */
function drawBody(ctx: Ctx, paras: string[], left: number, top: number, maxW: number, maxH: number, lh: number, accent: string) {
  if (!paras.length || maxH <= 0) return;
  let fits: Wrapped[] = [];
  let size = 40;
  const gap = () => size * 0.9;
  const totalH = () => fits.reduce((a, f) => a + blockH(f.lines.length, size, lh), 0) + gap() * (fits.length - 1);
  for (; size >= 22; size -= 2) {
    ctx.font = archivo(500, size);
    fits = paras.map((pp) => ({ ...wrap(ctx, toks(pp.replace(/\n/g, " "), false), maxW), size }));
    if (!fits.some((f) => f.over) && totalH() <= maxH) break;
  }
  size = fits[0].size;
  ctx.font = archivo(500, size);
  let y = top;
  fits.forEach((f) => {
    drawLines(ctx, f, left, y, lh, "#d9dcd9", accent, "left");
    y += blockH(f.lines.length, size, lh) + gap();
  });
}
