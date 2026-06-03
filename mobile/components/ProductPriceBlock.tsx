import { StyleSheet, Text, View } from 'react-native';

import { formatInr } from '@/lib/productPricing';
import { colors, spacing, typography } from '@/lib/theme';

type ProductPriceBlockProps = {
  price: number;
  compareAtPrice?: number | null;
  percent?: number | null;
  size?: 'md' | 'lg';
};

export function ProductPriceBlock({
  price,
  compareAtPrice,
  percent,
  size = 'md',
}: ProductPriceBlockProps) {
  const hasDiscount = compareAtPrice != null && compareAtPrice > price;

  return (
    <View style={styles.wrap}>
      {percent != null && percent > 0 ? (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{percent}% OFF</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <Text style={size === 'lg' ? styles.saleLg : styles.sale}>
          {formatInr(price)}
        </Text>
        {hasDiscount ? (
          <Text style={styles.regular}>Regular price {formatInr(compareAtPrice)}</Text>
        ) : null}
      </View>
      {hasDiscount ? (
        <Text style={styles.saleLabel}>Sale price {formatInr(price)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.unit2 },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.unit2,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '800',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: spacing.unit2 },
  sale: { ...typography.priceDisplay, color: colors.primary },
  saleLg: { ...typography.priceDisplay, fontSize: 28, color: colors.primary },
  regular: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  saleLabel: { ...typography.labelMd, color: colors.secondary, fontWeight: '600' },
});
