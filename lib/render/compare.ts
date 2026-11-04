import type { ImageSlot, Region, RenderState } from "@/types/post";
import {
  type Ctx, accentOf, anton, blockH, drawCover, drawLines, fitStyled, leadOf, fitText, imageOf, linesBox, montserrat, movable, rrect, shadowOff, shadowOn,
  toks,
} from "./helpers";

/** Two photos side by side (or stacked) with labels, an optional headline band and a VS badge. */
export function compare(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.compare;
  const accent = accentOf(brand, p.style);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  let bandH = 0;
  if (p.headline.trim()) {
    const lh = leadOf(p.style, 1.05);
    ctx.save();
    const fit = fitStyled(ctx, p.headline, p.style, W - 100, H * 0.16, lh, 96, 34);
    bandH = blockH(fit.lines.length, fit.size, lh) + 88;
    movable(ctx, "headline", linesBox(fit, W / 2, 44, lh), () => drawLines(ctx, fit, W / 2, 44, lh, p.style.color, accent));
    ctx.restore();
  }

  const gap = 6;
  const areaH = H - bandH;
  const boxes: [number, number, number, number][] =
    p.layout === "side"
      ? [
          [0, bandH, (W - gap) / 2, areaH],
          [(W + gap) / 2, bandH, (W - gap) / 2, areaH],
        ]
      : [
          [0, bandH, W, (areaH - gap) / 2],
          [0, bandH + (areaH + gap) / 2, W, (areaH - gap) / 2],
        ];
  const halves: [ImageSlot, string, "left" | "right"][] = [
    [p.left, p.leftLabel, "left"],
    [p.right, p.rightLabel, "right"],
  ];
  const regs: Region[] = [];
  halves.forEach(([slot, label, key], i) => {
    const [x, y, w, h] = boxes[i];
    drawCover(ctx, imageOf(slot), slot, x, y, w, h);
    regs.push({ x, y, w, h, path: ["posts", "compare", key] });
    if (!label.trim()) return;
    const g = ctx.createLinearGradient(0, y + h * 0.65, 0, y + h);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.7)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y + h * 0.65, w, h * 0.35);
    const fit = fitText(ctx, toks(label), (s) => montserrat(900, s), w - 120, 60, 1, 40, 22);
    const tw = fit.lines[0]?.w ?? 0;
    const pillW = tw + 56;
    const pillH = fit.size + 34;
    const px = x + w / 2 - pillW / 2;
    const py = y + h - 40 - pillH;
    movable(ctx, `${key}Label`, { x: px, y: py, w: pillW, h: pillH }, () => {
      ctx.fillStyle = accent;
      rrect(ctx, px, py, pillW, pillH, pillH / 2);
      ctx.fill();
      drawLines(ctx, { ...fit, lines: fit.lines.slice(0, 1) }, x + w / 2, py + 17 + fit.size * 0.13, 1, "#0b1a0c", "#0b1a0c");
    });
  });

  if (p.vs) {
    const cx = W / 2;
    const cy = bandH + areaH / 2;
    movable(ctx, "vs", { x: cx - 78, y: cy - 78, w: 156, h: 156 }, () => vsBadge(ctx, cx, cy));
  }
  return regs;
}

function vsBadge(ctx: Ctx, cx: number, cy: number) {
  shadowOn(ctx, 24);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, 74, 0, Math.PI * 2);
  ctx.fill();
  shadowOff(ctx);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#000";
  ctx.stroke();
  ctx.font = anton(64);
  ctx.textAlign = "center";
  ctx.fillStyle = "#000";
  ctx.fillText("VS", cx, cy + 23);
}
