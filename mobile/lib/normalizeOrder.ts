import type { Order } from '@/lib/types';

/** Map legacy API field after schema rename (status → orderStatus). */
export function normalizeOrder(order: Order & { status?: Order['orderStatus'] }): Order {
  if (order.orderStatus) return order;
  if (order.status) {
    const { status, ...rest } = order;
    return { ...rest, orderStatus: status };
  }
  return { ...order, orderStatus: 'pending' };
}
