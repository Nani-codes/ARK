import { StyleSheet, Text, View } from 'react-native';

import { formatInr } from '@/lib/productPricing';
import type { PricingTier } from '@/lib/types';
import { colors, spacing, typography } from '@/lib/theme';

type PricingTierTableProps = {
  tiers: PricingTier[];
  unit: string;
  currentQty?: number;
};

export function PricingTierTable({ tiers, unit, currentQty }: PricingTierTableProps) {
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  if (!sorted.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Quantity discounts</Text>
      {sorted.map((tier) => {
        const active = currentQty != null && currentQty >= tier.minQty;
        return (
          <View key={tier.minQty} style={[styles.row, active && styles.rowActive]}>
            <Text style={styles.qty}>
              {tier.minQty}+ {unit}
            </Text>
            <Text style={styles.price}>{formatInr(tier.unitPrice)} / {unit}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: spacing.unit3,
  },
  title: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  rowActive: {
    backgroundColor: colors.secondaryContainer,
  },
  qty: { ...typography.bodyMd, color: colors.onSurface },
  price: { ...typography.labelMd, color: colors.primary, fontWeight: '700' },
});
