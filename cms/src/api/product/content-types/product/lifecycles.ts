type VariantRow = {
  label?: string;
  optionKey?: string;
  price?: number;
  compareAtPrice?: number;
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

export default {
  beforeCreate(event: { params: { data: { variants?: VariantRow[] } } }) {
    normalizeVariants(event.params.data.variants);
  },
  beforeUpdate(event: { params: { data: { variants?: VariantRow[] } } }) {
    normalizeVariants(event.params.data.variants);
  },
};
