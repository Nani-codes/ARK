import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { colors, spacing, typography } from '@/lib/theme';
import type { Product } from '@/lib/types';

type ProductCarouselProps = {
  title: string;
  products: Product[];
  loading?: boolean;
  emptyText?: string;
};

export function ProductCarousel({ title, products, loading, emptyText }: ProductCarouselProps) {
  if (loading) {
    return (
      <View style={styles.block}>
        <Text style={styles.title}>{title}</Text>
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.unit4 }} />
      </View>
    );
  }
  if (!products.length) {
    if (!emptyText) return null;
    return (
      <View style={styles.block}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>{emptyText}</Text>
      </View>
    );
  }
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {products.map((p) => (
          <View key={p.documentId} style={styles.gap}>
            <ProductCard product={p} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: spacing.unit4 },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit2,
  },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, paddingHorizontal: spacing.containerMargin },
  row: { paddingLeft: spacing.containerMargin },
  gap: { marginRight: spacing.unit4 },
});
