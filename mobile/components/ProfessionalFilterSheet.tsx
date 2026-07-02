import { MaterialIcons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { PROFESSION_OPTIONS } from '@/lib/professions';
import { colors, spacing, typography } from '@/lib/theme';
import type { ProfessionType, ProfessionalFilters, ProfessionalSort } from '@/lib/types';

const SORT_OPTIONS: { key: ProfessionalSort; label: string }[] = [
  { key: 'top_rated', label: 'Top rated' },
  { key: 'most_projects', label: 'Most projects' },
  { key: 'recent', label: 'Recently active' },
  { key: 'experience', label: 'Most experience' },
];

const RATING_OPTIONS = [0, 3, 4, 4.5];
const EXPERIENCE_OPTIONS = [0, 3, 5, 10];

type ProfessionalFilterSheetProps = {
  visible: boolean;
  filters: ProfessionalFilters;
  onChange: (filters: ProfessionalFilters) => void;
  onClose: () => void;
  onApply: () => void;
};

export function ProfessionalFilterSheet({
  visible,
  filters,
  onChange,
  onClose,
  onApply,
}: ProfessionalFilterSheetProps) {
  const set = (patch: Partial<ProfessionalFilters>) => onChange({ ...filters, ...patch });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filters & sort</Text>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.label}>SORT BY</Text>
          <View style={styles.chips}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.chip, filters.sort === opt.key && styles.chipActive]}
                onPress={() => set({ sort: opt.key })}>
                <Text style={[styles.chipText, filters.sort === opt.key && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>TRADE</Text>
          <View style={styles.chips}>
            <Pressable
              style={[styles.chip, !filters.trade && styles.chipActive]}
              onPress={() => set({ trade: '' })}>
              <Text style={[styles.chipText, !filters.trade && styles.chipTextActive]}>All</Text>
            </Pressable>
            {PROFESSION_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.chip, filters.trade === opt.key && styles.chipActive]}
                onPress={() => set({ trade: opt.key as ProfessionType })}>
                <Text
                  style={[styles.chipText, filters.trade === opt.key && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>CITY</Text>
          <TextInput
            style={styles.input}
            value={filters.city ?? ''}
            onChangeText={(city) => set({ city })}
            placeholder="e.g. Hyderabad"
          />

          <Text style={styles.label}>PINCODE</Text>
          <TextInput
            style={styles.input}
            value={filters.pincode ?? ''}
            onChangeText={(pincode) => set({ pincode })}
            placeholder="e.g. 500032"
            keyboardType="number-pad"
          />

          <Text style={styles.label}>MIN RATING</Text>
          <View style={styles.chips}>
            {RATING_OPTIONS.map((rating) => (
              <Pressable
                key={rating}
                style={[styles.chip, (filters.minRating ?? 0) === rating && styles.chipActive]}
                onPress={() => set({ minRating: rating })}>
                <Text
                  style={[
                    styles.chipText,
                    (filters.minRating ?? 0) === rating && styles.chipTextActive,
                  ]}>
                  {rating === 0 ? 'Any' : `${rating}+`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>MIN EXPERIENCE (YEARS)</Text>
          <View style={styles.chips}>
            {EXPERIENCE_OPTIONS.map((years) => (
              <Pressable
                key={years}
                style={[
                  styles.chip,
                  (filters.minExperience ?? 0) === years && styles.chipActive,
                ]}
                onPress={() => set({ minExperience: years })}>
                <Text
                  style={[
                    styles.chipText,
                    (filters.minExperience ?? 0) === years && styles.chipTextActive,
                  ]}>
                  {years === 0 ? 'Any' : `${years}+ yrs`}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <PrimaryButton
            label="Reset"
            variant="outline"
            onPress={() =>
              onChange({
                q: filters.q,
                sort: 'recent',
                trade: '',
                city: '',
                pincode: '',
                minRating: 0,
                minExperience: 0,
              })
            }
          />
          <PrimaryButton label="Apply" onPress={onApply} />
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.containerMargin,
    paddingTop: spacing.unit3,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    marginBottom: spacing.unit4,
  },
  title: { ...typography.headlineMd, color: colors.primary, marginBottom: spacing.unit4 },
  scroll: { gap: spacing.unit3, paddingBottom: spacing.unit4 },
  label: { ...typography.labelLg, color: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.unit2 },
  chip: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
    backgroundColor: colors.surfaceContainerLowest,
  },
  chipActive: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  chipText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: spacing.unit3,
    backgroundColor: colors.surfaceContainerLowest,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  actions: { flexDirection: 'row', gap: spacing.unit3 },
  closeBtn: { position: 'absolute', top: spacing.unit4, right: spacing.unit4 },
});
