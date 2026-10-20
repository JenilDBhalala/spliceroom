import type { Brand, Region, RenderState } from "@/types/post";
import {
  H, W, type Ctx, blockH, drawCover, drawLines, fadeBottom, fitText, imageOf, montserrat, bebas, shadowOff, shadowOn, toks, uploaded,
} from "./helpers";

/** Page logo, or the page name in the accent color, top left. */
export function brandMark(ctx: Ctx, brand: Brand) {
  const logo = uploaded(brand.logo);
  if (logo) {
    shadowOn(ctx, 18);
    const sc = Math.min(300 / logo.naturalWidth, 86 / logo.naturalHeight);
    ctx.drawImage(logo, 64, 70, logo.naturalWidth * sc, logo.naturalHeight * sc);
    shadowOff(ctx);
    return;
  }
  ctx.font = montserrat(900, 64);
  ctx.textAlign = "left";
  shadowOn(ctx, 18);
  ctx.fillStyle = brand.accent;
  ctx.fillText((brand.name || "").toLowerCase(), 64, 134);
  shadowOff(ctx);
}

export function hlCover(ctx: Ctx, { brand, posts }: RenderState): Region[] {
  const p = posts.headline;
  drawCover(ctx, imageOf(p.img), p.img, 0, 0, W, H);
  fadeBottom(ctx, H * 0.5, H * 0.71);
  if (p.logo) brandMark(ctx, brand);
  if (p.swipe) {
    shadowOn(ctx, 16);
    ctx.font = bebas(62);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.fillText("SWIPE LEFT", W - 150, 136);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(W - 66, 112);
    ctx.lineTo(W - 126, 112);
    ctx.moveTo(W - 108, 94);
    ctx.lineTo(W - 126, 112);
    ctx.lineTo(W - 108, 130);
    ctx.stroke();
    shadowOff(ctx);
  }
  const lh = 1.1;
  const fit = fitText(ctx, toks(p.text), (s) => montserrat(900, s), W - 150, H * 0.27, lh, 96, 34);
  const top = H * 0.715 + (H * 0.27 - blockH(fit.lines.length, fit.size, lh)) / 2;
  drawLines(ctx, fit, W / 2, top, lh, "#fff", brand.accent);
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "headline", "img"] }];
}

export function hlClean(ctx: Ctx, { posts }: RenderState): Region[] {
  const p = posts.headline;
  drawCover(ctx, imageOf(p.img), p.cleanAdj, 0, 0, W, H);
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "headline", "cleanAdj"], imgPath: ["posts", "headline", "img"] }];
}
