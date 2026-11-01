import type { Region, RenderState } from "@/types/post";
import {
  type Ctx, blockH, drawContain, drawCover, fitStyled, leadOf, fontFace, imageOf, montserrat, shadowOff, shadowOn, uploaded,
} from "./helpers";

export function timeline(ctx: Ctx, { posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const { rows, style } = posts.timeline;
  const n = rows.length;
  const rh = H / n;
  const regs: Region[] = [];
  rows.forEach((r, i) => {
    const y = i * rh;
    drawCover(ctx, imageOf(r.img), r.img, 0, y, W, rh);
    regs.push({ x: 0, y, w: W, h: rh, path: ["posts", "timeline", "rows", i, "img"] });
    const g = ctx.createLinearGradient(0, 0, W * 0.6, 0);
    g.addColorStop(0, "rgba(0,0,0,.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W * 0.6, rh);
    const g2 = ctx.createLinearGradient(W * 0.6, 0, W, 0);
    g2.addColorStop(0, "rgba(0,0,0,0)");
    g2.addColorStop(1, "rgba(0,0,0,.45)");
    ctx.fillStyle = g2;
    ctx.fillRect(W * 0.6, y, W * 0.4, rh);
    const cy = y + rh / 2;
    shadowOn(ctx, 20);
    const logo = uploaded(r.logo);
    if (logo) {
      drawContain(ctx, logo, 50 + 175, cy, 350, rh * 0.55);
    } else {
      const lh = leadOf(style, 1.0);
      ctx.save();
      const fit = fitStyled(ctx, r.title, style, 380, rh * 0.55, lh, 64, 20);
      const left = 60;
      fit.lines.forEach((L, li) => {
        ctx.font = fontFace(style.font, fit.size, style.weight);
        ctx.textAlign = "left";
        ctx.fillStyle = style.color;
        ctx.fillText(
          L.words.map((w) => w.t).join(" "),
          left,
          cy - blockH(fit.lines.length, fit.size, lh) / 2 + fit.size * 0.74 + li * fit.size * lh,
        );
      });
      ctx.restore();
    }
    const ys = Math.min(100, rh * 0.28);
    ctx.font = montserrat(900, ys);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.fillText(r.year || "", W - 50, cy + ys * 0.36);
    shadowOff(ctx);
    if (i) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, y - 2, W, 4);
    }
  });
  return regs;
}
