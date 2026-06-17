import { getProductVariants, resolveProductImageUrl } from '@/lib/productPricing';
import type { Product, ProductVariant, VariantOption } from '@/lib/types';

/** Option groups for the picker — from variantOptions or legacy single-dimension list. */
export function getVariantDimensions(product: Product): VariantOption[] {
  if (product.variantOptions?.length) {
    return product.variantOptions;
  }

  const variants = product.variants ?? [];
  if (variants.length > 1) {
    return [
      {
        name: product.variantOptionName ?? 'Option',
        values: variants.map((v) => v.label),
      },
    ];
  }

  return [];
}

export function productHasSelectableVariants(product: Product): boolean {
  const dims = getVariantDimensions(product);
  if (dims.length === 0) return false;
  if (dims.length > 1) return true;
  const variants = getProductVariants(product);
  return variants.length > 1 && !(variants.length === 1 && variants[0].id === 'default');
}

function variantMatchesSelection(
  variant: ProductVariant,
  selected: Record<string, string>,
  dimensions: VariantOption[]
): boolean {
  if (variant.options && Object.keys(variant.options).length > 0) {
    return dimensions.every(
      (d) => selected[d.name] && variant.options![d.name] === selected[d.name]
    );
  }

  if (dimensions.length === 1) {
    const val = selected[dimensions[0].name];
    return variant.label === val || variant.id === val;
  }

  return false;
}

/** Resolve the purchasable SKU for the current option selection. */
export function findVariantByOptions(
  product: Product,
  selected: Record<string, string>
): ProductVariant | null {
  const variants = getProductVariants(product);
  if (!variants.length) return null;

  const dimensions = getVariantDimensions(product);
  if (!dimensions.length) return variants[0] ?? null;

  const match = variants.find((v) => variantMatchesSelection(v, selected, dimensions));
  return match ?? variants[0] ?? null;
}

export function getInitialSelection(product: Product): Record<string, string> {
  const variants = getProductVariants(product);
  const first = variants[0];
  if (first?.options && Object.keys(first.options).length > 0) {
    return { ...first.options };
  }

  const dimensions = getVariantDimensions(product);
  if (dimensions.length === 1 && first) {
    return { [dimensions[0].name]: first.label };
  }

  return {};
}

/** Values still valid for a dimension given partial selections elsewhere. */
export function getAvailableValues(
  product: Product,
  dimensionName: string,
  selected: Record<string, string>
): string[] {
  const dimensions = getVariantDimensions(product);
  const group = dimensions.find((d) => d.name === dimensionName);
  if (!group) return [];

  const variants = getProductVariants(product);
  const otherDims = dimensions.filter((d) => d.name !== dimensionName);

  if (variants.some((v) => v.options && Object.keys(v.options).length > 0)) {
    return group.values.filter((value) =>
      variants.some(
        (v) =>
          v.options?.[dimensionName] === value &&
          otherDims.every((d) => {
            const pick = selected[d.name];
            return !pick || v.options?.[d.name] === pick;
          })
      )
    );
  }

  return group.values;
}

/** Whether this option value forms a valid combination with current picks on other axes. */
export function isOptionValueAvailable(
  product: Product,
  dimensionName: string,
  value: string,
  selected: Record<string, string>
): boolean {
  const dimensions = getVariantDimensions(product);
  const otherDims = dimensions.filter((d) => d.name !== dimensionName);
  const variants = getProductVariants(product);

  if (variants.some((v) => v.options && Object.keys(v.options).length > 0)) {
    return variants.some(
      (v) =>
        v.options?.[dimensionName] === value &&
        otherDims.every((d) => {
          const pick = selected[d.name];
          return !pick || v.options?.[d.name] === pick;
        })
    );
  }

  return true;
}

/** Colour / theme / pattern axes use image swatches; size / pack use text chips. */
export function isVisualDimension(dimensionName: string): boolean {
  return /colour|color|shade|pattern|design|theme|look/i.test(dimensionName);
}

/** Best preview image for an option value (variant image or product fallback). */
export function getOptionSwatchImageUrl(
  product: Product,
  dimensionName: string,
  value: string
): string | undefined {
  const variants = getProductVariants(product);
  const match = variants.find(
    (v) => v.options?.[dimensionName] === value && v.image?.url
  );
  if (match) return resolveProductImageUrl(product, match);
  return undefined;
}

/** Update selection when user taps an option; snaps to nearest valid combination. */
export function selectOption(
  product: Product,
  current: Record<string, string>,
  dimension: string,
  value: string
): Record<string, string> {
  const trial = { ...current, [dimension]: value };
  const exact = findVariantByOptions(product, trial);
  if (exact?.options) return { ...exact.options };

  const variants = getProductVariants(product);
  const dimensions = getVariantDimensions(product);
  const otherDims = dimensions.filter((d) => d.name !== dimension);

  const partial = variants.find(
    (v) =>
      v.options?.[dimension] === value &&
      otherDims.every((d) => {
        const pick = current[d.name];
        return !pick || v.options?.[d.name] === pick;
      })
  );
  if (partial?.options) return { ...partial.options };

  const fallback = variants.find((v) => v.options?.[dimension] === value);
  if (fallback?.options) return { ...fallback.options };

  return trial;
}
