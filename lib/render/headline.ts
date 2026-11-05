import type { Brand, Region, RenderState } from "@/types/post";
import {
  type Ctx, accentOf, bebas, blockH, drawCover, drawLines, fadeBottom, fitStyled, leadOf, imageOf, linesBox, montserrat, movable, shadowOff,
  shadowOn, textBox, uploaded, lookOf, tintOf,
} from "./helpers";

/** Page logo, or the page name in the accent color, top left. */
export function brandMark(ctx: Ctx, brand: Brand) {
  const logo = uploaded(brand.logo);
  if (logo) {
    const sc = Math.min(300 / logo.naturalWidth, 86 / logo.naturalHeight);
    const [w, h] = [logo.naturalWidth * sc, logo.naturalHeight * sc];
    movable(ctx, "brand", { x: 64, y: 70, w, h }, () => {
      shadowOn(ctx, 18);
      ctx.drawImage(logo, 64, 70, w, h);
      shadowOff(ctx);
    });
    return;
  }
  const name = (brand.name || "").toLowerCase();
  ctx.font = montserrat(900, 64);
  ctx.textAlign = "left";
  const color = tintOf("brand", brand.accent);
  movable(ctx, "brand", textBox(ctx, name, 64, 134, 64), () => {
    shadowOn(ctx, 18);
    ctx.fillStyle = color;
    ctx.fillText(name, 64, 134);
    shadowOff(ctx);
  });
}

export function hlCover(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.headline;
  drawCover(ctx, imageOf(p.img), p.img, 0, 0, W, H);
  fadeBottom(ctx, frame, H * 0.5, H * 0.71);
  if (p.logo) brandMark(ctx, brand);
  if (p.swipe) {
    ctx.font = bebas(62);
    const tw = ctx.measureText("SWIPE LEFT").width;
    const color = tintOf("swipe", "#fff");
    movable(ctx, "swipe", { x: W - 150 - tw, y: 86, w: tw + 84, h: 60 }, () => swipeLeft(ctx, W, color));
  }
  const lh = leadOf(p.style, 1.1);
  ctx.save();
  const st = lookOf("text", p.style);
  const fit = fitStyled(ctx, p.text, st, W - 150, H * 0.27, lh, 96, 34);
  const top = H * 0.715 + (H * 0.27 - blockH(fit.lines.length, fit.size, lh)) / 2;
  movable(ctx, "text", linesBox(fit, W / 2, top, lh), () => drawLines(ctx, fit, W / 2, top, lh, st.color, accentOf(brand, st)));
  ctx.restore();
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "headline", "img"] }];
}

/** "SWIPE LEFT" with an arrow, top right. */
function swipeLeft(ctx: Ctx, W: number, color: string) {
  shadowOn(ctx, 16);
  ctx.font = bebas(62);
  ctx.textAlign = "right";
  ctx.fillStyle = color;
  ctx.fillText("SWIPE LEFT", W - 150, 136);
  ctx.strokeStyle = color;
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

export function hlClean(ctx: Ctx, { posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.headline;
  drawCover(ctx, imageOf(p.img), { ...p.cleanAdj, fx: p.img.fx }, 0, 0, W, H);
  return [{ x: 0, y: 0, w: W, h: H, path: ["posts", "headline", "cleanAdj"], imgPath: ["posts", "headline", "img"] }];
}
