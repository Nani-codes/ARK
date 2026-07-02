import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::specialty.specialty', ({ strapi }) => ({
  async find(ctx) {
    const trade = typeof ctx.query.trade === 'string' ? ctx.query.trade.trim() : '';
    const where: Record<string, unknown> = {};
    if (trade) where.trade = trade;

    const specialties = await strapi.db.query('api::specialty.specialty').findMany({
      where,
      orderBy: { name: 'asc' },
    });

    ctx.send({
      data: specialties.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        trade: s.trade,
      })),
    });
  },
}));
