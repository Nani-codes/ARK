import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddToCartControl } from '@/components/AddToCartControl';
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
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="inventory-2" size={32} color={colors.icon} />
          </View>
        )}
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
        <AddToCartControl product={product} size="sm" stopPropagation />
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
  imageWrap: { height: 128, backgroundColor: colors.surfaceContainer },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  name: { ...typography.labelLg, color: colors.primary, minHeight: 40 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.unit2 },
  price: { ...typography.priceDisplay, color: colors.primary, fontSize: 16 },
  compare: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
});
