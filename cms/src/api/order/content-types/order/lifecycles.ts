import type { NotificationEvent } from '../../../../config/notification-templates';
import { formatEtaIst, formatInr, notifyUser } from '../../../../utils/notify-user';
import { normalizeOrderStatusField } from '../../utils/normalize-order-data';

type OrderRecord = {
  id?: number;
  orderNumber?: string;
  orderStatus?: string;
  estimatedDeliveryAt?: string;
  documentId?: string;
  total?: number | string;
  user?: { id?: number; username?: string; phone?: string } | number;
};

function resolveUserId(order: OrderRecord): number | undefined {
  if (typeof order.user === 'number') return order.user;
  return order.user?.id;
}

function phoneFromUsername(username?: string): string | undefined {
  if (username?.startsWith('user_')) {
    return username.replace('user_', '');
  }
  return undefined;
}

/** afterCreate result often omits relations — resolve user + phone for notifications. */
async function resolveOrderNotifyTarget(
  order: OrderRecord
): Promise<{ userId?: number; phone?: string }> {
  let userId = resolveUserId(order);
  let phone =
    typeof order.user === 'object' ? order.user?.phone : undefined;

  if (!userId || !phone) {
    const where = order.documentId
      ? { documentId: order.documentId }
      : order.id
        ? { id: order.id }
        : null;

    if (where) {
      const row = await strapi.db.query('api::order.order').findOne({
        where,
        populate: ['user'],
      });
      if (row) {
        userId = userId ?? resolveUserId(row as OrderRecord);
        const rowUser = (row as OrderRecord).user;
        if (typeof rowUser === 'object') {
          phone =
            phone ??
            rowUser?.phone ??
            phoneFromUsername(rowUser?.username);
        }
      }
    }
  }

  const ctx = strapi.requestContext.get();
  if (!userId && ctx?.state?.user?.id) {
    userId = ctx.state.user.id;
  }
  if (!phone) {
    phone =
      phoneFromUsername(ctx?.state?.user?.username) ??
      (ctx?.state?.user?.phone ? String(ctx.state.user.phone) : undefined);
  }

  return { userId, phone };
}

function orderStatusEvent(status?: string): NotificationEvent | null {
  switch (status) {
    case 'confirmed':
      return 'order_confirmed';
    case 'out_for_delivery':
      return 'order_out_for_delivery';
    case 'delivered':
      return 'order_delivered';
    case 'cancelled':
      return 'order_cancelled';
    default:
      return null;
  }
}

async function notifyOrderPlaced(order: OrderRecord) {
  if (!order.orderNumber) return;

  const { userId, phone } = await resolveOrderNotifyTarget(order);
  const eta = formatEtaIst(order.estimatedDeliveryAt);

  await notifyUser(strapi, {
    userId,
    phone,
    event: 'order_placed',
    variables: {
      '1': order.orderNumber,
      '2': formatInr(order.total),
      '3': eta || 'soon',
    },
    push: {
      title: `Order ${order.orderNumber}`,
      body: `Order placed successfully${eta ? `. ETA: ${eta}` : ''}`,
      data: {
        type: 'order_status',
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus ?? 'pending',
        orderDocumentId: order.documentId,
      },
    },
  });
}

async function notifyOrderStatusChange(order: OrderRecord) {
  if (!order.orderNumber || !order.orderStatus) return;

  const event = orderStatusEvent(order.orderStatus);
  if (!event) return;

  const { userId, phone } = await resolveOrderNotifyTarget(order);
  const eta = formatEtaIst(order.estimatedDeliveryAt);
  const statusLabel = order.orderStatus.replace(/_/g, ' ');
  const message = `Order ${order.orderNumber} is now ${statusLabel}${eta ? `. ETA: ${eta}` : ''}`;

  const variables: Record<string, string> = { '1': order.orderNumber };
  if (event === 'order_confirmed' || event === 'order_out_for_delivery') {
    variables['2'] = eta || 'soon';
  }

  await notifyUser(strapi, {
    userId,
    phone,
    event,
    variables,
    push: {
      title: `Order ${order.orderNumber}`,
      body: message,
      data: {
        type: 'order_status',
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        orderDocumentId: order.documentId,
      },
    },
  });
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

  async afterCreate(event) {
    const { result } = event;
    if (result) {
      await notifyOrderPlaced(result as OrderRecord);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    if (params?.data?.orderStatus && result?.orderStatus) {
      await notifyOrderStatusChange(result as OrderRecord);
    }
  },
};
