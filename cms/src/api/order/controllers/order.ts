import { factories } from '@strapi/strapi';

import { normalizeOrderStatusField } from '../utils/normalize-order-data';
import {
  CANCEL_WINDOW_MS,
  estimateDeliveryAt,
} from '../utils/pricing';
import { validateAndPriceOrder } from '../utils/validate-order';

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

    try {
      const priced = await validateAndPriceOrder(strapi, data);
      Object.assign(data, priced);
    } catch (e) {
      if (e instanceof Error && 'name' in e && (e as { name: string }).name === 'ValidationError') {
        return ctx.badRequest(e.message);
      }
      throw e;
    }

    const now = new Date();
    data.cancelUntil = new Date(now.getTime() + CANCEL_WINDOW_MS).toISOString();
    const slot = (data.deliverySlot as string) ?? 'asap';
    data.estimatedDeliveryAt = estimateDeliveryAt(slot).toISOString();

    if (data.paymentMethod === 'online') {
      data.paymentStatus = data.razorpayPaymentId ? 'paid' : 'pending';
    } else if (data.paymentMethod === 'cod') {
      data.paymentStatus = 'pending';
    }

    await this.validateInput(data, ctx);
    const sanitizedInputData = (await this.sanitizeInput(data, ctx)) as Record<string, unknown>;
    sanitizedInputData.user = user.id;

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

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { id } = ctx.params;
    const order = await strapi.db.query('api::order.order').findOne({
      where: { documentId: id },
      populate: ['user'],
    });

    if (!order) {
      return ctx.notFound('Order not found');
    }

    if (order.user?.id !== user.id) {
      return ctx.forbidden('You can only update your own orders');
    }

    const { body = {} } = ctx.request;
    const data = body.data as Record<string, unknown> | undefined;
    if (!data) {
      return ctx.badRequest('Missing data');
    }

    if (data.orderStatus && data.orderStatus !== 'cancelled') {
      return ctx.forbidden('Customers can only cancel orders');
    }
    if (data.orderStatus === 'cancelled') {
      if (order.orderStatus !== 'pending') {
        return ctx.badRequest('Only pending orders can be cancelled');
      }
      if (order.cancelUntil && new Date() > new Date(order.cancelUntil)) {
        return ctx.badRequest('Cancellation window has expired (10 minutes after placing order)');
      }
    }

    const updated = await strapi.db.query('api::order.order').update({
      where: { id: order.id },
      data: { orderStatus: 'cancelled' },
      populate: ['items'],
    });

    const sanitized = await this.sanitizeOutput(updated, ctx);
    return this.transformResponse(sanitized);
  },
}));
