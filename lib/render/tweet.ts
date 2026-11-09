import type { Region, RenderState } from "@/types/post";
import {
  type Box, type Ctx, accentOf, archivo, blockH, drawAvatar, drawCover, drawLines, fitStyled, leadOf, imageOf, movable, rrect, uploaded, verifiedBadge,
} from "./helpers";

/** "9:41 PM · 1 Nov 2026" in the viewer's own locale, like a real post. */
export function nowStamp(d = new Date()) {
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return `${time} · ${date}`;
}

const SHAPE_RATIO = { wide: 9 / 16, square: 1, tall: 5 / 4 } as const;

const THEME = {
  dark: { card: "#000", border: "#2f3336", name: "#e7e9ea", muted: "#71767b" },
  dim: { card: "#15202b", border: "#38444d", name: "#f7f9f9", muted: "#8b98a5" },
  light: { card: "#fff", border: "#e1e8ed", name: "#0f1419", muted: "#536471" },
};

const BADGE = { blue: "#1d9bf0", gold: "#e2b719", grey: "#829aab" } as const;

/** "12400" → "12.4K", "1500000" → "1.5M", like the counts under a post; anything else stays as typed. */
export function shortCount(v: string) {
  const n = Number(v.replace(/[,\s]/g, ""));
  if (!v.trim() || !Number.isFinite(n) || n < 1000) return v.trim();
  const [d, u] = n >= 1e9 ? [1e9, "B"] : n >= 1e6 ? [1e6, "M"] : [1e3, "K"];
  const x = n / d;
  return `${x >= 100 ? Math.floor(x) : Math.floor(x * 10) / 10}${u}`;
}

/** A post card in the style of an X/Twitter screenshot, centered on a plain background. */
export function tweet(ctx: Ctx, { brand, posts, frame }: RenderState): Region[] {
  const { W, H } = frame;
  const p = posts.tweet;
  const t = THEME[p.theme];
  const name = p.useBrand ? brand.display : p.name;
  const handle = p.useBrand ? `@${brand.name}` : p.handle.startsWith("@") ? p.handle : `@${p.handle}`;
  const avatar = p.useBrand ? (uploaded(brand.avatar) ? brand.avatar : brand.logo) : p.avatar;
  const verified = p.useBrand ? brand.verified : p.verified;

  ctx.fillStyle = p.background;
  ctx.fillRect(0, 0, W, H);

  const margin = 60;
  const pad = 56;
  const cardW = W - margin * 2;
  const innerW = cardW - pad * 2;
  const headerH = 120;
  const date = p.autoDate ? nowStamp() : p.date.trim();
  const views = shortCount(p.views ?? "");
  const dateH = date || views ? 30 + 34 : 0;
  const stats = ([[p.reposts, "Reposts"], [p.likes, "Likes"], [p.bookmarks, "Bookmarks"]] as const)
    .map(([v, label]) => [shortCount(v ?? ""), label] as const)
    .filter(([v]) => v);
  // A divider, then the counts row.
  const statsH = stats.length ? 30 + 2 + 30 + 34 : 0;
  const avail = H - margin * 2 - pad * 2 - headerH - 36 - dateH - statsH;
  let imgH = 0;
  if (p.showImage) {
    const shape = p.imgShape ?? "auto";
    const im = imageOf(p.img);
    const natural = im ? ((im as HTMLImageElement).naturalHeight || im.height) / ((im as HTMLImageElement).naturalWidth || im.width) : 0.62;
    const ratio = shape === "auto" ? 0.62 : shape === "original" ? natural : SHAPE_RATIO[shape];
    // Auto keeps the original fit; a chosen shape may take more room but leaves space for the text.
    imgH = Math.min(innerW * ratio, avail * (shape === "auto" ? 0.55 : 0.72));
  }
  const lh = leadOf(p.style, 1.3);
  ctx.save();
  const fit = fitStyled(ctx, p.text, p.style, innerW, avail - (imgH ? imgH + 30 : 0), lh, 60, 28);
  ctx.restore();
  const textH = p.text.trim() ? blockH(fit.lines.length, fit.size, lh) : 0;
  const cardH = pad * 2 + headerH + 36 + textH + (imgH ? 30 + imgH : 0) + dateH + statsH;
  const x0 = margin;
  const y0 = Math.max(margin, (H - cardH) / 2);

  // The whole card moves as one; its photo stays draggable where the card ends up.
  const photo: Box[] = [];
  const place = movable(ctx, "card", { x: x0, y: y0, w: cardW, h: cardH }, () => {
    ctx.fillStyle = t.card;
    rrect(ctx, x0, y0, cardW, cardH, 36);
    ctx.fill();
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // header: avatar, name + badge, handle
    const ax = x0 + pad + 60;
    const ay = y0 + pad + 60;
    drawAvatar(ctx, avatar, ax, ay, 60, p.theme === "light" ? "#eff3f4" : "#16181c");
    if (!uploaded(avatar)) {
      ctx.font = archivo(700, 52);
      ctx.textAlign = "center";
      ctx.fillStyle = accentOf(brand, p.style);
      ctx.fillText((name || "?").trim().charAt(0).toUpperCase(), ax, ay + 19);
    }
    const tx = x0 + pad + 144;
    ctx.textAlign = "left";
    ctx.font = archivo(700, 40);
    ctx.fillStyle = t.name;
    ctx.fillText(name, tx, y0 + pad + 50);
    if (verified) verifiedBadge(ctx, tx + ctx.measureText(name).width + 9 + 25 * 0.66, y0 + pad + 36, 0.66, BADGE[p.badge ?? "blue"]);
    ctx.font = archivo(400, 34);
    ctx.fillStyle = t.muted;
    ctx.fillText(handle, tx, y0 + pad + 100);

    let y = y0 + pad + headerH + 36;
    if (textH) {
      ctx.save();
      const again = fitStyled(ctx, p.text, p.style, innerW, avail - (imgH ? imgH + 30 : 0), lh, 60, 28);
      drawLines(ctx, again, x0 + pad, y, lh, p.style.color, accentOf(brand, p.style), "left");
      ctx.restore();
      y += textH;
    }
    if (imgH) {
      y += 30;
      ctx.save();
      rrect(ctx, x0 + pad, y, innerW, imgH, 24);
      ctx.clip();
      drawCover(ctx, imageOf(p.img), p.img, x0 + pad, y, innerW, imgH);
      ctx.restore();
      photo.push({ x: x0 + pad, y, w: innerW, h: imgH });
      y += imgH;
    }
    if (dateH) {
      // "9:41 AM · Oct 31, 2026 · 1.2M Views", the number in bold like on X.
      y += 30;
      runs(ctx, x0 + pad, y + 26, [
        [date, t.muted, 400],
        [date && views ? " · " : "", t.muted, 400],
        [views, t.name, 700],
        [views ? " Views" : "", t.muted, 400],
      ]);
      y += 34;
    }
    if (statsH) {
      y += 30;
      ctx.fillStyle = t.border;
      ctx.fillRect(x0 + pad, y, innerW, 2);
      y += 2 + 30;
      runs(ctx, x0 + pad, y + 26, stats.flatMap(([v, label], i) => [[v, t.name, 700], [` ${label}${i < stats.length - 1 ? "    " : ""}`, t.muted, 400]] as const));
    }
  });
  return photo.map((b) => ({ ...place(b), path: ["posts", "tweet", "img"] }));
}

/** Pieces of 30px text in a row, each with its own color and weight. */
function runs(ctx: Ctx, x: number, y: number, parts: readonly (readonly [string, string, number])[]) {
  ctx.textAlign = "left";
  for (const [text, color, weight] of parts) {
    if (!text) continue;
    ctx.font = archivo(weight, 30);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    x += ctx.measureText(text).width;
  }
}
