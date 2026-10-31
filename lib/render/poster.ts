import type { Region, RenderState } from "@/types/post";
import {
  type Ctx, accentOf, archivo, bebas, blockH, drawCover, drawLines, fadeBottom, fitStyled, fitText, imageOf, montserrat, shadowOff, shadowOn,
  toks, uploaded,
} from "./helpers";

/** Theatrical one-sheet: cast names on top, then tagline, title, date and billing block stacked from the bottom. */
export function poster(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.poster;
  const accent = accentOf(brand, p.style);
  drawCover(ctx, imageOf(p.img), p.img, 0, 0, W, H);

  const top = ctx.createLinearGradient(0, 0, 0, H * 0.22);
  top.addColorStop(0, "rgba(0,0,0,.65)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H * 0.22);
  fadeBottom(ctx, frame, H * 0.46, H * 0.86);

  if (p.top.trim()) {
    ctx.save();
    ctx.letterSpacing = "6px";
    const fit = fitText(ctx, toks(p.top), bebas, W - 140, 120, 1.05, 54, 26);
    shadowOn(ctx, 14);
    drawLines(ctx, fit, W / 2, 72, 1.05, "#fff", accent);
    ctx.restore();
  }

  // Bottom-up so the stack always ends just above the bottom edge.
  let y = H - 56;
  if (p.credits.trim()) {
    ctx.save();
    ctx.letterSpacing = "1px";
    const lh = 1.0;
    const fit = fitText(ctx, toks(p.credits), bebas, W - 180, 150, lh, 30, 18);
    const h = blockH(fit.lines.length, fit.size, lh);
    drawLines(ctx, fit, W / 2, y - h, lh, "rgba(255,255,255,.6)", "rgba(255,255,255,.9)");
    y -= h + 44;
    ctx.restore();
  }
  if (p.date.trim()) {
    ctx.save();
    ctx.letterSpacing = "8px";
    const fit = fitText(ctx, toks(p.date), (s) => montserrat(800, s), W - 160, 80, 1.15, 36, 20);
    const h = blockH(fit.lines.length, fit.size, 1.15);
    drawLines(ctx, fit, W / 2, y - h, 1.15, accent, "#fff");
    y -= h + 40;
    ctx.restore();
  }
  const logo = uploaded(p.logo);
  if (logo) {
    const sc = Math.min(860 / logo.naturalWidth, (H * 0.2) / logo.naturalHeight);
    const w = logo.naturalWidth * sc;
    const h = logo.naturalHeight * sc;
    shadowOn(ctx, 24);
    ctx.drawImage(logo, W / 2 - w / 2, y - h, w, h);
    shadowOff(ctx);
    y -= h + 34;
  } else if (p.title.trim()) {
    ctx.save();
    const lh = 0.92;
    const fit = fitStyled(ctx, p.title, p.style, W - 100, H * 0.22, lh, 240, 60);
    const h = blockH(fit.lines.length, fit.size, lh);
    shadowOn(ctx, 24);
    drawLines(ctx, fit, W / 2, y - h, lh, p.style.color, accent);
    y -= h + 34;
    ctx.restore();
  }
  if (p.tagline.trim()) {
    const lh = 1.25;
    const fit = fitText(ctx, toks(p.tagline, false), (s) => archivo(500, s), W - 200, 140, lh, 40, 24);
    const h = blockH(fit.lines.length, fit.size, lh);
    drawLines(ctx, fit, W / 2, y - h, lh, "rgba(255,255,255,.9)", accent);
  }
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "poster", "img"] }];
}
