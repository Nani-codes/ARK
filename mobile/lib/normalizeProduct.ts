import type { Product, ProductSpec, ProductVariant, VariantAxis, VariantCombination } from '@/lib/types';

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
  variantAxes?: { axisName?: string; values?: string }[] | null;
  variantCombinations?: {
    sku?: string;
    axisValues?: string;
    price?: number | string;
    compareAtPrice?: number | string | null;
    stock?: number;
    image?: any;
  }[] | null;
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

function normalizeVariantAxes(axes?: { axisName?: string; values?: string }[] | null): VariantAxis[] | undefined {
  if (!axes?.length) return undefined;
  return axes
    .filter((a) => a.axisName && a.values)
    .map((a) => ({
      axisName: a.axisName!,
      values: a.values!.split(',').map((v) => v.trim()).filter(Boolean),
    }));
}

function normalizeVariantCombinations(
  combinations?: {
    sku?: string;
    axisValues?: string;
    price?: number | string;
    compareAtPrice?: number | string | null;
    stock?: number;
    image?: any;
  }[] | null
): VariantCombination[] | undefined {
  if (!combinations?.length) return undefined;
  return combinations
    .filter((c) => c.sku && c.axisValues && c.price != null)
    .map((c) => ({
      sku: c.sku!,
      axisValues: c.axisValues!.split('/').map((v) => v.trim()),
      price: Number(c.price),
      compareAtPrice:
        c.compareAtPrice != null && c.compareAtPrice !== ''
          ? Number(c.compareAtPrice)
          : undefined,
      stock: c.stock ?? 0,
      image: c.image ?? null,
    }));
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
    variantAxes: normalizeVariantAxes(raw.variantAxes),
    variantCombinations: normalizeVariantCombinations(raw.variantCombinations),
  };
}
