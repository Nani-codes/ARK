/** Category images sourced from https://home-run.co/ (Shopify CDN). */
const CDN = 'https://home-run.co/cdn/shop/files';

function img(file: string, width = 400) {
  return `${CDN}/${file}?width=${width}`;
}

export type HomerunCategorySeed = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  imageUrl: string;
};

/** HomeRun homepage category grid + ARK catalog slugs. */
export const HOMERUN_CATEGORIES: HomerunCategorySeed[] = [
  { name: 'Cement', slug: 'cement', icon: 'precision_manufacturing', sortOrder: 1, imageUrl: img('cement_bulk.png?v=1779348262') },
  { name: 'Tiling', slug: 'tiles', icon: 'grid_on', sortOrder: 2, imageUrl: img('tiling_bulk.png?v=1779348284') },
  { name: 'Painting', slug: 'paints', icon: 'format_paint', sortOrder: 3, imageUrl: img('painting.png?v=1770837387') },
  { name: 'Waterproofing', slug: 'waterproofing', icon: 'water_drop', sortOrder: 4, imageUrl: img('water_proofing.png?v=1770837873') },
  { name: 'Plywood & Boards', slug: 'plywood', icon: 'layers', sortOrder: 5, imageUrl: img('plywood_mdf_and_hdhmr.png?v=1770838150') },
  { name: 'Fevicol', slug: 'fevicol', icon: 'science', sortOrder: 6, imageUrl: img('fevicol.png?v=1770838170') },
  { name: 'Wires & Cables', slug: 'electric', icon: 'bolt', sortOrder: 7, imageUrl: img('wires.png?v=1770838188') },
  { name: 'Switches & Sockets', slug: 'switches', icon: 'electrical_services', sortOrder: 8, imageUrl: img('switches_and_sockets.png?v=1770838213') },
  { name: 'Hinges & Channels', slug: 'hardware', icon: 'hardware', sortOrder: 9, imageUrl: img('hinges_channels_and_handles.png?v=1770838232') },
  { name: 'Kitchen Systems', slug: 'kitchen-systems', icon: 'kitchen', sortOrder: 10, imageUrl: img('kitchen_systems_and_accessories.png?v=1770838250') },
  { name: 'Wardrobe Fittings', slug: 'wardrobe', icon: 'checkroom', sortOrder: 11, imageUrl: img('wardrobe_and_bed_fittings.png?v=1770838287') },
  { name: 'Door Locks', slug: 'door-locks', icon: 'lock', sortOrder: 12, imageUrl: img('door_locks_and_hardware.png?v=1770838304') },
  { name: 'Steel & TMT', slug: 'steel', icon: 'architecture', sortOrder: 13, imageUrl: img('Web_Updated_Cement.webp?v=1779947459') },
  { name: 'Plumbing & CPVC', slug: 'plumbing', icon: 'plumbing', sortOrder: 14, imageUrl: img('cpvc_pipes_and_overhead_tanks.png?v=1770838378') },
  { name: 'Sanitary & Bath', slug: 'sanitary', icon: 'bathtub', sortOrder: 15, imageUrl: img('sanitary_and_bath_fittings.png?v=1770838342') },
  { name: 'Lighting', slug: 'lighting', icon: 'lightbulb', sortOrder: 16, imageUrl: img('lighting_97b07bd1-4bcd-42d6-9219-1c935855cd55.png?v=1770838359') },
  { name: 'Bricks & Blocks', slug: 'bricks', icon: 'square_foot', sortOrder: 17, imageUrl: img('general_hardware_and_tools.png?v=1770838420') },
  { name: 'Hardware & Tools', slug: 'tools', icon: 'build', sortOrder: 18, imageUrl: img('general_hardware_and_tools.png?v=1770838420') },
];

export const HOMERUN_BANNERS = {
  trust: `${CDN}/bannertrusthome.webp?v=1750849983&width=1200`,
  guarantee: `${CDN}/app2.webp?v=1770105026&width=1200`,
  cementHero: `${CDN}/Web_Updated_Cement.webp?v=1779947459&width=800`,
};
