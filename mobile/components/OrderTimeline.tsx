import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';
import type { Order } from '@/lib/types';

const STEPS: Array<{
  key: Order['orderStatus'];
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { key: 'pending', label: 'Order Placed', icon: 'receipt-long' },
  { key: 'confirmed', label: 'Confirmed', icon: 'check-circle' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'local-shipping' },
  { key: 'delivered', label: 'Delivered', icon: 'home' },
];

const STATUS_ORDER: Order['orderStatus'][] = [
  'pending',
  'confirmed',
  'out_for_delivery',
  'delivered',
];

export function OrderTimeline({ status }: { status: Order['orderStatus'] }) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelled}>
        <MaterialIcons name="cancel" size={22} color={colors.error} />
        <Text style={styles.cancelledText}>This order was cancelled</Text>
      </View>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <View style={styles.wrap}>
      {STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.iconCol}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                <MaterialIcons
                  name={step.icon}
                  size={16}
                  color={done ? colors.onSecondary : colors.onSurfaceVariant}
                />
              </View>
              {idx < STEPS.length - 1 ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
            <Text style={[styles.label, done && styles.labelDone, active && styles.labelActive]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.unit4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.unit3 },
  iconCol: { alignItems: 'center', width: 32 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.secondary },
  dotActive: { backgroundColor: colors.primary },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: colors.outlineVariant,
    marginVertical: 4,
  },
  lineDone: { backgroundColor: colors.secondary },
  label: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    paddingTop: 6,
    flex: 1,
  },
  labelDone: { color: colors.onSurface },
  labelActive: { ...typography.labelLg, color: colors.primary, fontWeight: '700' },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.errorContainer,
    padding: spacing.unit4,
    borderRadius: 8,
    marginBottom: spacing.unit4,
  },
  cancelledText: { ...typography.labelLg, color: colors.error },
});
