import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::return-request.return-request', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const requests = await strapi.db.query('api::return-request.return-request').findMany({
      where: { user: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = await this.sanitizeOutput(requests, ctx);
    return this.transformResponse(sanitized);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const { body = {} } = ctx.request;
    const data = body.data as Record<string, unknown> | undefined;
    if (!data) return ctx.badRequest('Missing data');

    data.user = user.id;

    const entity = await strapi.service('api::return-request.return-request').create({ data });
    const sanitized = await this.sanitizeOutput(entity, ctx);
    ctx.status = 201;
    return this.transformResponse(sanitized);
  },
}));
