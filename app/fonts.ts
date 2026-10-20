import { Anton, Archivo, Bebas_Neue, Cinzel, Montserrat } from "next/font/google";

export const montserrat = Montserrat({ weight: ["800", "900"], subsets: ["latin"], variable: "--font-montserrat" });
export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
export const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
export const cinzel = Cinzel({ weight: "700", subsets: ["latin"], variable: "--font-cinzel" });
export const archivo = Archivo({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-archivo" });

export const fontVariables = [montserrat, anton, bebas, cinzel, archivo].map((f) => f.variable).join(" ");

/** Family names next/font generated, for the canvas renderers. */
export const canvasFamilies = {
  montserrat: montserrat.style.fontFamily,
  anton: anton.style.fontFamily,
  bebas: bebas.style.fontFamily,
  cinzel: cinzel.style.fontFamily,
  archivo: archivo.style.fontFamily,
};
