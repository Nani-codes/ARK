import type { ImageSource } from 'expo-image';

/** Bundled category art (sourced from HomeRun public CDN, stored under assets/categories/). */
const CATEGORY_IMAGES: Record<string, ImageSource> = {
  cement: require('@/assets/categories/cement.png'),
  tiling: require('@/assets/categories/tiling.png'),
  tiles: require('@/assets/categories/tiling.png'),
  painting: require('@/assets/categories/painting.png'),
  paints: require('@/assets/categories/painting.png'),
  waterproofing: require('@/assets/categories/waterproofing.png'),
  plywood: require('@/assets/categories/plywood.png'),
  fevicol: require('@/assets/categories/fevicol.png'),
  wires: require('@/assets/categories/wires.png'),
  electric: require('@/assets/categories/wires.png'),
  switches: require('@/assets/categories/switches.png'),
  hinges: require('@/assets/categories/hinges.png'),
  hardware: require('@/assets/categories/hinges.png'),
  'kitchen-systems': require('@/assets/categories/kitchen-systems.png'),
  wardrobe: require('@/assets/categories/wardrobe.png'),
  steel: require('@/assets/categories/wardrobe.png'),
  'door-locks': require('@/assets/categories/door-locks.png'),
  conduits: require('@/assets/categories/conduits.png'),
  sanitary: require('@/assets/categories/sanitary.png'),
  plumbing: require('@/assets/categories/sanitary.png'),
  lighting: require('@/assets/categories/lighting.png'),
  cpvc: require('@/assets/categories/cpvc.png'),
  appliances: require('@/assets/categories/appliances.png'),
  'hardware-tools': require('@/assets/categories/hardware-tools.png'),
  bricks: require('@/assets/categories/hardware-tools.png'),
};

export function getCategoryImage(slug: string): ImageSource | undefined {
  return CATEGORY_IMAGES[slug];
}
