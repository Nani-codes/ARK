import { factories } from '@strapi/strapi';

import { normalizeOrderStatusField } from '../utils/normalize-order-data';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    await this.validateQuery(ctx);
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const { body = {} } = ctx.request;

    if (!body.data || typeof body.data !== 'object') {
      return ctx.badRequest('Missing "data" payload in the request body');
    }

    const data = body.data as Record<string, unknown>;
    normalizeOrderStatusField(data);

    if (!data.orderNumber) {
      data.orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    }

    await this.validateInput(data, ctx);
    const sanitizedInputData = await this.sanitizeInput(data, ctx);
    const entity = await strapi.service('api::order.order').create({
      ...sanitizedQuery,
      data: sanitizedInputData,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    ctx.status = 201;
    return this.transformResponse(sanitizedEntity);
  },

  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const orders = await strapi.db.query('api::order.order').findMany({
      where: { user: user.id },
      populate: ['items'],
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = await this.sanitizeOutput(orders, ctx);
    return this.transformResponse(sanitized);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { id } = ctx.params;
    const order = await strapi.db.query('api::order.order').findOne({
      where: { documentId: id },
      populate: ['user', 'items'],
    });

    if (!order) {
      return ctx.notFound('Order not found');
    }

    if (order.user?.id !== user.id) {
      return ctx.forbidden('You can only view your own orders');
    }

    const sanitized = await this.sanitizeOutput(order, ctx);
    return this.transformResponse(sanitized);
  },
}));
