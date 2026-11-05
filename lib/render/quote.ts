import type { Region, RenderState } from "@/types/post";
import {
  type Ctx, accentOf, archivo, blockH, drawCover, drawLines, fitStyled, leadOf, fitText, imageOf, linesBox, lookOf, montserrat, movable, playfair,
  textBox, tintOf, toks,
} from "./helpers";

/** Big quote with author and source, on a darkened photo or a solid color. */
export function quote(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.quote;
  const accent = accentOf(brand, p.style);
  const regs: Region[] = [];
  if (p.usePhoto) {
    drawCover(ctx, imageOf(p.img), p.img, 0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,.6)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    regs.push({ x: 0, y: 0, w: W, h: H, path: ["posts", "quote", "img"] });
  } else {
    ctx.fillStyle = p.background;
    ctx.fillRect(0, 0, W, H);
  }

  // Measure everything first, then center the whole block vertically.
  const lh = leadOf(p.style, 1.18);
  const st = lookOf("quote", p.style);
  ctx.save();
  const text = fitStyled(ctx, p.quote, st, W - 160, H * 0.5, lh, 84, 32);
  ctx.restore();
  const textH = blockH(text.lines.length, text.size, lh);
  const markH = 120;
  const author = p.author.trim() ? `— ${p.author.trim().toUpperCase()}` : "";
  ctx.save();
  ctx.letterSpacing = "4px";
  const authorFit = author ? fitText(ctx, toks(author), (s) => montserrat(800, s), W - 160, 50, 1, 34, 20) : null;
  ctx.restore();
  const authorH = authorFit ? authorFit.size * 0.74 : 0;
  const sourceH = p.source.trim() ? 18 + 30 * 0.74 : 0;
  const total = markH + 34 + textH + (authorH ? 56 + authorH : 0) + sourceH;
  let y = Math.max(60, (H - total) / 2);

  ctx.font = playfair(300);
  ctx.textAlign = "center";
  const markY = y;
  const markColor = tintOf("mark", accent);
  movable(ctx, "mark", { x: W / 2 - 70, y: markY + 10, w: 140, h: 110 }, () => {
    ctx.fillStyle = markColor;
    ctx.fillText("“", W / 2, markY + 225);
  });
  y += markH + 34;

  ctx.save();
  const again = fitStyled(ctx, p.quote, st, W - 160, H * 0.5, lh, 84, 32);
  const textY = y;
  movable(ctx, "quote", linesBox(again, W / 2, textY, lh), () => drawLines(ctx, again, W / 2, textY, lh, st.color, accentOf(brand, st)));
  ctx.restore();
  y += textH;

  if (authorFit) {
    y += 56;
    ctx.save();
    ctx.letterSpacing = "4px";
    ctx.font = montserrat(800, authorFit.size);
    const authorY = y;
    const color = tintOf("author", accent);
    movable(ctx, "author", linesBox(authorFit, W / 2, authorY, 1), () => drawLines(ctx, authorFit, W / 2, authorY, 1, color, color));
    ctx.restore();
    y += authorH;
  }
  if (sourceH) {
    ctx.font = archivo(500, 30);
    ctx.textAlign = "center";
    const sy = y + sourceH;
    const color = tintOf("source", "rgba(255,255,255,.7)");
    movable(ctx, "source", textBox(ctx, p.source, W / 2, sy, 30), () => {
      ctx.fillStyle = color;
      ctx.fillText(p.source, W / 2, sy);
    });
  }
  return regs;
}
