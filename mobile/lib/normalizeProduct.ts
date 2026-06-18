import type { Product, ProductSpec, ProductVariant, PricingTier, StrapiMedia, VariantOption } from '@/lib/types';

type StrapiMediaRow = {
  url?: string;
  alternativeText?: string;
};

type StrapiVariantRow = {
  label?: string;
  optionKey?: string;
  price?: number | string;
  compareAtPrice?: number | string | null;
  image?: StrapiMediaRow | null;
  options?: Record<string, string> | null;
  choices?: Array<{ groupName?: string; choice?: string }> | null;
  pricingTiers?: Array<{ minQty?: number; unitPrice?: number | string }> | null;
  id?: string;
};

type StrapiOptionGroupRow = {
  groupName?: string;
  choices?: string;
};

type LegacySpecs = {
  grade?: string;
  strength?: string;
  setTime?: string;
};

type RawProduct = Product & {
  variants?: StrapiVariantRow[] | null;
  variantOptionGroups?: StrapiOptionGroupRow[] | null;
  variantOptions?: VariantOption[] | null;
  specs?: StrapiSpecRow[] | LegacySpecs | null;
  pricingTiers?: Array<{ minQty?: number; unitPrice?: number | string }> | null;
};

type StrapiSpecRow = {
  label?: string;
  value?: string;
};

function slugify(label: string, index: number): string {
  const key = label
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return key || `option-${index}`;
}

function parseChoicesText(text: string): string[] {
  return text
    .split(/[,;|\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function optionsFromChoices(
  choices?: Array<{ groupName?: string; choice?: string }> | null
): Record<string, string> | undefined {
  if (!choices?.length) return undefined;
  const map: Record<string, string> = {};
  for (const row of choices) {
    const name = row.groupName?.trim();
    const value = row.choice?.trim();
    if (name && value) map[name] = value;
  }
  return Object.keys(map).length > 0 ? map : undefined;
}

function normalizeMedia(media?: StrapiMediaRow | null): StrapiMedia | null {
  if (!media?.url) return null;
  return { url: media.url, alternativeText: media.alternativeText };
}

function normalizeVariantOptions(
  groups?: StrapiOptionGroupRow[] | null,
  legacy?: VariantOption[] | null
): VariantOption[] | undefined {
  if (groups?.length) {
    const parsed = groups
      .map((group) => ({
        name: (group.groupName ?? '').trim(),
        values: parseChoicesText(group.choices ?? ''),
      }))
      .filter((group) => group.name && group.values.length > 0);
    if (parsed.length) return parsed;
  }

  if (legacy?.length) return legacy;
  return undefined;
}

function normalizePricingTiers(
  rows?: Array<{ minQty?: number; unitPrice?: number | string }> | null
): PricingTier[] | undefined {
  if (!rows?.length) return undefined;
  const tiers = rows
    .filter((row) => row.minQty != null && row.unitPrice != null)
    .map((row) => ({
      minQty: Number(row.minQty),
      unitPrice: Number(row.unitPrice),
    }))
    .filter((row) => row.minQty >= 2 && row.unitPrice > 0);
  return tiers.length ? tiers : undefined;
}

function normalizeVariants(rows?: StrapiVariantRow[] | null): ProductVariant[] | undefined {
  if (!rows?.length) return undefined;
  return rows.map((row, index) => {
    const options =
      optionsFromChoices(row.choices) ??
      (row.options && typeof row.options === 'object' && Object.keys(row.options).length > 0
        ? row.options
        : undefined);

    return {
      id: row.optionKey?.trim() || row.id || slugify(row.label ?? '', index),
      label: row.label ?? (options ? Object.values(options).join(' / ') : ''),
      price: Number(row.price),
      compareAtPrice:
        row.compareAtPrice != null && row.compareAtPrice !== ''
          ? Number(row.compareAtPrice)
          : undefined,
      image: normalizeMedia(row.image),
      options,
      pricingTiers: normalizePricingTiers(row.pricingTiers),
    };
  });
}

function normalizeSpecs(
  specs?: StrapiSpecRow[] | LegacySpecs | null
): ProductSpec[] | undefined {
  if (!specs) return undefined;
  if (Array.isArray(specs)) {
    return specs
      .filter((s) => s.label && s.value)
      .map((s) => ({ label: s.label!, value: s.value! }));
  }
  const legacy = specs as LegacySpecs;
  const rows: ProductSpec[] = [];
  if (legacy.grade) rows.push({ label: 'Grade', value: legacy.grade });
  if (legacy.strength) rows.push({ label: 'Strength', value: legacy.strength });
  if (legacy.setTime) rows.push({ label: 'Set time', value: legacy.setTime });
  return rows.length ? rows : undefined;
}

/** Map Strapi product (components or legacy JSON) to app Product shape. */
export function normalizeProduct(raw: RawProduct): Product {
  const variantOptionGroups = normalizeVariantOptions(
    raw.variantOptionGroups as StrapiOptionGroupRow[] | undefined,
    raw.variantOptions
  );

  return {
    ...raw,
    price: Number(raw.price),
    compareAtPrice:
      raw.compareAtPrice != null ? Number(raw.compareAtPrice) : null,
    variantOptions: variantOptionGroups,
    variants: normalizeVariants(raw.variants as StrapiVariantRow[]),
    specs: normalizeSpecs(raw.specs),
    pricingTiers: normalizePricingTiers(raw.pricingTiers),
  };
}
