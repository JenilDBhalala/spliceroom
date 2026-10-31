import localFont from "next/font/local";

// Self-hosted Latin subsets (all SIL Open Font License), downloaded from Google Fonts.
// Bundled rather than fetched at build time: Google now serves query-string font URLs
// that Next's Turbopack font loader cannot resolve, which broke production builds.
export const montserrat = localFont({ src: "./fonts/Montserrat-latin.woff2", weight: "800 900", variable: "--font-montserrat" });
export const anton = localFont({ src: "./fonts/Anton-latin.woff2", weight: "400", variable: "--font-anton" });
export const bebas = localFont({ src: "./fonts/BebasNeue-latin.woff2", weight: "400", variable: "--font-bebas" });
export const cinzel = localFont({ src: "./fonts/Cinzel-latin.woff2", weight: "700", variable: "--font-cinzel" });
export const playfair = localFont({ src: "./fonts/PlayfairDisplay-latin.woff2", weight: "700", variable: "--font-playfair" });
export const archivo = localFont({ src: "./fonts/Archivo-latin.woff2", weight: "400 700", variable: "--font-archivo" });

export const fontVariables = [montserrat, anton, bebas, cinzel, playfair, archivo].map((f) => f.variable).join(" ");

/** Family names next/font generated, for the canvas renderers. */
export const canvasFamilies = {
  montserrat: montserrat.style.fontFamily,
  anton: anton.style.fontFamily,
  bebas: bebas.style.fontFamily,
  cinzel: cinzel.style.fontFamily,
  archivo: archivo.style.fontFamily,
  playfair: playfair.style.fontFamily,
};
