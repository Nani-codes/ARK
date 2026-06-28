import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

const FREE_DELIVERY_MIN_ORDER = 10_000;

export function FreeDeliveryBanner() {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [slideAnim]);

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
        <MaterialIcons name="local-shipping" size={16} color={colors.primary} />
      </Animated.View>
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
    fontWeight: '700',
    textAlign: 'center',
  },
});
