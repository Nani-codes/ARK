export const GST_RATE = 0.18;
export const COD_MAX_TOTAL = 50_000;
export const CANCEL_WINDOW_MS = 10 * 60 * 1000;

/** Tiered delivery fees (Hyderabad). */
export const DELIVERY_FEE_TIERS = {
  low: 199,
  mid: 99,
  freeThreshold: 2999,
  midThreshold: 999,
} as const;

export function calcSubtotal(
  items: Array<{ unitPrice: number; quantity: number }>
) {
  return items.reduce((sum, i) => sum + Number(i.unitPrice) * Number(i.quantity), 0);
}

export function calcTaxes(subtotal: number) {
  return Math.round(subtotal * GST_RATE * 100) / 100;
}

export function calcDeliveryFee(subtotal: number) {
  if (subtotal >= DELIVERY_FEE_TIERS.freeThreshold) return 0;
  if (subtotal >= DELIVERY_FEE_TIERS.midThreshold) return DELIVERY_FEE_TIERS.mid;
  return DELIVERY_FEE_TIERS.low;
}

export function calcTotal(subtotal: number, deliveryFee = 0) {
  const taxes = calcTaxes(subtotal);
  return Math.round((subtotal + taxes + deliveryFee) * 100) / 100;
}

export function isWithinOperatingHours(startHour = 8, endHour = 20) {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + istOffset) % (24 * 60);
  const hour = Math.floor(istMinutes / 60);
  return hour >= startHour && hour < endHour;
}

export function estimateDeliveryAt(from = new Date()) {
  return new Date(from.getTime() + 90 * 60 * 1000);
}
