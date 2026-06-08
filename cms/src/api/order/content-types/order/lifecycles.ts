import { normalizeOrderStatusField } from '../../utils/normalize-order-data';

async function sendSms(phone: string, message: string) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey) {
    strapi.log.info(`[SMS stub] +91${phone}: ${message}`);
    return;
  }

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        recipients: [{ mobiles: `91${phone}`, message }],
      }),
    });
    if (!res.ok) {
      strapi.log.warn(`MSG91 failed: ${await res.text()}`);
    }
  } catch (e) {
    strapi.log.error('MSG91 error', e);
  }
}

/** Notify customer on order status change (SMS + push token log). */
async function notifyOrderStatusChange(
  order: {
    orderNumber?: string;
    orderStatus?: string;
    estimatedDeliveryAt?: string;
  },
  userId?: number
) {
  if (!order.orderNumber || !order.orderStatus) return;

  let phone: string | undefined;
  if (userId) {
    const user = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { id: userId } });
    phone = user?.username?.replace('user_', '');
  }

  const eta = order.estimatedDeliveryAt
    ? new Date(order.estimatedDeliveryAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : '';
  const message = `ARK: Order ${order.orderNumber} is now ${order.orderStatus.replace(/_/g, ' ')}${eta ? `. ETA: ${eta}` : ''}`;

  if (phone) {
    await sendSms(phone, message);
  } else {
    strapi.log.info(`[SMS] ${message}`);
  }

  strapi.log.info(`[push-stub] Would notify user ${userId} about ${order.orderNumber}`);
}

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    normalizeOrderStatusField(data);

    const ctx = strapi.requestContext.get();

    if (ctx?.state?.user) {
      data.user = ctx.state.user.id;
    }

    if (!data.orderNumber) {
      data.orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    }
  },

  async beforeUpdate(event) {
    normalizeOrderStatusField(event.params.data);
  },

  async afterUpdate(event) {
    const { result, params } = event;
    if (params?.data?.orderStatus && result?.orderStatus) {
      const userId = result.user?.id ?? result.user;
      await notifyOrderStatusChange(result, userId);
    }
  },
};
