// Canvas font families. next/font generates its own family names, so the
// editor registers them here on boot; the defaults match the plain Google names.
export const F = {
  montserrat: "Montserrat",
  anton: "Anton",
  bebas: '"Bebas Neue"',
  cinzel: "Cinzel",
  archivo: "Archivo",
};

export function setFontFamilies(families: Partial<typeof F>) {
  Object.assign(F, families);
}

/** Every face the renderers use, for document.fonts.load. */
export const fontFaces = () => [
  `900 60px ${F.montserrat}`,
  `800 60px ${F.montserrat}`,
  `400 60px ${F.anton}`,
  `400 60px ${F.bebas}`,
  `700 60px ${F.cinzel}`,
  `400 30px ${F.archivo}`,
  `500 30px ${F.archivo}`,
  `600 30px ${F.archivo}`,
  `700 30px ${F.archivo}`,
];
