import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quote-request.quote-request', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const quotes = await strapi.db.query('api::quote-request.quote-request').findMany({
      where: { user: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = await this.sanitizeOutput(quotes, ctx);
    return this.transformResponse(sanitized);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { body = {} } = ctx.request;
    const data = body.data as Record<string, unknown> | undefined;
    if (!data) return ctx.badRequest('Missing data');

    data.user = user.id;

    const entity = await strapi.service('api::quote-request.quote-request').create({ data });
    const sanitized = await this.sanitizeOutput(entity, ctx);
    ctx.status = 201;
    return this.transformResponse(sanitized);
  },
}));
