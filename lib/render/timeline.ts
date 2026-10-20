import type { Region, RenderState } from "@/types/post";
import {
  H, W, type Ctx, blockH, cinzel, drawContain, drawCover, fitText, imageOf, montserrat, shadowOff, shadowOn, toks, uploaded,
} from "./helpers";

export function timeline(ctx: Ctx, { posts }: RenderState): Region[] {
  const rows = posts.timeline.rows;
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
      const lh = 1.0;
      ctx.save();
      ctx.letterSpacing = "4px";
      const fit = fitText(ctx, toks(r.title), cinzel, 380, rh * 0.55, lh, 64, 20);
      const left = 60;
      fit.lines.forEach((L, li) => {
        ctx.font = cinzel(fit.size);
        ctx.textAlign = "left";
        ctx.fillStyle = "#f1e4c4";
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
