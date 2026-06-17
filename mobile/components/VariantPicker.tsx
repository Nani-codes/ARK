import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatInr, getProductVariants } from '@/lib/productPricing';
import {
  getOptionSwatchImageUrl,
  getVariantDimensions,
  isOptionValueAvailable,
  isVisualDimension,
  productHasSelectableVariants,
} from '@/lib/productVariants';
import { colors, spacing, typography } from '@/lib/theme';
import type { Product, ProductVariant } from '@/lib/types';

type VariantPickerProps = {
  product: Product;
  selectedOptions: Record<string, string>;
  selectedVariant: ProductVariant;
  onSelectOption: (dimension: string, value: string) => void;
};

export function VariantPicker({
  product,
  selectedOptions,
  selectedVariant,
  onSelectOption,
}: VariantPickerProps) {
  const dimensions = getVariantDimensions(product);
  if (!productHasSelectableVariants(product)) return null;

  const isMultiDimension =
    dimensions.length > 1 || Boolean(product.variantOptions?.length);

  return (
    <View style={styles.wrap}>
      {dimensions.map((dim) => {
        const selectedValue = selectedOptions[dim.name];
        const visual = isVisualDimension(dim.name);

        return (
          <View key={dim.name} style={styles.dimBlock}>
            <Text style={styles.label}>
              {selectedValue ? (
                <>
                  Selected {dim.name}:{' '}
                  <Text style={styles.labelValue}>{selectedValue}</Text>
                </>
              ) : (
                `Select ${dim.name}`
              )}
            </Text>

            {visual ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.visualRow}>
                {dim.values.map((value) => {
                  const active = selectedValue === value;
                  const available = isOptionValueAvailable(
                    product,
                    dim.name,
                    value,
                    selectedOptions
                  );
                  const imageUri = getOptionSwatchImageUrl(product, dim.name, value);

                  return (
                    <Pressable
                      key={value}
                      style={[
                        styles.visualSwatch,
                        active && styles.visualSwatchActive,
                        !available && styles.visualSwatchDisabled,
                      ]}
                      onPress={() => available && onSelectOption(dim.name, value)}
                      disabled={!available}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active, disabled: !available }}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.visualImage} contentFit="cover" />
                      ) : (
                        <View style={[styles.visualFallback, colorHintStyle(value)]}>
                          <Text style={styles.visualFallbackText} numberOfLines={2}>
                            {value}
                          </Text>
                        </View>
                      )}
                      {!available ? (
                        <View style={styles.oosOverlay}>
                          <Text style={styles.oosText}>Out of stock</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.chipRow}>
                {dim.values.map((value) => {
                  const active = selectedValue === value;
                  const available = isOptionValueAvailable(
                    product,
                    dim.name,
                    value,
                    selectedOptions
                  );
                  const optionVariant = getProductVariants(product).find(
                    (v) =>
                      v.options?.[dim.name] === value ||
                      (!isMultiDimension && v.label === value)
                  );

                  return (
                    <Pressable
                      key={value}
                      style={[
                        styles.chip,
                        active && available && styles.chipActive,
                        !available && styles.chipDisabled,
                      ]}
                      onPress={() => available && onSelectOption(dim.name, value)}
                      disabled={!available}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active, disabled: !available }}>
                      <Text
                        style={[
                          styles.chipLabel,
                          active && available && styles.chipLabelActive,
                          !available && styles.chipLabelDisabled,
                        ]}
                        numberOfLines={1}>
                        {value}
                      </Text>
                      {!isMultiDimension && optionVariant && available ? (
                        <Text
                          style={[
                            styles.chipPrice,
                            active && styles.chipPriceActive,
                          ]}>
                          {formatInr(Number(optionVariant.price))}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {isMultiDimension ? (
        <View style={styles.comboPriceRow}>
          <Text style={styles.comboLabel}>Your selection</Text>
          <Text style={styles.comboValue}>{selectedVariant.label}</Text>
          <Text style={styles.comboPrice}>{formatInr(Number(selectedVariant.price))}</Text>
        </View>
      ) : null}
    </View>
  );
}

function colorHintStyle(value: string) {
  const v = value.toLowerCase();
  if (v.includes('grey') || v.includes('gray')) return { backgroundColor: '#9e9e9e' };
  if (v.includes('white')) return { backgroundColor: '#f5f5f5' };
  if (v.includes('beige') || v.includes('cream')) return { backgroundColor: '#e8dcc8' };
  if (v.includes('black')) return { backgroundColor: '#2c2c2c' };
  if (v.includes('blue')) return { backgroundColor: '#5c7cba' };
  if (v.includes('brown') || v.includes('wood')) return { backgroundColor: '#8d6e4c' };
  return { backgroundColor: colors.surfaceContainer };
}

const SWATCH = 64;

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.unit4, gap: spacing.unit4 },
  dimBlock: { gap: spacing.unit2 },
  label: { ...typography.labelLg, color: colors.onSurfaceVariant },
  labelValue: { color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  visualRow: { gap: spacing.unit3, paddingVertical: spacing.unit1 },
  visualSwatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  visualSwatchActive: {
    borderColor: colors.primary,
    borderWidth: 2.5,
  },
  visualSwatchDisabled: {
    opacity: 0.85,
  },
  visualImage: { width: '100%', height: '100%' },
  visualFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  visualFallbackText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 10,
    textAlign: 'center',
  },
  oosOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  oosText: {
    ...typography.labelMd,
    color: colors.error,
    fontWeight: '800',
    fontSize: 9,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.unit2 },
  chip: {
    minWidth: 52,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipDisabled: {
    borderStyle: 'dashed',
    opacity: 0.45,
  },
  chipLabel: { ...typography.labelLg, color: colors.onSurface, fontWeight: '600' },
  chipLabelActive: { color: colors.primary, fontWeight: '800' },
  chipLabelDisabled: { color: colors.onSurfaceVariant },
  chipPrice: { ...typography.labelMd, color: colors.onSurfaceVariant, marginTop: 2 },
  chipPriceActive: { color: colors.primary, fontWeight: '700' },
  comboPriceRow: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLow,
    gap: spacing.unit1,
  },
  comboLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  comboValue: { ...typography.labelLg, color: colors.primary, fontWeight: '600' },
  comboPrice: { ...typography.priceDisplay, color: colors.primary, fontSize: 18, marginTop: 4 },
});
