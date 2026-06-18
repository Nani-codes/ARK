import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

type TemperatureBadgeProps = {
  note?: string | null;
  compact?: boolean;
};

export function TemperatureBadge({ note, compact }: TemperatureBadgeProps) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <MaterialIcons name="ac-unit" size={compact ? 14 : 16} color={colors.primary} />
      <Text style={[styles.text, compact && styles.textCompact]}>
        {note?.trim() || 'Temperature-sensitive — handle with care during delivery'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.unit2,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit3,
  },
  compact: {
    padding: spacing.unit2,
  },
  text: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  textCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
});
