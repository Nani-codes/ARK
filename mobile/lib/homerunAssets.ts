/** Public CDN assets from https://home-run.co/ (for fallbacks when Strapi has no imageUrl). */
const CDN = 'https://home-run.co/cdn/shop/files';

export function homerunImage(file: string, width = 400) {
  return `${CDN}/${file}?width=${width}`;
}

export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  cement: homerunImage('cement_bulk.png?v=1779348262'),
  tiles: homerunImage('tiling_bulk.png?v=1779348284'),
  paints: homerunImage('painting.png?v=1770837387'),
  painting: homerunImage('painting.png?v=1770837387'),
  waterproofing: homerunImage('water_proofing.png?v=1770837873'),
  plywood: homerunImage('plywood_mdf_and_hdhmr.png?v=1770838150'),
  fevicol: homerunImage('fevicol.png?v=1770838170'),
  electric: homerunImage('wires.png?v=1770838188'),
  wires: homerunImage('wires.png?v=1770838188'),
  switches: homerunImage('switches_and_sockets.png?v=1770838213'),
  hardware: homerunImage('hinges_channels_and_handles.png?v=1770838232'),
  'kitchen-systems': homerunImage('kitchen_systems_and_accessories.png?v=1770838250'),
  wardrobe: homerunImage('wardrobe_and_bed_fittings.png?v=1770838287'),
  'door-locks': homerunImage('door_locks_and_hardware.png?v=1770838304'),
  steel: homerunImage('Web_Updated_Cement.webp?v=1779947459'),
  plumbing: homerunImage('cpvc_pipes_and_overhead_tanks.png?v=1770838378'),
  cpvc: homerunImage('cpvc_pipes_and_overhead_tanks.png?v=1770838378'),
  sanitary: homerunImage('sanitary_and_bath_fittings.png?v=1770838342'),
  lighting: homerunImage('lighting_97b07bd1-4bcd-42d6-9219-1c935855cd55.png?v=1770838359'),
  bricks: homerunImage('general_hardware_and_tools.png?v=1770838420'),
  tools: homerunImage('general_hardware_and_tools.png?v=1770838420'),
  conduits: homerunImage('conduits_and_gi_boxes.png?v=1770838323'),
  appliances: homerunImage('kitchen_and_home_appliances.png?v=1770838400'),
};

export function categoryImageUrl(slug: string, imageUrl?: string | null): string | undefined {
  if (imageUrl) return imageUrl;
  return CATEGORY_IMAGE_BY_SLUG[slug];
}

export const HOMERUN_TRUST = {
  delivery60: 'https://rivmorkxomnwzdlytbgv.supabase.co/storage/v1/object/public/files/b607ea-2b.myshopify.com/60-minutes.png',
  cod: 'https://rivmorkxomnwzdlytbgv.supabase.co/storage/v1/object/public/files/b607ea-2b.myshopify.com/cash-on-delivery.png',
};
