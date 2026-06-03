import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ADDRESS_TYPE_CONFIG, formatFullAddress } from '@/lib/addressFormat';
import { colors, spacing, typography } from '@/lib/theme';
import type { SavedAddress } from '@/lib/types';

type Props = {
  address: SavedAddress;
  selected?: boolean;
  recentlyUsed?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function AddressCard({ address, selected, recentlyUsed, onPress, onEdit, onDelete }: Props) {
  const cfg = ADDRESS_TYPE_CONFIG[address.label];

  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: cfg.color + '18' }]}>
        <MaterialIcons name={cfg.icon} size={22} color={cfg.color} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.typeLabel}>{cfg.label}</Text>
          {address.isDefault && (
            <View style={styles.chip}>
              <MaterialIcons name="star" size={10} color={colors.secondary} />
              <Text style={[styles.chipText, { color: colors.secondary }]}>Default</Text>
            </View>
          )}
          {recentlyUsed && !address.isDefault && (
            <View style={[styles.chip, styles.chipRecent]}>
              <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]}>Recent</Text>
            </View>
          )}
        </View>

        <Text style={styles.address} numberOfLines={2}>
          {formatFullAddress(address)}
        </Text>

        {address.landmark ? (
          <Text style={styles.sub} numberOfLines={1}>Near {address.landmark}</Text>
        ) : null}
        {address.instructions ? (
          <Text style={styles.sub} numberOfLines={1}>💬 {address.instructions}</Text>
        ) : null}
      </View>

      {/* Right-side actions */}
      <View style={styles.right}>
        {onPress ? (
          selected
            ? <MaterialIcons name="check-circle" size={22} color={colors.secondary} />
            : <MaterialIcons name="radio-button-unchecked" size={22} color={colors.outline} />
        ) : null}
        {(onEdit || onDelete) && (
          <View style={styles.actionRow}>
            {onEdit && (
              <Pressable onPress={onEdit} hitSlop={10}>
                <MaterialIcons name="edit" size={18} color={colors.iconMuted} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={onDelete} hitSlop={10}>
                <MaterialIcons name="delete-outline" size={18} color={colors.error} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.unit3,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.unit4,
    alignItems: 'flex-start',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.surfaceContainerLow,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit2, marginBottom: 4 },
  typeLabel: { ...typography.labelLg, color: colors.onSurface },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: colors.secondaryContainer,
  },
  chipRecent: { backgroundColor: colors.surfaceContainer },
  chipText: { fontSize: 10, fontWeight: '600' },
  address: { ...typography.bodyMd, color: colors.onSurfaceVariant, lineHeight: 20 },
  sub: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  right: { flexShrink: 0, alignItems: 'flex-end', gap: spacing.unit2 },
  actionRow: { flexDirection: 'row', gap: spacing.unit3, marginTop: 4 },
});
