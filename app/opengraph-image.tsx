import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Spliceroom: make memes, movie posters and Instagram posts in seconds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const anton = await readFile(join(process.cwd(), "assets/Anton-Regular.ttf"));

const GREEN = "#bafeb8";
const BG = "#0d0f0d";

/** Mini post cards on the right, hinting at the templates. */
const CARDS = [
  { label: "MEME", top: "WHEN THE TRAILER", bg: "linear-gradient(160deg,#2f5d4f,#1b1f2e)", rotate: -7, y: 40 },
  { label: "POSTER", top: "DEAD POETS SOCIETY", bg: "linear-gradient(160deg,#6b5326,#141414)", rotate: 0, y: 0 },
  { label: "QUOTE", top: "CARPE DIEM. SEIZE THE DAY", bg: "linear-gradient(160deg,#0f2027,#2c5364)", rotate: 7, y: 40 },
];

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG, padding: "70px 80px", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <svg width="66" height="66" viewBox="0 0 64 64">
              <clipPath id="a">
                <path d="M0 0H64L0 64Z" />
              </clipPath>
              <clipPath id="b">
                <path d="M64 0V64H0Z" />
              </clipPath>
              <g transform="translate(-3 -3)">
                <circle cx="32" cy="32" r="19" fill={GREEN} clipPath="url(#a)" />
              </g>
              <g transform="translate(3 3)">
                <circle cx="32" cy="32" r="19" fill={GREEN} clipPath="url(#b)" />
              </g>
            </svg>
            <span style={{ fontFamily: "Anton", fontSize: 88, color: "#e7ece6", letterSpacing: 2, lineHeight: 1 }}>SPLICEROOM</span>
          </div>
          <div style={{ marginTop: 34, fontSize: 40, color: "#e7ece6", lineHeight: 1.25, maxWidth: 560 }}>
            Memes, movie posters &amp; Instagram posts in seconds.
          </div>
          <div style={{ marginTop: 26, fontSize: 26, color: GREEN }}>Free templates · 20+ fonts · 4:5 · 1:1 · 9:16</div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginLeft: "auto" }}>
          {CARDS.map((c) => (
            <div
              key={c.label}
              style={{
                width: 150,
                height: 188,
                marginTop: c.y,
                transform: `rotate(${c.rotate}deg)`,
                borderRadius: 16,
                background: c.bg,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: 16,
                boxShadow: "0 18px 40px rgba(0,0,0,.6)",
                border: "2px solid rgba(255,255,255,.08)",
              }}
            >
              <span style={{ fontFamily: "Anton", fontSize: 24, color: "#fff", lineHeight: 1.05 }}>{c.top}</span>
              <span style={{ fontFamily: "Anton", fontSize: 18, color: BG, background: GREEN, borderRadius: 999, padding: "4px 12px", alignSelf: "flex-start" }}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Anton", data: anton, style: "normal", weight: 400 }] },
  );
}
