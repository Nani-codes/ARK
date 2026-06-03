/** Strapi reserves `status` for draft/publish — accept legacy `status` from older app builds. */
export function normalizeOrderStatusField(data: Record<string, unknown> | undefined) {
  if (!data || typeof data !== 'object') return;

  if (data.status !== undefined && data.status !== null) {
    if (data.orderStatus === undefined) {
      data.orderStatus = data.status;
    }
    delete data.status;
  }
}
