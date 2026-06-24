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
  cancelled: { bg: colors.errorContainer, text: colors.error, label: 'Cancelled' },
};

export const QUOTE_STATUS_STYLES: Record<
  import('@/lib/types').QuoteRequest['quoteStatus'],
  { bg: string; text: string; label: string }
> = {
  new: { bg: colors.surfaceContainerHigh, text: colors.onSurfaceVariant, label: 'Submitted' },
  contacted: { bg: colors.primaryContainer, text: '#ffb800', label: 'Contacted' },
  quoted: { bg: colors.secondaryContainer, text: colors.primary, label: 'Quoted' },
  closed: { bg: colors.successBg, text: colors.success, label: 'Closed' },
};

export const NEFT_BANK_DETAILS = {
  bankName: 'HDFC Bank',
  accountName: 'ARK Procurement Pvt Ltd',
  accountNumber: '50200012345678',
  ifsc: 'HDFC0001234',
  branch: 'Banjara Hills, Hyderabad',
};

export const PAYMENT_METHOD_LABELS: Record<Order['paymentMethod'], string> = {
  neft: 'Bank Transfer (NEFT/RTGS)',
  cod: 'Cash on Delivery (COD)',
  online: 'Pay Online (UPI / Cards)',
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
