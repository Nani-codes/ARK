import type { Core } from '@strapi/strapi';

import { migrateStatusColumns } from './bootstrap/migrate-status-columns';
import { CATALOG_PRODUCTS } from './data/catalog-seed';

const PUBLIC_ACTIONS = [
  { controller: 'category', action: 'find' },
  { controller: 'category', action: 'findOne' },
  { controller: 'product', action: 'find' },
  { controller: 'product', action: 'findOne' },
];

const AUTH_ACTIONS = [
  { controller: 'order', action: 'find' },
  { controller: 'order', action: 'findOne' },
  { controller: 'order', action: 'create' },
  { controller: 'quote-request', action: 'find' },
  { controller: 'quote-request', action: 'create' },
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
}

async function seedData(strapi: Core.Strapi) {
  const categoryCount = await strapi.db.query('api::category.category').count();
  if (categoryCount > 0) {
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

  for (const seed of CATALOG_PRODUCTS) {
    const categoryId = categoryMap[seed.categorySlug];
    if (!categoryId) {
      strapi.log.warn(`Skipping product ${seed.slug}: unknown category ${seed.categorySlug}`);
      continue;
    }
    const { categorySlug: _slug, ...productData } = seed;
    await strapi.documents('api::product.product').create({
      data: {
        ...productData,
        category: categoryId,
      },
    });
  }

  strapi.log.info(
    `Seeded ${categories.length} categories and ${CATALOG_PRODUCTS.length} products`
  );
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await migrateStatusColumns(strapi);
    await enablePermissions(strapi);
    await seedData(strapi);
  },
};
