import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatInr } from '@/lib/productPricing';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProductVariant } from '@/lib/types';

type VariantPickerProps = {
  label: string;
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (variant: ProductVariant) => void;
};

export function VariantPicker({ label, variants, selectedId, onSelect }: VariantPickerProps) {
  if (variants.length <= 1 && variants[0]?.id === 'default') return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.list}>
        {variants.map((v) => {
          const active = v.id === selectedId;
          return (
            <Pressable
              key={v.id}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => onSelect(v)}>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                {v.label}
              </Text>
              <Text style={[styles.optionPrice, active && styles.optionPriceActive]}>
                {formatInr(Number(v.price))}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.unit4 },
  label: { ...typography.labelLg, color: colors.primary, marginBottom: spacing.unit2 },
  list: { gap: spacing.unit2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingVertical: spacing.unit3,
    paddingHorizontal: spacing.unit4,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: 'rgba(254, 212, 136, 0.2)',
  },
  optionLabel: { ...typography.bodyMd, color: colors.onSurface },
  optionLabelActive: { color: colors.primary, fontWeight: '600' },
  optionPrice: { ...typography.labelLg, color: colors.onSurfaceVariant },
  optionPriceActive: { color: colors.primary, fontWeight: '700' },
});
