import type { Placeholder } from "@/types/post";
import { F } from "./fonts";

// Generated stills so the editor opens in a working state.
const PH_HUES = [[18, 200], [265, 20], [200, 35], [340, 190], [40, 220], [150, 300], [220, 10], [0, 45]];
const cache = new Map<string, HTMLCanvasElement>();

export function placeholderImage(ph: Placeholder): HTMLCanvasElement {
  const key = `${ph.seed}:${ph.label}`;
  let c = cache.get(key);
  if (!c) {
    c = makePH(ph.seed, ph.label);
    cache.set(key, c);
  }
  return c;
}

/** Drop cached placeholders (their text is drawn once, so redo after fonts load). */
export function resetPlaceholders() {
  cache.clear();
}

function makePH(seed: number, label: string) {
  // Drawn at 2× (2400×3000) so it stays sharp in the high-resolution preview and download.
  const c = document.createElement("canvas");
  c.width = 2400;
  c.height = 3000;
  const g = c.getContext("2d")!;
  g.scale(2, 2);
  const [a, b] = PH_HUES[seed % PH_HUES.length];
  const lg = g.createLinearGradient(0, 0, 1200, 1500);
  lg.addColorStop(0, `hsl(${a} 35% 18%)`);
  lg.addColorStop(1, `hsl(${b} 30% 9%)`);
  g.fillStyle = lg;
  g.fillRect(0, 0, 1200, 1500);
  const glow = (x: number, y: number, r: number, h: number, al: number) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `hsla(${h} 70% 60% / ${al})`);
    rg.addColorStop(1, `hsla(${h} 70% 50% / 0)`);
    g.fillStyle = rg;
    g.fillRect(0, 0, 1200, 1500);
  };
  glow(300 + ((seed * 137) % 600), 350 + ((seed * 91) % 400), 700, a, 0.45);
  glow(900 - ((seed * 53) % 500), 1000, 600, b, 0.3);
  // silhouette
  g.fillStyle = "rgba(0,0,0,.45)";
  const cx = 420 + ((seed * 173) % 380);
  g.beginPath();
  g.arc(cx, 620, 150, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(cx - 330, 1500);
  g.quadraticCurveTo(cx - 300, 820, cx, 800);
  g.quadraticCurveTo(cx + 300, 820, cx + 330, 1500);
  g.fill();
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = "rgba(255,255,255,.55)";
  g.textAlign = "center";
  g.font = `700 34px ${F.archivo}, sans-serif`;
  g.fillText("DROP A STILL HERE", 600, 330);
  g.font = `500 28px ${F.archivo}, sans-serif`;
  g.fillStyle = "rgba(255,255,255,.35)";
  g.fillText(label || "", 600, 375);
  return c;
}
