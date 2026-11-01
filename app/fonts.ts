import localFont from "next/font/local";
import type { FamilyId } from "@/lib/render/fonts";

// Self-hosted Latin subsets (all SIL Open Font License), downloaded from Google Fonts.
// Bundled rather than fetched at build time: Google now serves query-string font URLs
// that Next's Turbopack font loader cannot resolve, which broke production builds.
// Core fonts preload; the extra styles (preload: false) download only when someone picks them.
// next/font reads these options at build time, so each call must be a plain object literal.
export const montserrat = localFont({ src: "./fonts/Montserrat-latin.woff2", weight: "100 900", variable: "--font-montserrat" });
export const anton = localFont({ src: "./fonts/Anton-latin.woff2", weight: "400", variable: "--font-anton" });
export const bebas = localFont({ src: "./fonts/BebasNeue-latin.woff2", weight: "400", variable: "--font-bebas" });
export const cinzel = localFont({ src: "./fonts/Cinzel-latin.woff2", weight: "400 900", variable: "--font-cinzel" });
export const playfair = localFont({ src: "./fonts/PlayfairDisplay-latin.woff2", weight: "400 900", variable: "--font-playfair" });
export const archivo = localFont({ src: "./fonts/Archivo-latin.woff2", weight: "100 900", variable: "--font-archivo" });

const oswald = localFont({ preload: false, src: "./fonts/Oswald-latin.woff2", weight: "200 700", variable: "--font-oswald" });
const poppins = localFont({
  preload: false,
  src: [
    { path: "./fonts/Poppins-400-latin.woff2", weight: "400" },
    { path: "./fonts/Poppins-600-latin.woff2", weight: "600" },
    { path: "./fonts/Poppins-800-latin.woff2", weight: "800" },
  ],
  variable: "--font-poppins",
});
const archivoBlack = localFont({ preload: false, src: "./fonts/ArchivoBlack-latin.woff2", weight: "400", variable: "--font-archivo-black" });
const bangers = localFont({ preload: false, src: "./fonts/Bangers-latin.woff2", weight: "400", variable: "--font-bangers" });
const marker = localFont({ preload: false, src: "./fonts/PermanentMarker-latin.woff2", weight: "400", variable: "--font-marker" });
const caveat = localFont({ preload: false, src: "./fonts/Caveat-latin.woff2", weight: "400 700", variable: "--font-caveat" });
const pacifico = localFont({ preload: false, src: "./fonts/Pacifico-latin.woff2", weight: "400", variable: "--font-pacifico" });
const lobster = localFont({ preload: false, src: "./fonts/Lobster-latin.woff2", weight: "400", variable: "--font-lobster" });
const dancing = localFont({ preload: false, src: "./fonts/DancingScript-latin.woff2", weight: "400 700", variable: "--font-dancing" });
const courier = localFont({
  preload: false,
  src: [
    { path: "./fonts/CourierPrime-400-latin.woff2", weight: "400" },
    { path: "./fonts/CourierPrime-700-latin.woff2", weight: "700" },
  ],
  variable: "--font-courier",
});
const abril = localFont({ preload: false, src: "./fonts/AbrilFatface-latin.woff2", weight: "400", variable: "--font-abril" });
const dmSerif = localFont({ preload: false, src: "./fonts/DMSerifDisplay-latin.woff2", weight: "400", variable: "--font-dm-serif" });
const pixel = localFont({ preload: false, src: "./fonts/PressStart2P-latin.woff2", weight: "400", variable: "--font-pixel" });
const creepster = localFont({ preload: false, src: "./fonts/Creepster-latin.woff2", weight: "400", variable: "--font-creepster" });
const grotesk = localFont({ preload: false, src: "./fonts/SpaceGrotesk-latin.woff2", weight: "300 700", variable: "--font-grotesk" });

const ALL = {
  montserrat, anton, bebas, cinzel, archivo, playfair, oswald, poppins, archivoBlack, bangers, marker, caveat, pacifico, lobster, dancing,
  courier, abril, dmSerif, pixel, creepster, grotesk,
} satisfies Record<FamilyId, { variable: string; style: { fontFamily: string } }>;

export const fontVariables = Object.values(ALL).map((f) => f.variable).join(" ");

/** Family names next/font generated, for the canvas renderers. */
export const canvasFamilies = Object.fromEntries(Object.entries(ALL).map(([id, f]) => [id, f.style.fontFamily])) as Record<FamilyId, string>;

/** CSS font-family for showing a font in the UI (the font picker). */
export const cssFamily = (id: FamilyId) => ALL[id].style.fontFamily;
