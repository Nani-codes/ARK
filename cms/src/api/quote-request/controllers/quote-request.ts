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
}));
