import { mediaUrl } from '@/lib/strapi';
import type { PricingTier, Product, ProductVariant } from '@/lib/types';

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function discountPercent(sale: number, regular?: number | null): number | null {
  if (!regular || regular <= sale) return null;
  return Math.round(((regular - sale) / regular) * 100);
}

/** Pick the best unit price for a quantity given optional tiers (highest minQty that applies). */
export function resolveUnitPrice(
  basePrice: number,
  quantity: number,
  tiers?: PricingTier[]
): number {
  if (!tiers?.length || quantity < 1) return basePrice;

  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sorted) {
    if (quantity >= tier.minQty) return tier.unitPrice;
  }
  return basePrice;
}

export function getEffectivePricingTiers(
  product: Product,
  variant?: ProductVariant
): PricingTier[] | undefined {
  if (variant?.pricingTiers?.length) return variant.pricingTiers;
  if (product.pricingTiers?.length) return product.pricingTiers;
  return undefined;
}

/** Variant image when set, otherwise the product hero image. */
export function resolveProductImageUrl(
  product: Product,
  variant?: ProductVariant
): string | undefined {
  const selected = variant ?? getProductVariants(product)[0];
  const path = selected?.image?.url ?? product.image?.url;
  return mediaUrl(path);
}

export function getProductVariants(product: Product): ProductVariant[] {
  if (product.variants?.length) return product.variants;
  return [
    {
      id: 'default',
      label: product.unit,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
      pricingTiers: product.pricingTiers,
    },
  ];
}

export function getVariantPricing(variant: ProductVariant, quantity = 1, tiers?: PricingTier[]) {
  const basePrice = Number(variant.price);
  const price = resolveUnitPrice(basePrice, quantity, tiers);
  const compareAtPrice = variant.compareAtPrice ? Number(variant.compareAtPrice) : null;
  const percent = discountPercent(price, compareAtPrice);
  return { price, basePrice, compareAtPrice, percent };
}

export function getProductDisplayPricing(
  product: Product,
  variant?: ProductVariant,
  quantity = 1
) {
  const variants = getProductVariants(product);
  const selected = variant ?? variants[0];
  const tiers = getEffectivePricingTiers(product, selected);
  const { price, compareAtPrice, percent } = getVariantPricing(selected, quantity, tiers);
  const baseCompare = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const displayPercent =
    percent ?? discountPercent(price, compareAtPrice ?? baseCompare);
  return {
    variant: selected,
    price,
    compareAtPrice: compareAtPrice ?? baseCompare,
    percent: displayPercent,
    tiers,
  };
}

export function lineTotalForVariant(
  product: Product,
  variant: ProductVariant,
  quantity: number
): number {
  const tiers = getEffectivePricingTiers(product, variant);
  const unitPrice = resolveUnitPrice(Number(variant.price), quantity, tiers);
  return Math.round(unitPrice * quantity * 100) / 100;
}
