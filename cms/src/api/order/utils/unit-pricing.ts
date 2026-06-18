type PricingTierRow = { minQty?: number; unitPrice?: number | string };

export function resolveUnitPrice(
  basePrice: number,
  quantity: number,
  tiers?: PricingTierRow[] | null
): number {
  if (!tiers?.length || quantity < 1) return basePrice;

  const sorted = [...tiers].sort(
    (a, b) => Number(b.minQty ?? 0) - Number(a.minQty ?? 0)
  );

  for (const tier of sorted) {
    const minQty = Number(tier.minQty);
    const unitPrice = Number(tier.unitPrice);
    if (minQty >= 2 && quantity >= minQty && unitPrice > 0) {
      return unitPrice;
    }
  }

  return basePrice;
}

export function pickPricingTiers(
  variant?: { pricingTiers?: PricingTierRow[] | null },
  product?: { pricingTiers?: PricingTierRow[] | null }
): PricingTierRow[] | undefined {
  if (variant?.pricingTiers?.length) return variant.pricingTiers;
  if (product?.pricingTiers?.length) return product.pricingTiers;
  return undefined;
}
