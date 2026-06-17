import type { Product, ProductSpec, ProductVariant } from '@/lib/types';

type StrapiVariantRow = {
  label?: string;
  optionKey?: string;
  price?: number | string;
  compareAtPrice?: number | string | null;
  id?: string;
};

type StrapiSpecRow = {
  label?: string;
  value?: string;
};

type LegacySpecs = {
  grade?: string;
  strength?: string;
  setTime?: string;
};

type RawProduct = Product & {
  variants?: StrapiVariantRow[] | null;
  specs?: StrapiSpecRow[] | LegacySpecs | null;
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

function normalizeVariants(rows?: StrapiVariantRow[] | null): ProductVariant[] | undefined {
  if (!rows?.length) return undefined;
  return rows.map((row, index) => ({
    id: row.optionKey?.trim() || row.id || slugify(row.label ?? '', index),
    label: row.label ?? '',
    price: Number(row.price),
    compareAtPrice:
      row.compareAtPrice != null && row.compareAtPrice !== ''
        ? Number(row.compareAtPrice)
        : undefined,
  }));
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
  return {
    ...raw,
    price: Number(raw.price),
    compareAtPrice:
      raw.compareAtPrice != null && (raw.compareAtPrice as any) !== ''
        ? Number(raw.compareAtPrice)
        : null,
    variants: normalizeVariants(raw.variants as StrapiVariantRow[]),
    specs: normalizeSpecs(raw.specs),
  };
}
