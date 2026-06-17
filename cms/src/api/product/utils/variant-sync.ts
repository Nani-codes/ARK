export type VariantOptionGroupRow = {
  groupName?: string;
  choices?: string;
};

export type VariantChoiceRow = {
  groupName?: string;
  choice?: string;
};

export type VariantRow = {
  label?: string;
  optionKey?: string;
  price?: number;
  compareAtPrice?: number;
  image?: number | { id: number };
  choices?: VariantChoiceRow[];
  /** @deprecated legacy JSON — migrated on read */
  options?: Record<string, string>;
};

export type ParsedOptionGroup = {
  name: string;
  values: string[];
};

export function parseChoicesText(text: string): string[] {
  return text
    .split(/[,;|\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseOptionGroups(groups?: VariantOptionGroupRow[]): ParsedOptionGroup[] {
  return (groups ?? [])
    .map((group) => ({
      name: (group.groupName ?? '').trim(),
      values: parseChoicesText(group.choices ?? ''),
    }))
    .filter((group) => group.name && group.values.length > 0);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/["'×]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'option'
  );
}

export function comboOptionKey(options: Record<string, string>): string {
  return Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${slugify(name)}:${slugify(value)}`)
    .join('|');
}

function optionsFromChoices(choices?: VariantChoiceRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of choices ?? []) {
    const name = row.groupName?.trim();
    const value = row.choice?.trim();
    if (name && value) map[name] = value;
  }
  return map;
}

function choicesFromOptions(options: Record<string, string>): VariantChoiceRow[] {
  return Object.entries(options).map(([groupName, choice]) => ({ groupName, choice }));
}

function cartesianCombinations(groups: ParsedOptionGroup[]): Record<string, string>[] {
  return groups.reduce<Record<string, string>[]>(
    (acc, group) => {
      if (!acc.length) {
        return group.values.map((value) => ({ [group.name]: value }));
      }
      const next: Record<string, string>[] = [];
      for (const row of acc) {
        for (const value of group.values) {
          next.push({ ...row, [group.name]: value });
        }
      }
      return next;
    },
    []
  );
}

function normalizeVariantRow(row: VariantRow) {
  if (!row) return;

  const options =
    Object.keys(optionsFromChoices(row.choices)).length > 0
      ? optionsFromChoices(row.choices)
      : row.options && typeof row.options === 'object'
        ? row.options
        : {};

  if (Object.keys(options).length > 0) {
    row.options = options;
    if (!row.choices?.length) {
      row.choices = choicesFromOptions(options);
    }
    if (!row.label?.trim()) {
      row.label = Object.values(options).join(' / ');
    }
    if (!row.optionKey?.trim()) {
      row.optionKey = comboOptionKey(options);
    }
    return;
  }

  if (!row.label?.trim()) return;
  if (!row.optionKey?.trim()) {
    row.optionKey = slugify(row.label);
  }
}

function buildVariantsFromGroups(
  groups: ParsedOptionGroup[],
  existing: VariantRow[],
  basePrice: number,
  baseCompare?: number
): VariantRow[] {
  const combos = cartesianCombinations(groups);
  const existingByKey = new Map<string, VariantRow>();

  for (const row of existing) {
    normalizeVariantRow(row);
    const key = row.optionKey ?? (row.options ? comboOptionKey(row.options) : '');
    if (key) existingByKey.set(key, row);
  }

  return combos.map((options) => {
    const optionKey = comboOptionKey(options);
    const prev = existingByKey.get(optionKey);
    if (prev) {
      return {
        ...prev,
        options,
        choices: choicesFromOptions(options),
        label: prev.label?.trim() || Object.values(options).join(' / '),
        optionKey,
      };
    }

    return {
      label: Object.values(options).join(' / '),
      optionKey,
      price: basePrice,
      compareAtPrice: baseCompare,
      options,
      choices: choicesFromOptions(options),
    };
  });
}

export type ProductVariantInput = {
  price?: number;
  compareAtPrice?: number;
  variantOptionGroups?: VariantOptionGroupRow[];
  autoBuildVariants?: boolean;
  variants?: VariantRow[];
};

/** Normalise variant rows and optionally build every combination from choice groups. */
export function syncProductVariants(data: ProductVariantInput) {
  const groups = parseOptionGroups(data.variantOptionGroups);
  const basePrice = Number(data.price) || 0;
  const baseCompare =
    data.compareAtPrice != null ? Number(data.compareAtPrice) : undefined;

  if (groups.length > 0 && data.autoBuildVariants !== false) {
    data.variants = buildVariantsFromGroups(
      groups,
      data.variants ?? [],
      basePrice,
      baseCompare
    );
  }

  for (const row of data.variants ?? []) {
    normalizeVariantRow(row);
  }
}
