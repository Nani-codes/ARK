import { colors } from '@/lib/theme';
import type { Order } from '@/lib/types';

export const ORDER_STATUS_STYLES: Record<
  Order['orderStatus'],
  { bg: string; text: string; label: string }
> = {
  pending: { bg: colors.surfaceContainerHigh, text: colors.onSurfaceVariant, label: 'Pending' },
  confirmed: { bg: colors.primaryContainer, text: '#ffb800', label: 'Confirmed' },
  out_for_delivery: { bg: '#ffb800', text: colors.primaryContainer, label: 'Out for Delivery' },
  delivered: { bg: colors.successBg, text: colors.success, label: 'Delivered' },
};

export const PAYMENT_METHOD_LABELS: Record<Order['paymentMethod'], string> = {
  neft: 'Bank Transfer (NEFT/RTGS)',
  cod: 'Cash on Delivery (COD)',
};

export function formatOrderDate(createdAt: string, withTime = false) {
  return new Date(createdAt).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function orderDisplayNumber(orderNumber?: string) {
  return orderNumber?.replace('ORD-', '') ?? '—';
}
