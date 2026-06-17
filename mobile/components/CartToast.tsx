import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/lib/theme';
import { useToastStore } from '@/stores/toast';

export function CartToast() {
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);

  if (!message) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 72 }]} pointerEvents="none">
      <View style={styles.toast}>
        <MaterialIcons name="check-circle" size={20} color={colors.success} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.containerMargin,
    right: spacing.containerMargin,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: spacing.unit2,
    paddingHorizontal: spacing.unit4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  text: { ...typography.labelLg, color: colors.onPrimary, fontWeight: '600' },
});
