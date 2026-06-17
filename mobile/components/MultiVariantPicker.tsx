import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';
import type { VariantAxis, VariantCombination } from '@/lib/types';

type MultiVariantPickerProps = {
  axes: VariantAxis[];
  combinations: VariantCombination[];
  selectedCombination: VariantCombination | null;
  onSelect: (combination: VariantCombination | null) => void;
};

export function MultiVariantPicker({
  axes,
  combinations,
  selectedCombination,
  onSelect,
}: MultiVariantPickerProps) {
  // Extract currently selected axis values from the selected combination
  const selectedValues = useMemo(() => {
    if (!selectedCombination) return [];
    return selectedCombination.axisValues;
  }, [selectedCombination]);

  // Helper to check if a specific value for a specific axis has any in-stock combination
  // given the CURRENT selections for ALL OTHER axes
  const isValueAvailable = (axisIndex: number, value: string) => {
    const candidateValues = [...selectedValues];
    candidateValues[axisIndex] = value;
    
    // We only care if there is *some* combination that matches the chosen values for axes
    // we have selected so far (or are checking). We ignore axes that are "empty" (though in
    // this strict design, all axes are usually selected, we allow partial matches if needed).
    return combinations.some((combo) => {
      // Must be in stock
      if (combo.stock <= 0) return false;
      
      // Must match candidate values for all axes
      for (let i = 0; i < axes.length; i++) {
        if (candidateValues[i] && combo.axisValues[i] !== candidateValues[i]) {
          return false;
        }
      }
      return true;
    });
  };

  const handleSelectValue = (axisIndex: number, value: string) => {
    const newValues = [...selectedValues];
    newValues[axisIndex] = value;

    // Find the combination that matches these exact values
    const newCombo = combinations.find((c) =>
      c.axisValues.every((val, i) => val === newValues[i])
    );

    if (newCombo) {
      onSelect(newCombo);
    } else {
      // If the exact combination doesn't exist (or is out of stock but we still want to select it),
      // we can try to find the *first* available combination that matches this new value.
      const fallbackCombo = combinations.find(
        (c) => c.axisValues[axisIndex] === value && c.stock > 0
      );
      if (fallbackCombo) {
        onSelect(fallbackCombo);
      } else {
        // Just find any combination with this value
        const anyCombo = combinations.find((c) => c.axisValues[axisIndex] === value);
        onSelect(anyCombo || null);
      }
    }
  };

  if (!axes.length || !combinations.length) return null;

  return (
    <View style={styles.wrap}>
      {axes.map((axis, axisIndex) => (
        <View key={axis.axisName} style={styles.axisWrap}>
          <Text style={styles.label}>{axis.axisName}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {axis.values.map((val) => {
              const active = selectedValues[axisIndex] === val;
              const available = isValueAvailable(axisIndex, val);
              
              return (
                <Pressable
                  key={val}
                  style={[
                    styles.chip,
                    active && styles.chipActive,
                    !available && !active && styles.chipDisabled,
                  ]}
                  onPress={() => handleSelectValue(axisIndex, val)}>
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                      !available && !active && styles.chipTextDisabled,
                    ]}>
                    {val}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.unit4, gap: spacing.unit4 },
  axisWrap: { gap: spacing.unit2 },
  label: { ...typography.labelLg, color: colors.primary },
  scroll: { gap: spacing.unit2 },
  chip: {
    paddingHorizontal: spacing.unit4,
    paddingVertical: spacing.unit2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: 'rgba(254, 212, 136, 0.2)',
  },
  chipDisabled: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainer,
  },
  chipText: { ...typography.bodyMd, color: colors.onSurface },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  chipTextDisabled: { color: colors.onSurfaceVariant, opacity: 0.5 },
});
