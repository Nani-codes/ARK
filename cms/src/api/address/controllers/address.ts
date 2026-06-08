import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::address.address', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const addresses = await strapi.db.query('api::address.address').findMany({
      where: { user: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    const sanitized = await this.sanitizeOutput(addresses, ctx);
    return this.transformResponse(sanitized);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const address = await strapi.db.query('api::address.address').findOne({
      where: { documentId: id },
      populate: ['user'],
    });

    if (!address) return ctx.notFound('Address not found');
    if (address.user?.id !== user.id) return ctx.forbidden('Not your address');

    const sanitized = await this.sanitizeOutput(address, ctx);
    return this.transformResponse(sanitized);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { body = {} } = ctx.request;
    const data = body.data as Record<string, unknown> | undefined;
    if (!data) return ctx.badRequest('Missing data');

    data.user = user.id;

    if (data.isDefault) {
      await strapi.db.query('api::address.address').updateMany({
        where: { user: user.id },
        data: { isDefault: false },
      });
    }

    const entity = await strapi.service('api::address.address').create({ data });
    const sanitized = await this.sanitizeOutput(entity, ctx);
    ctx.status = 201;
    return this.transformResponse(sanitized);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const address = await strapi.db.query('api::address.address').findOne({
      where: { documentId: id },
      populate: ['user'],
    });

    if (!address) return ctx.notFound('Address not found');
    if (address.user?.id !== user.id) return ctx.forbidden('Not your address');

    const { body = {} } = ctx.request;
    const data = body.data as Record<string, unknown> | undefined;
    if (!data) return ctx.badRequest('Missing data');

    if (data.isDefault) {
      await strapi.db.query('api::address.address').updateMany({
        where: { user: user.id },
        data: { isDefault: false },
      });
    }

    const updated = await strapi.db.query('api::address.address').update({
      where: { id: address.id },
      data,
    });

    const sanitized = await this.sanitizeOutput(updated, ctx);
    return this.transformResponse(sanitized);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { id } = ctx.params;
    const address = await strapi.db.query('api::address.address').findOne({
      where: { documentId: id },
      populate: ['user'],
    });

    if (!address) return ctx.notFound('Address not found');
    if (address.user?.id !== user.id) return ctx.forbidden('Not your address');

    await strapi.db.query('api::address.address').delete({ where: { id: address.id } });
    return this.transformResponse({ documentId: id });
  },
}));
