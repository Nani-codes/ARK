import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { getProductVariants } from '@/lib/productPricing';
import { isSignedIn, promptAuth } from '@/lib/authGate';
import { colors, spacing, typography } from '@/lib/theme';
import type { Product, ProductVariant } from '@/lib/types';
import { buildCartLine, cartLineId, useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';

type AddToCartControlProps = {
  product: Product;
  variant?: ProductVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  /** Show Buy Now next to the quantity stepper (product cards) */
  showBuyNow?: boolean;
  /** Stop card press when used inside ProductCard */
  stopPropagation?: boolean;
};

export function AddToCartControl({
  product,
  variant: variantProp,
  size = 'sm',
  style,
  showBuyNow = false,
  stopPropagation = false,
}: AddToCartControlProps) {
  const variants = getProductVariants(product);
  const variant = variantProp ?? variants[0];
  const lineId = cartLineId(product.documentId, variant.id);

  const quantity = useCartStore((s) => s.items.find((i) => i.lineId === lineId)?.quantity ?? 0);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const wrapPress = (fn: () => void) => (e?: { stopPropagation?: () => void }) => {
    if (stopPropagation) e?.stopPropagation?.();
    fn();
  };

  const handleAdd = () => {
    if (!product.inStock) return;
    addItem(product, { quantity: 1, variant });
    useToastStore.getState().show('Added to cart');
  };

  const handleIncrement = () => {
    if (!product.inStock) return;
    if (quantity === 0) {
      addItem(product, { quantity: 1, variant });
    } else {
      updateQuantity(lineId, quantity + 1);
    }
  };

  const handleDecrement = () => {
    updateQuantity(lineId, quantity - 1);
  };

  const handleBuyNow = () => {
    if (!product.inStock) return;
    const checkoutQty = quantity > 0 ? quantity : 1;
    const item = buildCartLine(product, variant, checkoutQty);
    const itemsParam = encodeURIComponent(JSON.stringify([item]));
    const returnTo = `/checkout?buyNow=true&buyNowItems=${itemsParam}`;
    if (!isSignedIn()) {
      promptAuth({
        returnTo,
        message: 'Sign in to continue with checkout',
      });
      return;
    }
    router.push(returnTo as never);
  };

  const isMd = size === 'md';

  if (!product.inStock) {
    return (
      <View style={[isMd ? styles.outOfStockMd : styles.outOfStockSm, style]}>
        <Text style={isMd ? styles.outOfStockTextMd : styles.outOfStockTextSm}>OUT OF STOCK</Text>
      </View>
    );
  }

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
          <Text style={styles.addLabelSm}>+ ADD</Text>
        )}
      </Pressable>
    );
  }

  const stepper = (
    <View
      style={[isMd ? styles.stepperMd : styles.stepperSm, style]}
      onStartShouldSetResponder={() => stopPropagation}>
      <Pressable
        style={isMd ? styles.stepBtnMd : styles.stepBtnSm}
        onPress={wrapPress(handleDecrement)}
        hitSlop={8}>
        {isMd ? (
          <MaterialIcons name="remove" size={22} color={colors.onSecondary} />
        ) : (
          <Text style={styles.stepSymbolSm}>−</Text>
        )}
      </Pressable>
      <Text style={isMd ? styles.qtyMd : styles.qtySm}>{quantity}</Text>
      <Pressable
        style={isMd ? styles.stepBtnMd : styles.stepBtnSm}
        onPress={wrapPress(handleIncrement)}
        hitSlop={8}>
        {isMd ? (
          <MaterialIcons name="add" size={22} color={colors.onSecondary} />
        ) : (
          <Text style={styles.stepSymbolSm}>+</Text>
        )}
      </Pressable>
    </View>
  );

  if (showBuyNow && !isMd) {
    return (
      <View
        style={[styles.cardActionRow, style]}
        onStartShouldSetResponder={() => stopPropagation}>
        <View style={[styles.stepperSm, styles.stepperInRow]}>
          <Pressable
            style={styles.stepBtnSm}
            onPress={wrapPress(handleDecrement)}
            hitSlop={8}>
            <Text style={styles.stepSymbolSm}>−</Text>
          </Pressable>
          <Text style={styles.qtySmInline}>{quantity}</Text>
          <Pressable
            style={styles.stepBtnSm}
            onPress={wrapPress(handleIncrement)}
            hitSlop={8}>
            <Text style={styles.stepSymbolSm}>+</Text>
          </Pressable>
        </View>
        <Pressable style={styles.buyNowBtnSm} onPress={wrapPress(handleBuyNow)}>
          <Text style={styles.buyNowLabelSm} numberOfLines={1}>
            Buy Now
          </Text>
        </Pressable>
      </View>
    );
  }

  return stepper;
}

const stepperBase = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  borderWidth: 2,
  borderColor: colors.primary,
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
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  stepperSm: {
    ...stepperBase,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  stepperInRow: {
    flexShrink: 0,
    width: 92,
  },
  stepBtnSm: {
    width: 28,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtySm: {
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
  },
  qtySmInline: {
    width: 28,
    textAlign: 'center',
    ...typography.labelLg,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  stepSymbolSm: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 20,
  },
  buyNowBtnSm: {
    flex: 1,
    minWidth: 0,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  buyNowLabelSm: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '800',
    fontSize: 10,
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
    overflow: 'hidden',
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
  outOfStockSm: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingVertical: spacing.unit2,
    backgroundColor: colors.surfaceContainer,
  },
  outOfStockTextSm: { ...typography.labelMd, color: colors.onSurfaceVariant, fontWeight: '700' },
  outOfStockMd: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: spacing.unit4,
    backgroundColor: colors.surfaceContainer,
  },
  outOfStockTextMd: { ...typography.labelLg, color: colors.onSurfaceVariant, fontWeight: '700' },
});
