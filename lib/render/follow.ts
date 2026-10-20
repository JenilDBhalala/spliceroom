import type { Region, RenderState } from "@/types/post";
import {
  H, W, type Ctx, anton, archivo, blockH, drawContain, drawCover, fitText, montserrat, rrect, setShadow, toks, uploaded,
} from "./helpers";

export function follow(ctx: Ctx, { brand }: RenderState): Region[] {
  ctx.fillStyle = "#141418";
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H * 0.4, 900);
  vg.addColorStop(0, "rgba(255,255,255,.05)");
  vg.addColorStop(1, "rgba(0,0,0,.35)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.lineWidth = 2;
  [[340, 0, 120, 1350], [340, 0, 760, 1350], [780, 90, 560, 1350], [780, 90, 1080, 700], [0, 640, 1080, 240], [0, 1100, 560, 560]].forEach(
    ([a, b, c, d]) => {
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    },
  );
  const bio = (brand.bio || "").split("\n").filter((s) => s.trim()).slice(0, 5);
  const cx0 = 100;
  const cy0 = 280;
  const cw = 880;
  const chh = 290 + bio.length * 50 + (brand.link ? 56 : 0);
  ctx.save();
  setShadow(ctx, "rgba(0,0,0,.6)", 50, 12);
  ctx.fillStyle = "#0b0b0f";
  rrect(ctx, cx0, cy0, cw, chh, 56);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.09)";
  ctx.lineWidth = 3;
  rrect(ctx, cx0, cy0, cw, chh, 56);
  ctx.stroke();

  // avatar with ring
  const ax = cx0 + 140;
  const ay = cy0 + 140;
  const ar = 104;
  const rg = ctx.createLinearGradient(ax - ar, ay + ar, ax + ar, ay - ar);
  ["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"].forEach((c, i) => rg.addColorStop(i / 4, c));
  ctx.strokeStyle = rg;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(ax, ay, ar + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax, ay, ar, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#000";
  ctx.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);
  const avatar = uploaded(brand.avatar);
  const logo = uploaded(brand.logo);
  if (avatar) drawCover(ctx, avatar, brand.avatar, ax - ar, ay - ar, ar * 2, ar * 2);
  else if (logo) drawContain(ctx, logo, ax, ay, ar * 1.6, ar * 1.2);
  else {
    const t = (brand.name || "").toUpperCase();
    ctx.font = montserrat(900, 40);
    const tw = ctx.measureText(t).width;
    const s = Math.min(46, (40 * (ar * 1.6)) / Math.max(tw, 1));
    ctx.font = montserrat(900, s);
    ctx.fillStyle = brand.accent;
    ctx.textAlign = "center";
    ctx.fillText(t, ax, ay + s * 0.36);
  }
  ctx.restore();

  // name + stats
  const tx = cx0 + 290;
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";
  ctx.font = archivo(700, 42);
  const nm = brand.display || "";
  ctx.fillText(nm, tx, cy0 + 90);
  if (brand.verified) {
    // Badge drawn at 72% of the reference size: 9px gap after the name, centered on its cap height.
    const s = 0.72;
    const vx = tx + ctx.measureText(nm).width + 9 + 25 * s;
    const vy = cy0 + 75;
    ctx.fillStyle = "#3897f0";
    ctx.beginPath();
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const rr = (k % 2 ? 21 : 25) * s;
      ctx.lineTo(vx + Math.cos(a) * rr, vy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 5 * s;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(vx - 9 * s, vy + 1 * s);
    ctx.lineTo(vx - 2 * s, vy + 8 * s);
    ctx.lineTo(vx + 10 * s, vy - 7 * s);
    ctx.stroke();
  }
  [[brand.posts, "posts"], [brand.followers, "followers"], [brand.following, "following"]].forEach(([v, l], i) => {
    const x = tx + i * 200;
    ctx.fillStyle = "#fff";
    ctx.font = archivo(600, 42);
    ctx.fillText(v || "0", x, cy0 + 170);
    ctx.fillStyle = "#d8d8de";
    ctx.font = archivo(400, 36);
    ctx.fillText(l, x, cy0 + 215);
  });

  // bio
  let by = cy0 + 310;
  ctx.font = archivo(400, 35);
  bio.forEach((line) => {
    let x = cx0 + 42;
    line.split(/((?<![\w.])@[\w.]+|#\w+)/).forEach((part) => {
      if (!part) return;
      ctx.fillStyle = /^[@#]/.test(part) && !part.includes(".com") ? "#a8a9f8" : "#f1f1f4";
      ctx.fillText(part, x, by);
      x += ctx.measureText(part).width;
    });
    by += 50;
  });
  if (brand.link) {
    by += 6;
    const lx = cx0 + 58;
    ctx.strokeStyle = "#a8a9f8";
    ctx.lineWidth = 4;
    ctx.save();
    ctx.translate(lx, by - 12);
    ctx.rotate(-Math.PI / 4);
    rrect(ctx, -22, -8, 24, 16, 8);
    ctx.stroke();
    rrect(ctx, -2, -8, 24, 16, 8);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#a8a9f8";
    ctx.font = archivo(400, 35);
    ctx.fillText(brand.link, cx0 + 96, by);
  }

  // headline
  const top = cy0 + chh + 70;
  const maxH = H - 50 - top;
  const maxW = W - 80;
  const lh = 1.0;
  const fit = fitText(ctx, toks(brand.cta), anton, maxW * 0.9, maxH, lh, 150, 40);
  const bh = blockH(fit.lines.length, fit.size, lh);
  const t0 = top + Math.max(0, (maxH - bh) / 2);
  ctx.textAlign = "center";
  fit.lines.forEach((L, i) => {
    const y = t0 + fit.size * 0.74 + i * fit.size * lh;
    const sx = Math.min(1.18, maxW / L.w);
    ctx.save();
    ctx.translate(W / 2, y);
    ctx.scale(sx, 1);
    let x = -L.w / 2;
    L.words.forEach((wd, k) => {
      if (k && !wd.join) x += fit.sp;
      ctx.fillStyle = wd.em ? brand.accent : "#fff";
      ctx.textAlign = "left";
      ctx.fillText(wd.t, x, 0);
      x += wd.w;
    });
    ctx.restore();
  });
  return [];
}
