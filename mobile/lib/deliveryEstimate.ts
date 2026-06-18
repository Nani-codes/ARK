import type { DeliverySlot } from '@/lib/types';

/** Mirror of cms/src/api/order/utils/pricing.ts estimateDeliveryAt */
export function estimateDeliveryAt(slot: DeliverySlot, from = new Date()): Date {
  if (slot === 'next_day') {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    return next;
  }
  if (slot === 'two_hour') {
    return new Date(from.getTime() + 2 * 60 * 60 * 1000);
  }
  return new Date(from.getTime() + 90 * 60 * 1000);
}

export function formatDeliveryEta(date: Date): string {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function slotEtaSummary(slot: DeliverySlot): string {
  if (slot === 'next_day') return 'Tomorrow by 10:00 AM';
  if (slot === 'two_hour') return 'Within 2 hours';
  return '60–90 minutes';
}

export function orderSuccessEtaMessage(estimatedDeliveryAt?: string | null): string {
  if (!estimatedDeliveryAt) {
    return 'Your construction materials are being packed. We will share delivery updates shortly.';
  }
  const eta = new Date(estimatedDeliveryAt);
  if (Number.isNaN(eta.getTime())) {
    return 'Your construction materials are being packed. We will share delivery updates shortly.';
  }
  return `Your construction materials are being packed. Estimated delivery by ${formatDeliveryEta(eta)}.`;
}
