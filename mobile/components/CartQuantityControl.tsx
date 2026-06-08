import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/lib/theme';
import { useCartStore } from '@/stores/cart';

type CartQuantityControlProps = {
  lineId: string;
  quantity: number;
};

export function CartQuantityControl({ lineId, quantity }: CartQuantityControlProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  return (
    <View style={styles.stepper}>
      <Pressable
        style={styles.btn}
        onPress={() => updateQuantity(lineId, quantity - 1)}
        hitSlop={8}>
        <MaterialIcons name="remove" size={20} color={colors.primary} />
      </Pressable>
      <Text style={styles.qty}>{quantity}</Text>
      <Pressable
        style={styles.btn}
        onPress={() => updateQuantity(lineId, quantity + 1)}
        hitSlop={8}>
        <MaterialIcons name="add" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  btn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  qty: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
});
