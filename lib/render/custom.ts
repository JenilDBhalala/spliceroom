import type { Brand, Frame, ImageLayer, Layer, Region, RenderState, SlotPath, TextLayer } from "@/types/post";
import { fontDef } from "./fonts";
import { type Ctx, applyFx, hexAlpha, blockH, drawCover, fontFace, imageOf, rrect, setShadow, shadowOff, toks, wrap } from "./helpers";

type Box = { x: number; y: number; w: number; h: number };

const CROP_RATIO = { square: 1, wide: 3 / 4, tall: 5 / 4 } as const;

/** Blank canvas: a photo, color or gradient background with free text and image layers on top. */
export function custom(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.custom;
  const regs: Region[] = [];

  if (p.bg === "photo") {
    drawCover(ctx, imageOf(p.bgImg), p.bgImg, 0, 0, W, H);
    if (p.darken > 0) {
      ctx.fillStyle = `rgba(0,0,0,${p.darken})`;
      ctx.fillRect(0, 0, W, H);
    }
    regs.push({ x: 0, y: 0, w: W, h: H, path: ["posts", "custom", "bgImg"] });
  } else if (p.bg === "gradient") {
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, p.gradient[0]);
    g.addColorStop(1, p.gradient[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = p.bgColor;
    ctx.fillRect(0, 0, W, H);
  }

  return [...regs, ...drawLayers(ctx, p.layers, brand, frame, ["posts", "custom", "layers"])];
}

/** Free text and photo layers, each with its own opacity and rotation; `path` is the array holding them. */
export function drawLayers(ctx: Ctx, layers: Layer[], brand: Brand, frame: Frame, path: SlotPath): Region[] {
  return layers.map((l, i) => {
    ctx.save();
    if (l.rotate) {
      const [cx, cy] = [l.x * frame.W, l.y * frame.H];
      ctx.translate(cx, cy);
      ctx.rotate((l.rotate * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    if (l.opacity !== undefined && l.opacity < 1) ctx.globalAlpha = l.opacity;
    const box = l.kind === "text" ? drawText(ctx, l, brand, frame) : drawImage(ctx, l, frame);
    ctx.restore();
    return { ...box, path: [...path, i], layer: { id: l.id, resize: l.kind === "text" ? "size" : "w" }, rotate: l.rotate };
  });
}

function drawText(ctx: Ctx, l: TextLayer, brand: Brand, { W, H }: Frame): Box {
  const def = fontDef(l.font);
  // Layers saved before weight/spacing existed lack those fields; ?? keeps the old look.
  const lh = (def.group === "Handwritten & script" ? 1.3 : def.key === "Press Start 2P" ? 1.45 : 1.12) * (l.leading ?? 1);
  const size = l.size;
  const cx = l.x * W;
  const cy = l.y * H;
  ctx.save();
  ctx.letterSpacing = `${(l.font === "Cinzel" ? Math.round(size / 15) : 0) + (l.tracking ?? 0) * size}px`;
  ctx.font = fontFace(l.font, size, l.weight);
  const res = wrap(ctx, toks(l.text, l.caps), l.width * W);
  res.size = size;
  if (!res.lines.length) {
    ctx.restore();
    return { x: cx - 150, y: cy - size / 2, w: 300, h: size };
  }
  const contentW = Math.max(...res.lines.map((L) => L.w));
  const bh = blockH(res.lines.length, size, lh);
  const top = cy - bh / 2;
  const left = cx - contentW / 2;
  const pad = size * 0.3;

  if (l.effect === "box") {
    ctx.fillStyle = l.effectColor;
    rrect(ctx, left - pad, top - pad, contentW + pad * 2, bh + pad * 2 + size * 0.2, size * 0.22);
    ctx.fill();
  }
  if (l.effect === "shadow") setShadow(ctx, hexAlpha(l.effectColor, 0.75), size * 0.22, size * 0.05);
  // Neon-style glow: a wide soft shadow in the glow color, no offset.
  if (l.effect === "glow") setShadow(ctx, l.effectColor, size * 0.45, 0);
  if (l.effect === "outline") {
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeStyle = l.effectColor;
    ctx.lineWidth = Math.max(2, size * (l.stroke ?? 0.13));
  }
  const accent = l.accent ?? brand.accent;
  ctx.textAlign = "left";
  // Outlines first, then all the letters, so a thick outline never covers the word before it.
  const pass = (draw: (t: string, x: number, y: number, em: boolean) => void) =>
    res.lines.forEach((L, i) => {
      let x = l.align === "left" ? left : l.align === "right" ? left + contentW - L.w : left + (contentW - L.w) / 2;
      const y = top + size * 0.74 + i * size * lh;
      L.words.forEach((wd, k) => {
        if (k && !wd.join) x += res.sp;
        draw(wd.t, x, y, !!wd.em);
        x += wd.w;
      });
    });
  if (l.effect === "outline") pass((t, x, y) => ctx.strokeText(t, x, y));
  pass((t, x, y, em) => {
    ctx.fillStyle = em ? accent : l.color;
    ctx.fillText(t, x, y);
  });
  shadowOff(ctx);
  ctx.restore();
  const extra = l.effect === "box" ? pad : size * 0.08;
  return { x: left - extra, y: top - extra, w: contentW + extra * 2, h: bh + extra * 2 + size * 0.2 };
}

function drawImage(ctx: Ctx, l: ImageLayer, { W, H }: Frame): Box {
  const im = imageOf(l.img);
  const w = l.w * W;
  const natural = im ? ((im as HTMLImageElement).naturalHeight || im.height) / ((im as HTMLImageElement).naturalWidth || im.width) : 0.75;
  const ratio = l.shape === "circle" ? 1 : l.crop === "free" ? natural : CROP_RATIO[l.crop];
  const h = w * ratio;
  const x = l.x * W - w / 2;
  const y = l.y * H - h / 2;
  const shapePath = () => {
    if (l.shape === "circle") {
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    } else rrect(ctx, x, y, w, h, l.shape === "rounded" ? Math.min(w, h) * 0.06 : 0.01);
  };

  ctx.save();
  shapePath();
  ctx.clip();
  if (im) {
    if (l.crop === "free" && l.shape !== "circle") {
      applyFx(ctx, l.img.fx, x, y, w);
      ctx.drawImage(im, x, y, w, h);
    } else drawCover(ctx, im, l.img, x, y, w, h);
  } else {
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  if (l.border) {
    shapePath();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(4, w * 0.012);
    ctx.stroke();
  }
  return { x, y, w, h };
}
