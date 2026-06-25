import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';
import { FREE_DELIVERY_MIN_ORDER } from '@/lib/pricing';

export function FreeDeliveryBanner() {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <MaterialIcons name="local-shipping" size={16} color={colors.secondary} />
      <Text style={styles.text}>
        Free delivery on orders above ₹{FREE_DELIVERY_MIN_ORDER.toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.secondaryContainer,
    paddingVertical: spacing.unit2,
    paddingHorizontal: spacing.containerMargin,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  text: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
