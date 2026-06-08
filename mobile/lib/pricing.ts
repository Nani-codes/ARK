/** GST rate applied to construction materials (inclusive pricing model). */
export const GST_RATE = 0.18;

export const GST_LABEL = '18% GST';

export const DELIVERY_FEE_TIERS = {
  low: 199,
  mid: 99,
  freeThreshold: 2999,
  midThreshold: 999,
} as const;

export function calcSubtotal(lines: Array<{ unitPrice: number; quantity: number }>) {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function calcTaxes(subtotal: number) {
  return Math.round(subtotal * GST_RATE * 100) / 100;
}

export function calcDeliveryFee(subtotal: number) {
  if (subtotal >= DELIVERY_FEE_TIERS.freeThreshold) return 0;
  if (subtotal >= DELIVERY_FEE_TIERS.midThreshold) return DELIVERY_FEE_TIERS.mid;
  return DELIVERY_FEE_TIERS.low;
}

export function calcTotal(subtotal: number, taxes?: number, deliveryFee = 0) {
  return subtotal + (taxes ?? calcTaxes(subtotal)) + deliveryFee;
}

/** Max order total eligible for Cash on Delivery. */
export const COD_MAX_TOTAL = 50_000;

export function isWithinOperatingHours(startHour = 8, endHour = 20) {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + istOffset) % (24 * 60);
  const hour = Math.floor(istMinutes / 60);
  return hour >= startHour && hour < endHour;
}

export function deliveryFeeLabel(subtotal: number) {
  const fee = calcDeliveryFee(subtotal);
  if (fee === 0) return 'Free delivery';
  return `₹${fee} delivery`;
}
