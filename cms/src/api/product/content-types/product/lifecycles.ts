type VariantRow = {
  label?: string;
  optionKey?: string;
  price?: number;
  compareAtPrice?: number;
};

type VariantCombination = {
  id?: number;
  sku?: string;
  axisValues?: string;
  stock?: number;
};

function slugifyOptionKey(label: string): string {
  const key = label
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return key || 'option';
}

function normalizeVariants(variants?: VariantRow[]) {
  if (!Array.isArray(variants)) return;
  for (const row of variants) {
    if (!row?.label) continue;
    if (!row.optionKey?.trim()) {
      row.optionKey = slugifyOptionKey(row.label);
    }
  }
}

async function normalizeCombinationsAndStock(data: any, existingId?: number | string) {
  let combinations: VariantCombination[] = data.variantCombinations;
  
  if (Array.isArray(combinations)) {
    // If we are updating and some combinations only have 'id', we need to fetch existing stock
    if (existingId) {
      const needsFetch = combinations.some(c => c.id && c.stock === undefined);
      if (needsFetch) {
        const existingProduct = await strapi.entityService.findOne('api::product.product', existingId, {
          populate: { variantCombinations: true }
        }) as any;
        if (existingProduct?.variantCombinations) {
          // Merge missing fields from DB
          combinations = combinations.map(c => {
            if (c.id && c.stock === undefined) {
              const dbCombo = existingProduct.variantCombinations.find((x: any) => x.id === c.id);
              return { ...dbCombo, ...c };
            }
            return c;
          });
        }
      }
    }

    if (combinations.length > 0) {
      let anyInStock = false;
      for (const combo of combinations) {
        const stockVal = Number(combo.stock);
        if (!isNaN(stockVal) && stockVal > 0) {
          anyInStock = true;
        }
        if (!combo.sku && combo.axisValues) {
          combo.sku = slugifyOptionKey(combo.axisValues);
        }
      }
      data.inStock = anyInStock;
      
      // Update the modified combinations back to data
      data.variantCombinations = combinations;
    }
  }
}

export default {
  async beforeCreate(event: { params: { data: any } }) {
    normalizeVariants(event.params.data.variants);
    await normalizeCombinationsAndStock(event.params.data);
  },
  async beforeUpdate(event: { params: { data: any, where: any } }) {
    normalizeVariants(event.params.data.variants);
    await normalizeCombinationsAndStock(event.params.data, event.params.where.id);
  },
};
