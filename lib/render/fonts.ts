import type { FontKey } from "@/types/post";
import { notifyRedraw } from "@/lib/images";

// Canvas font families. next/font generates its own family names, so the
// editor registers them here on boot; the defaults match the plain Google names.
export const F = {
  montserrat: "Montserrat",
  anton: "Anton",
  bebas: '"Bebas Neue"',
  cinzel: "Cinzel",
  archivo: "Archivo",
  playfair: '"Playfair Display"',
  oswald: "Oswald",
  poppins: "Poppins",
  archivoBlack: '"Archivo Black"',
  bangers: "Bangers",
  marker: '"Permanent Marker"',
  caveat: "Caveat",
  pacifico: "Pacifico",
  lobster: "Lobster",
  dancing: '"Dancing Script"',
  courier: '"Courier Prime"',
  abril: '"Abril Fatface"',
  dmSerif: '"DM Serif Display"',
  pixel: '"Press Start 2P"',
  creepster: "Creepster",
  grotesk: '"Space Grotesk"',
};
export type FamilyId = keyof typeof F;

export function setFontFamilies(families: Partial<typeof F>) {
  Object.assign(F, families);
}

export interface FontDef {
  key: FontKey;
  label: string;
  /** What it's good for, shown under the name in the picker. */
  hint: string;
  group: (typeof FONT_GROUPS)[number];
  id: FamilyId;
  weight: number;
  fallback: string;
}

export const FONT_GROUPS = ["Bold & impact", "Clean & modern", "Serif & elegant", "Handwritten & script", "Fun"] as const;

/** Every font a template or layer can use. */
export const FONTS: FontDef[] = [
  { key: "Montserrat", label: "Montserrat Black", hint: "Bold, modern", group: "Bold & impact", id: "montserrat", weight: 900, fallback: "Arial Black, sans-serif" },
  { key: "Anton", label: "Anton", hint: "Tall meme font", group: "Bold & impact", id: "anton", weight: 400, fallback: "Impact, sans-serif" },
  { key: "Bebas Neue", label: "Bebas Neue", hint: "Condensed poster", group: "Bold & impact", id: "bebas", weight: 400, fallback: "Impact, sans-serif" },
  { key: "Oswald", label: "Oswald", hint: "Strong headline", group: "Bold & impact", id: "oswald", weight: 700, fallback: "Impact, sans-serif" },
  { key: "Archivo Black", label: "Archivo Black", hint: "Heavy, punchy", group: "Bold & impact", id: "archivoBlack", weight: 400, fallback: "Arial Black, sans-serif" },
  { key: "Poppins", label: "Poppins", hint: "Friendly bold", group: "Clean & modern", id: "poppins", weight: 800, fallback: "Arial, sans-serif" },
  { key: "Archivo", label: "Archivo", hint: "Clean, everyday", group: "Clean & modern", id: "archivo", weight: 600, fallback: "Arial, sans-serif" },
  { key: "Space Grotesk", label: "Space Grotesk", hint: "Techy, modern", group: "Clean & modern", id: "grotesk", weight: 700, fallback: "Arial, sans-serif" },
  { key: "Courier Prime", label: "Courier Prime", hint: "Typewriter", group: "Clean & modern", id: "courier", weight: 700, fallback: "Courier New, monospace" },
  { key: "Playfair Display", label: "Playfair", hint: "Elegant serif", group: "Serif & elegant", id: "playfair", weight: 700, fallback: "Georgia, serif" },
  { key: "DM Serif Display", label: "DM Serif", hint: "Editorial", group: "Serif & elegant", id: "dmSerif", weight: 400, fallback: "Georgia, serif" },
  { key: "Abril Fatface", label: "Abril Fatface", hint: "Fashion, magazine", group: "Serif & elegant", id: "abril", weight: 400, fallback: "Georgia, serif" },
  { key: "Cinzel", label: "Cinzel", hint: "Epic, classic", group: "Serif & elegant", id: "cinzel", weight: 700, fallback: "Georgia, serif" },
  { key: "Permanent Marker", label: "Marker", hint: "Handwritten marker", group: "Handwritten & script", id: "marker", weight: 400, fallback: "cursive" },
  { key: "Caveat", label: "Caveat", hint: "Casual handwriting", group: "Handwritten & script", id: "caveat", weight: 700, fallback: "cursive" },
  { key: "Pacifico", label: "Pacifico", hint: "Neon script", group: "Handwritten & script", id: "pacifico", weight: 400, fallback: "cursive" },
  { key: "Lobster", label: "Lobster", hint: "Retro script", group: "Handwritten & script", id: "lobster", weight: 400, fallback: "cursive" },
  { key: "Dancing Script", label: "Dancing Script", hint: "Elegant script", group: "Handwritten & script", id: "dancing", weight: 700, fallback: "cursive" },
  { key: "Bangers", label: "Bangers", hint: "Comic book", group: "Fun", id: "bangers", weight: 400, fallback: "Impact, sans-serif" },
  { key: "Press Start 2P", label: "Pixel", hint: "Retro game", group: "Fun", id: "pixel", weight: 400, fallback: "monospace" },
  { key: "Creepster", label: "Creepster", hint: "Horror", group: "Fun", id: "creepster", weight: 400, fallback: "fantasy" },
];

export const fontDef = (key: FontKey) => FONTS.find((f) => f.key === key) ?? FONTS[0];

/** Canvas font string for a selectable font; starts loading the font if it isn't yet. */
export function fontFace(key: FontKey, size: number) {
  const d = fontDef(key);
  ensureFont(d);
  return `${d.weight} ${size}px ${F[d.id]}, ${d.fallback}`;
}

// Only the core fonts load at startup; the rest load the first time they're drawn.
const ready = new Set<FamilyId>(["montserrat", "anton", "bebas", "cinzel", "archivo", "playfair"]);
const loading = new Set<FamilyId>();

function ensureFont(d: FontDef) {
  if (ready.has(d.id) || loading.has(d.id) || typeof document === "undefined") return;
  loading.add(d.id);
  document.fonts
    .load(`${d.weight} 40px ${F[d.id]}`)
    .catch(() => {})
    .then(() => {
      ready.add(d.id);
      loading.delete(d.id);
      notifyRedraw();
    });
}

/** Core faces, loaded before the first render. */
export const fontFaces = () => [
  `900 60px ${F.montserrat}`,
  `800 60px ${F.montserrat}`,
  `400 60px ${F.anton}`,
  `400 60px ${F.bebas}`,
  `700 60px ${F.cinzel}`,
  `700 60px ${F.playfair}`,
  `400 30px ${F.archivo}`,
  `500 30px ${F.archivo}`,
  `600 30px ${F.archivo}`,
  `700 30px ${F.archivo}`,
];
