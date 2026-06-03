/** Helpers for readable seed data (same shape as Strapi components). */

export type VariantSeed = {
  label: string;
  price: number;
  compareAtPrice?: number;
  optionKey?: string;
};

export type SpecSeed = {
  label: string;
  value: string;
};

/** One size / pack row */
export function variant(
  label: string,
  price: number,
  compareAtPrice?: number,
  optionKey?: string
): VariantSeed {
  return { label, price, compareAtPrice, optionKey };
}

/** One specification row */
export function spec(label: string, value: string): SpecSeed {
  return { label, value };
}
