/** Helpers for readable seed data (same shape as Strapi components). */

export type VariantSeed = {
  label: string;
  price: number;
  compareAtPrice?: number;
  optionKey?: string;
  choices?: Array<{ groupName: string; choice: string }>;
  /** @deprecated use choices */
  options?: Record<string, string>;
};

export type VariantOptionGroupSeed = {
  groupName: string;
  choices: string;
};

export type SpecSeed = {
  label: string;
  value: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/["'×]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

/** One size / pack row (single-dimension legacy) */
export function variant(
  label: string,
  price: number,
  compareAtPrice?: number,
  optionKey?: string
): VariantSeed {
  return { label, price, compareAtPrice, optionKey };
}

/** Customer choice group — choices are comma-separated plain text */
export function optionGroup(groupName: string, choices: string): VariantOptionGroupSeed {
  return { groupName, choices };
}

/** One purchasable combination across multiple option dimensions */
export function variantCombo(
  options: Record<string, string>,
  price: number,
  compareAtPrice?: number,
  optionKey?: string
): VariantSeed {
  const label = Object.values(options).join(' / ');
  const key =
    optionKey ??
    Object.entries(options)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => `${slugify(name)}:${slugify(value)}`)
      .join('|');
  const choices = Object.entries(options).map(([groupName, choice]) => ({ groupName, choice }));
  return { label, price, compareAtPrice, optionKey: key, choices, options };
}

/** One quantity price break */
export function pricingTier(minQty: number, unitPrice: number) {
  return { minQty, unitPrice };
}

/** One specification row */
export function spec(label: string, value: string): SpecSeed {
  return { label, value };
}
