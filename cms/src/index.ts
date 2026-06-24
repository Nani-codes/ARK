import type { Core } from '@strapi/strapi';

import { migrateStatusColumns } from './bootstrap/migrate-status-columns';
import { CATALOG_PRODUCTS } from './data/catalog-seed';
import { KAJARIA_COLOUR_SWATCHES } from './data/variant-image-assets';
import { uploadLocalImage } from './utils/seed-media';
import { HYDERABAD_PINCODES } from './data/hyderabad-pincodes';

const PUBLIC_ACTIONS = [
  { controller: 'category', action: 'find' },
  { controller: 'category', action: 'findOne' },
  { controller: 'product', action: 'find' },
  { controller: 'product', action: 'findOne' },
  { controller: 'app-config', action: 'find' },
  { controller: 'home-banner', action: 'find' },
  { controller: 'home-banner', action: 'findOne' },
  { controller: 'serviceable-pincode', action: 'find' },
  { controller: 'user-profile', action: 'listProfessionals' },
  { controller: 'user-profile', action: 'getProfessional' },
];

const AUTH_ACTIONS = [
  { controller: 'order', action: 'find' },
  { controller: 'order', action: 'findOne' },
  { controller: 'order', action: 'create' },
  { controller: 'order', action: 'update' },
  { controller: 'quote-request', action: 'find' },
  { controller: 'quote-request', action: 'create' },
  { controller: 'address', action: 'find' },
  { controller: 'address', action: 'findOne' },
  { controller: 'address', action: 'create' },
  { controller: 'address', action: 'update' },
  { controller: 'address', action: 'delete' },
  { controller: 'return-request', action: 'find' },
  { controller: 'return-request', action: 'create' },
  { controller: 'user-profile', action: 'me' },
  { controller: 'user-profile', action: 'updateMe' },
];

async function ensurePermission(
  strapi: Core.Strapi,
  action: string,
  roleId: number
) {
  const permissionQuery = strapi.db.query('plugin::users-permissions.permission');
  const linkQuery = strapi.db.connection('up_permissions_role_lnk');

  let permission = await permissionQuery.findOne({ where: { action } });

  if (!permission) {
    permission = await permissionQuery.create({ data: { action } });
  }

  const existingLink = await linkQuery
    .where({ permission_id: permission.id, role_id: roleId })
    .first();

  if (!existingLink) {
    const countResult = await linkQuery.where({ role_id: roleId }).count('id as c');
    const ord =
      (typeof countResult === 'number'
        ? countResult
        : Number((countResult as { c?: number })?.c ?? 0)) + 1;
    await linkQuery.insert({
      permission_id: permission.id,
      role_id: roleId,
      permission_ord: ord,
    });
  }
}

async function enablePermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  });

  if (!publicRole || !authRole) return;

  for (const { controller, action } of PUBLIC_ACTIONS) {
    await ensurePermission(
      strapi,
      `api::${controller}.${controller}.${action}`,
      publicRole.id
    );
  }

  for (const { controller, action } of AUTH_ACTIONS) {
    await ensurePermission(
      strapi,
      `api::${controller}.${controller}.${action}`,
      authRole.id
    );
  }

  await ensurePermission(strapi, 'plugin::upload.content-api.upload', authRole.id);
}

async function seedAppConfig(strapi: Core.Strapi) {
  const existing = await strapi.db.query('api::app-config.app-config').findOne({});
  if (existing) return;

  await strapi.documents('api::app-config.app-config').create({
    data: {
      promoTitle: 'Free delivery on orders above ₹2,999',
      promoSubtitle: 'Hyderabad · 60–90 min delivery',
      promoCtaLabel: 'Shop Deals',
      promoCtaLink: '/search?q=cement',
      whatsappNumber: '919876543210',
      supportPhone: '18001234567',
      operatingHoursStart: 8,
      operatingHoursEnd: 20,
      faqs: [
        {
          q: 'What payment methods do you accept?',
          a: 'UPI, cards, NEFT, and Cash on Delivery (up to ₹50,000).',
        },
        {
          q: 'How fast is delivery in Hyderabad?',
          a: 'ASAP slots target 60–90 minutes. Scheduled 2-hour and next-day slots are also available.',
        },
        {
          q: 'Can I cancel my order?',
          a: 'Yes, within 10 minutes of placing a pending order.',
        },
        {
          q: 'Do you deliver to my pincode?',
          a: 'We serve 100+ Hyderabad pincodes. Enter your pincode at checkout to verify.',
        },
      ],
    },
  });
}

async function seedPincodes(strapi: Core.Strapi) {
  const count = await strapi.db.query('api::serviceable-pincode.serviceable-pincode').count();
  if (count >= HYDERABAD_PINCODES.length) return;

  for (const pincode of HYDERABAD_PINCODES) {
    const exists = await strapi.db.query('api::serviceable-pincode.serviceable-pincode').findOne({
      where: { pincode },
    });
    if (exists) continue;
    await strapi.documents('api::serviceable-pincode.serviceable-pincode').create({
      data: { pincode, city: 'Hyderabad', zone: 'GHMC', active: true },
    });
  }
  strapi.log.info(`Seeded ${HYDERABAD_PINCODES.length} serviceable pincodes`);
}

async function seedData(strapi: Core.Strapi) {
  const categoryCount = await strapi.db.query('api::category.category').count();
  if (categoryCount > 0) {
    await seedSupplementalProducts(strapi);
    return;
  }

  strapi.log.info('Seeding ARK catalog data...');

  const categories = [
    { name: 'Cement', slug: 'cement', sortOrder: 1 },
    { name: 'Tiling', slug: 'tiling', sortOrder: 2 },
    { name: 'Painting', slug: 'painting', sortOrder: 3 },
    { name: 'Waterproofing', slug: 'waterproofing', sortOrder: 4 },
    { name: 'Plywood & MDF', slug: 'plywood', sortOrder: 5 },
    { name: 'Fevicol', slug: 'fevicol', sortOrder: 6 },
    { name: 'Wires & Cables', slug: 'wires', sortOrder: 7 },
    { name: 'Switches & Sockets', slug: 'switches', sortOrder: 8 },
    { name: 'Hinges & Channels', slug: 'hinges', sortOrder: 9 },
    { name: 'Kitchen Systems', slug: 'kitchen-systems', sortOrder: 10 },
    { name: 'Wardrobe & Bed', slug: 'wardrobe', sortOrder: 11 },
    { name: 'Door Locks', slug: 'door-locks', sortOrder: 12 },
    { name: 'Conduits & GI', slug: 'conduits', sortOrder: 13 },
    { name: 'Sanitary & Bath', slug: 'sanitary', sortOrder: 14 },
    { name: 'Lighting', slug: 'lighting', sortOrder: 15 },
    { name: 'CPVC & Tanks', slug: 'cpvc', sortOrder: 16 },
    { name: 'Appliances', slug: 'appliances', sortOrder: 17 },
    { name: 'Hardware & Tools', slug: 'hardware-tools', sortOrder: 18 },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categories) {
    const created = await strapi.documents('api::category.category').create({
      data: cat,
    });
    categoryMap[cat.slug] = created.documentId;
  }

  let productCount = 0;
  for (const seed of CATALOG_PRODUCTS) {
    const categoryId = categoryMap[seed.categorySlug];
    if (!categoryId) {
      strapi.log.warn(`Skipping product ${seed.slug}: unknown category ${seed.categorySlug}`);
      continue;
    }
    const exists = await strapi.db.query('api::product.product').findOne({
      where: { slug: seed.slug },
    });
    if (exists) continue;

    const { categorySlug: _slug, ...productData } = seed;
    await strapi.documents('api::product.product').create({
      data: {
        ...productData,
        category: categoryId,
      },
    });
    productCount++;
  }

  strapi.log.info(
    `Seeded ${categories.length} categories and ${productCount} products`
  );
}

async function seedSupplementalProducts(strapi: Core.Strapi) {
  const categories = await strapi.db.query('api::category.category').findMany();
  const categoryMap = Object.fromEntries(
    categories.map((c: { slug: string; documentId: string }) => [c.slug, c.documentId])
  );

  let added = 0;
  for (const seed of CATALOG_PRODUCTS) {
    const existing = await strapi.db.query('api::product.product').findOne({
      where: { slug: seed.slug },
    });
    if (existing) continue;

    const categoryId = categoryMap[seed.categorySlug];
    if (!categoryId) continue;

    const { categorySlug: _slug, ...productData } = seed;
    await strapi.documents('api::product.product').create({
      data: { ...productData, category: categoryId },
    });
    added++;
  }
  if (added > 0) {
    strapi.log.info(`Added ${added} supplemental catalog products`);
  }
}

async function patchMultiVariantCatalog(strapi: Core.Strapi) {
  const multiVariantSlugs = ['kajaria-vitrified-tile'] as const;

  for (const slug of multiVariantSlugs) {
    const seed = CATALOG_PRODUCTS.find((p) => p.slug === slug);
    if (!seed?.variantOptionGroups?.length || !seed.variants?.length) continue;

    const existing = await strapi.db.query('api::product.product').findOne({ where: { slug } });
    if (!existing?.documentId) continue;

    const hasGroups =
      Array.isArray(existing.variantOptionGroups) && existing.variantOptionGroups.length > 0;
    if (hasGroups) continue;

    const { categorySlug: _slug, ...productData } = seed;
    await strapi.documents('api::product.product').update({
      documentId: existing.documentId,
      data: {
        variantOptionGroups: productData.variantOptionGroups,
        autoBuildVariants: productData.autoBuildVariants ?? false,
        variants: productData.variants,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
      },
    });
    strapi.log.info(`Patched multi-variant options for ${slug}`);
  }
}

type VariantRowDb = {
  label?: string;
  optionKey?: string;
  price?: number;
  compareAtPrice?: number;
  image?: { id?: number } | number | null;
  choices?: Array<{ groupName?: string; choice?: string }>;
  options?: Record<string, string>;
};

function choiceValue(row: VariantRowDb, groupName: string): string | undefined {
  const fromChoices = row.choices?.find((c) => c.groupName === groupName)?.choice?.trim();
  if (fromChoices) return fromChoices;
  return row.options?.[groupName]?.trim();
}

/** Attach per-colour swatch images to Kajaria tile variants (for Flipkart-style picker). */
async function patchVariantSwatchImages(strapi: Core.Strapi) {
  const slug = 'kajaria-vitrified-tile';
  const existing = await strapi.db.query('api::product.product').findOne({
    where: { slug },
    populate: {
      variants: {
        populate: ['image', 'choices'],
      },
    },
  });

  if (!existing?.documentId) return;

  const variants = (existing.variants ?? []) as VariantRowDb[];
  if (!variants.length) return;

  const hasImages = variants.some((v) => {
    if (!v.image) return false;
    if (typeof v.image === 'number') return true;
    return Boolean(v.image.id);
  });
  if (hasImages) return;

  const mediaByColour: Record<string, number> = {};
  for (const [colour, meta] of Object.entries(KAJARIA_COLOUR_SWATCHES)) {
    const id = await uploadLocalImage(
      strapi,
      meta.file,
      meta.fileName,
      meta.mime,
      meta.alt
    );
    if (id) mediaByColour[colour] = id;
  }

  if (!Object.keys(mediaByColour).length) {
    strapi.log.warn('patchVariantSwatchImages: no images uploaded');
    return;
  }

  const nextVariants = variants.map((row) => {
    const colour = choiceValue(row, 'Colour');
    const imageId = colour ? mediaByColour[colour] : undefined;
    const payload: Record<string, unknown> = {
      label: row.label,
      optionKey: row.optionKey,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      choices: row.choices,
    };
    if (imageId) payload.image = imageId;
    return payload;
  });

  const heroImageId = mediaByColour['Matte Grey'] ?? Object.values(mediaByColour)[0];

  await strapi.documents('api::product.product').update({
    documentId: existing.documentId,
    data: {
      variants: nextVariants as never,
      image: heroImageId,
    },
  });

  strapi.log.info(`Patched variant swatch images for ${slug}`);
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await migrateStatusColumns(strapi);
    await enablePermissions(strapi);
    await seedAppConfig(strapi);
    await seedPincodes(strapi);
    await seedData(strapi);
    await patchMultiVariantCatalog(strapi);
    await patchVariantSwatchImages(strapi);
  },
};
