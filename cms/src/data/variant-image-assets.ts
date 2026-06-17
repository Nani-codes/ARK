/** Local swatch files — uploaded into Strapi media on bootstrap (no remote URLs). */
export type VariantImageAsset = {
  /** Filename inside cms/seed-assets/ */
  file: string;
  fileName: string;
  alt: string;
  mime: string;
};

export const KAJARIA_COLOUR_SWATCHES: Record<string, VariantImageAsset> = {
  'Matte Grey': {
    file: 'kajaria-matte-grey-swatch.png',
    fileName: 'kajaria-matte-grey-swatch.png',
    alt: 'Matte Grey vitrified tile',
    mime: 'image/png',
  },
  'Gloss White': {
    file: 'kajaria-gloss-white-swatch.png',
    fileName: 'kajaria-gloss-white-swatch.png',
    alt: 'Gloss White vitrified tile',
    mime: 'image/png',
  },
  Beige: {
    file: 'kajaria-beige-swatch.png',
    fileName: 'kajaria-beige-swatch.png',
    alt: 'Beige vitrified tile',
    mime: 'image/png',
  },
};
