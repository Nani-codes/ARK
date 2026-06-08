/** Lightweight order status notification helper (local alert stub). */
export function notifyOrderStatusChange(orderNumber: string, status: string) {
  if (__DEV__) {
    console.log(`[ARK notify] Order ${orderNumber} → ${status}`);
  }
}
