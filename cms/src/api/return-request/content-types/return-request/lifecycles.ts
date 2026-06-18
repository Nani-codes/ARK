import type { NotificationEvent } from '../../../../config/notification-templates';
import { notifyUser } from '../../../../utils/notify-user';

type ReturnRecord = {
  orderNumber?: string;
  productName?: string;
  returnStatus?: string;
  user?: { id?: number } | number;
};

function returnStatusEvent(status?: string): NotificationEvent | null {
  switch (status) {
    case 'approved':
      return 'return_approved';
    case 'rejected':
      return 'return_rejected';
    case 'completed':
      return 'return_completed';
    default:
      return null;
  }
}

function resolveUserId(record: ReturnRecord): number | undefined {
  if (typeof record.user === 'number') return record.user;
  return record.user?.id;
}

async function notifyReturnReceived(record: ReturnRecord) {
  if (!record.orderNumber || !record.productName) return;

  await notifyUser(strapi, {
    userId: resolveUserId(record),
    event: 'return_received',
    variables: {
      '1': record.orderNumber,
      '2': record.productName,
    },
  });
}

async function notifyReturnStatusChange(record: ReturnRecord) {
  if (!record.orderNumber || !record.returnStatus) return;

  const event = returnStatusEvent(record.returnStatus);
  if (!event) return;

  await notifyUser(strapi, {
    userId: resolveUserId(record),
    event,
    variables: {
      '1': record.orderNumber,
    },
  });
}

export default {
  async afterCreate(event) {
    const { result } = event;
    if (result) {
      await notifyReturnReceived(result as ReturnRecord);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    if (params?.data?.returnStatus && result?.returnStatus) {
      await notifyReturnStatusChange(result as ReturnRecord);
    }
  },
};
