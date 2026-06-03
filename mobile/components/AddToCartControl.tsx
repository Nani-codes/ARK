import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { getProductVariants } from '@/lib/productPricing';
import { colors, spacing, typography } from '@/lib/theme';
import type { Product, ProductVariant } from '@/lib/types';
import { cartLineId, useCartStore } from '@/stores/cart';

type AddToCartControlProps = {
  product: Product;
  variant?: ProductVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  /** Stop card press when used inside ProductCard */
  stopPropagation?: boolean;
};

export function AddToCartControl({
  product,
  variant: variantProp,
  size = 'sm',
  style,
  stopPropagation = false,
}: AddToCartControlProps) {
  const variants = getProductVariants(product);
  const variant = variantProp ?? variants[0];
  const lineId = cartLineId(product.documentId, variant.id);
  const hasMultipleVariants =
    variants.length > 1 && !(variants.length === 1 && variants[0].id === 'default');

  const quantity = useCartStore((s) => s.items.find((i) => i.lineId === lineId)?.quantity ?? 0);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const wrapPress = (fn: () => void) => (e?: { stopPropagation?: () => void }) => {
    if (stopPropagation) e?.stopPropagation?.();
    fn();
  };

  const handleAdd = () => {
    if (hasMultipleVariants && !variantProp) {
      router.push(`/product/${product.documentId}`);
      return;
    }
    addItem(product, { quantity: 1, variant });
  };

  const handleIncrement = () => {
    if (quantity === 0) {
      addItem(product, { quantity: 1, variant });
    } else {
      updateQuantity(lineId, quantity + 1);
    }
  };

  const handleDecrement = () => {
    updateQuantity(lineId, quantity - 1);
  };

  const isMd = size === 'md';

  if (quantity === 0) {
    return (
      <Pressable
        style={[isMd ? styles.addBtnMd : styles.addBtnSm, style]}
        onPress={wrapPress(handleAdd)}>
        {isMd ? (
          <>
            <MaterialIcons name="add-shopping-cart" size={22} color={colors.onSecondary} />
            <Text style={styles.addLabelMd}>ADD</Text>
          </>
        ) : (
          <>
            <MaterialIcons name="add" size={20} color={colors.primary} />
            <Text style={styles.addLabelSm}>ADD</Text>
          </>
        )}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        isMd ? styles.stepperMd : styles.stepperSm,
        style,
      ]}
      onStartShouldSetResponder={() => stopPropagation}>
      <Pressable
        style={isMd ? styles.stepBtnMd : styles.stepBtnSm}
        onPress={wrapPress(handleDecrement)}
        hitSlop={8}>
        <MaterialIcons
          name="remove"
          size={isMd ? 22 : 20}
          color={isMd ? colors.onSecondary : colors.primary}
        />
      </Pressable>
      <Text style={isMd ? styles.qtyMd : styles.qtySm}>{quantity}</Text>
      <Pressable
        style={isMd ? styles.stepBtnMd : styles.stepBtnSm}
        onPress={wrapPress(handleIncrement)}
        hitSlop={8}>
        <MaterialIcons
          name="add"
          size={isMd ? 22 : 20}
          color={isMd ? colors.onSecondary : colors.primary}
        />
      </Pressable>
    </View>
  );
}

const stepperBase = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  borderWidth: 2,
  borderColor: colors.primary,
  overflow: 'hidden' as const,
};

const styles = StyleSheet.create({
  addBtnSm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.unit2,
    backgroundColor: colors.surface,
  },
  addLabelSm: { ...typography.labelMd, color: colors.primary, fontWeight: '700' },
  stepperSm: {
    ...stepperBase,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  stepBtnSm: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtySm: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  addBtnMd: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: spacing.unit4,
  },
  addLabelMd: {
    ...typography.labelLg,
    color: colors.onSecondary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stepperMd: {
    ...stepperBase,
    flex: 1,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  stepBtnMd: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyMd: {
    ...typography.headlineMd,
    color: colors.onSecondary,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
});
