import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddToCartControl } from '@/components/AddToCartControl';
import { ProductImage } from '@/components/ProductImage';
import { discountPercent, formatInr, getProductDisplayPricing } from '@/lib/productPricing';
import { mediaUrl } from '@/lib/strapi';
import { colors, spacing, typography } from '@/lib/theme';
import type { Product } from '@/lib/types';

type ProductCardProps = {
  product: Product;
  compact?: boolean;
};

export function ProductCard({ product, compact }: ProductCardProps) {
  const uri = mediaUrl(product.image?.url);
  const { price, compareAtPrice } = getProductDisplayPricing(product);
  const percent =
    discountPercent(price, compareAtPrice) ??
    (product.compareAtPrice
      ? discountPercent(Number(product.price), Number(product.compareAtPrice))
      : null);

  return (
    <Pressable
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => router.push(`/product/${product.documentId}`)}>
      <View style={styles.imageWrap}>
        <ProductImage uri={uri} accessibilityLabel={product.name} iconSize={32} style={styles.image} />
        {product.onDeal ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>DEAL</Text>
          </View>
        ) : percent != null && percent > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{percent}% OFF</Text>
          </View>
        ) : product.bestSeller ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Best Seller</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatInr(price)}</Text>
          {compareAtPrice != null && compareAtPrice > price ? (
            <Text style={styles.compare}>{formatInr(compareAtPrice)}</Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <AddToCartControl product={product} size="sm" showBuyNow stopPropagation />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 176,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  cardCompact: { width: '100%' },
  imageWrap: {
    height: 128,
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    height: '100%',
    paddingHorizontal: spacing.unit3,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  body: { padding: spacing.unit3, flex: 1, justifyContent: 'space-between', gap: spacing.unit2 },
  actions: { minHeight: 40 },
  name: { ...typography.labelLg, color: colors.primary, minHeight: 40 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.unit2 },
  price: { ...typography.priceDisplay, color: colors.primary, fontSize: 16 },
  compare: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
});
