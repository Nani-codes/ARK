/** Mirror of cms/src/api/order/utils/pricing.ts estimateDeliveryAt */
export function estimateDeliveryAt(from = new Date()): Date {
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

export const STANDARD_DELIVERY_ETA = '60–90 minutes';

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
