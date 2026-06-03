import type { Product, ProductVariant } from '@/lib/types';

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function discountPercent(sale: number, regular?: number | null): number | null {
  if (!regular || regular <= sale) return null;
  return Math.round(((regular - sale) / regular) * 100);
}

/** Effective variants: explicit list or single default from base price. */
export function getProductVariants(product: Product): ProductVariant[] {
  if (product.variants?.length) return product.variants;
  return [
    {
      id: 'default',
      label: product.unit,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
    },
  ];
}

export function getVariantPricing(variant: ProductVariant) {
  const price = Number(variant.price);
  const compareAtPrice = variant.compareAtPrice ? Number(variant.compareAtPrice) : null;
  const percent = discountPercent(price, compareAtPrice);
  return { price, compareAtPrice, percent };
}

export function getProductDisplayPricing(product: Product, variant?: ProductVariant) {
  const variants = getProductVariants(product);
  const selected = variant ?? variants[0];
  const { price, compareAtPrice, percent } = getVariantPricing(selected);
  const baseCompare = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const displayPercent =
    percent ?? discountPercent(price, compareAtPrice ?? baseCompare);
  return {
    variant: selected,
    price,
    compareAtPrice: compareAtPrice ?? baseCompare,
    percent: displayPercent,
  };
}
