import type { Region, RenderState } from "@/types/post";
import {
  type Ctx, accentOf, blockH, drawCover, drawLines, fitStyled, fitText, fontFace, imageOf, leadOf, linesBox, lookOf, movable, shadowOff, shadowOn, toks,
} from "./helpers";

/** Still height for each letterbox: none fills the slide; the others are 1.85:1 and 2.39:1 film frames. */
const RATIO = { thin: 1.85, wide: 2.39 } as const;
/** Classic subtitle yellow. */
const YELLOW = "#F3CE32";

/** A movie still in letterbox bars with subtitles near its bottom edge, and an optional caption above it. */
export function scene(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.scene;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  // Caption first, so the still can sit below it.
  const lh = leadOf(p.style, 1.2);
  ctx.save();
  const st = lookOf("caption", p.style);
  const capFit = p.caption.trim() ? fitStyled(ctx, p.caption, st, W - 120, H * 0.3, lh, 64, 30) : null;
  // The fitted font and spacing, to draw with later.
  const capFace = [ctx.font, ctx.letterSpacing] as const;
  ctx.restore();
  const capH = capFit ? blockH(capFit.lines.length, capFit.size, lh) : 0;

  const stillH = p.bars === "none" ? H : Math.min(H, W / RATIO[p.bars]);
  // Bars: the still is centered, or pushed down so a caption fits above it.
  const minTop = capH ? capH + 110 : 0;
  const stillY = p.bars === "none" ? 0 : Math.max((H - stillH) / 2, Math.min(minTop, H - stillH));
  drawCover(ctx, imageOf(p.img), p.img, 0, stillY, W, stillH);

  if (capFit) {
    ctx.save();
    // Over a full-slide still the caption needs its own shadow to read.
    const room = p.bars === "none" ? capH + 120 : stillY;
    const top = Math.max(50, (room - capH) / 2);
    movable(ctx, "caption", linesBox(capFit, W / 2, top, lh), () => {
      [ctx.font, ctx.letterSpacing] = capFace;
      if (p.bars === "none") shadowOn(ctx, 18);
      drawLines(ctx, capFit, W / 2, top, lh, st.color, accentOf(brand, st));
      shadowOff(ctx);
    });
    ctx.restore();
  }

  if (p.subtitle.trim()) {
    const sub = lookOf("subtitle", { ...p.style, font: "Archivo", weight: 600, color: p.subColor === "yellow" ? YELLOW : "#ffffff", caps: false, scale: 1, tracking: 0, leading: 1, accent: null, effect: undefined, effectColor: undefined, stroke: undefined });
    const slh = 1.22;
    // Italic slants whichever font the subtitle uses.
    const font = (s: number) => `${p.italic ? "italic " : ""}${fontFace(sub.font, s, sub.weight)}`;
    ctx.save();
    const fit = fitText(ctx, toks(p.subtitle, sub.caps), font, W - 140, stillH * 0.3, slh, 44, 24);
    const subH = blockH(fit.lines.length, fit.size, slh);
    const top = stillY + stillH - subH - Math.max(26, stillH * 0.06);
    const face = ctx.font;
    movable(ctx, "subtitle", linesBox(fit, W / 2, top, slh), () => {
      ctx.font = face;
      // A thin dark edge and soft shadow, like burned-in subtitles.
      ctx.shadowColor = "rgba(0,0,0,.85)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.lineWidth = Math.max(2, fit.size * 0.08);
      fit.lines.forEach((L, i) => {
        let x = W / 2 - L.w / 2;
        const y = top + fit.size * 0.74 + i * fit.size * slh;
        L.words.forEach((wd, k) => {
          if (k && !wd.join) x += fit.sp;
          ctx.strokeText(wd.t, x, y);
          x += wd.w;
        });
      });
      shadowOff(ctx);
      drawLines(ctx, fit, W / 2, top, slh, sub.color, accentOf(brand, sub));
    });
    ctx.restore();
  }
  return [{ x: 0, y: stillY, w: W, h: stillH, path: ["posts", "scene", "img"] }];
}
