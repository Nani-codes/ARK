import {
  syncProductVariants,
  type ProductVariantInput,
} from '../../utils/variant-sync';

type LifecycleParams = {
  data: ProductVariantInput & { documentId?: string };
  where?: { documentId?: string };
};

async function loadExistingProduct(documentId: string) {
  return strapi.db.query('api::product.product').findOne({
    where: { documentId },
    populate: {
      variantOptionGroups: true,
      variants: { populate: ['choices'] },
    },
  }) as Promise<ProductVariantInput | null>;
}

function mergeProductData(
  existing: ProductVariantInput | null,
  incoming: ProductVariantInput
): ProductVariantInput {
  if (!existing) return incoming;

  return {
    price: incoming.price ?? existing.price,
    compareAtPrice: incoming.compareAtPrice ?? existing.compareAtPrice,
    autoBuildVariants: incoming.autoBuildVariants ?? existing.autoBuildVariants,
    variantOptionGroups: incoming.variantOptionGroups ?? existing.variantOptionGroups,
    variants: incoming.variants ?? existing.variants,
  };
}

async function applyVariantSync(params: LifecycleParams) {
  const { data, where } = params;
  let merged = data;

  if (where?.documentId) {
    const existing = await loadExistingProduct(where.documentId);
    merged = mergeProductData(existing, data);
  }

  syncProductVariants(merged);

  data.price = merged.price;
  data.compareAtPrice = merged.compareAtPrice;
  data.autoBuildVariants = merged.autoBuildVariants;
  data.variantOptionGroups = merged.variantOptionGroups;
  data.variants = merged.variants;
}

export default {
  async beforeCreate(event: { params: LifecycleParams }) {
    await applyVariantSync(event.params);
  },
  async beforeUpdate(event: { params: LifecycleParams }) {
    await applyVariantSync(event.params);
  },
};
