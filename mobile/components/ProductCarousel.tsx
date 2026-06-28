import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { colors, spacing, typography } from '@/lib/theme';
import type { Product } from '@/lib/types';

type ProductCarouselProps = {
  title: string;
  products: Product[];
  loading?: boolean;
  emptyText?: string;
  viewAllHref?: string;
};

export function ProductCarousel({ title, products, loading, emptyText, viewAllHref }: ProductCarouselProps) {
  if (loading) {
    return (
      <View style={styles.block}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.unit4 }} />
      </View>
    );
  }
  if (!products.length) {
    if (!emptyText) return null;
    return (
      <View style={styles.block}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.empty}>{emptyText}</Text>
      </View>
    );
  }
  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {viewAllHref ? (
          <Pressable
            onPress={() => router.push(viewAllHref as never)}
            style={({ pressed }) => [styles.viewAll, pressed && { opacity: 0.6 }]}>
            <Text style={styles.viewAllText}>View All →</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={styles.rowContent}>
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
  block: { marginBottom: spacing.unit6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.containerMargin,
    marginBottom: spacing.unit3,
  },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  viewAll: {
    paddingVertical: spacing.unit1,
    paddingHorizontal: spacing.unit2,
  },
  viewAllText: {
    ...typography.labelLg,
    color: colors.secondary,
    fontWeight: '700',
  },
  empty: { ...typography.bodyMd, color: colors.onSurfaceVariant, paddingHorizontal: spacing.containerMargin },
  row: { paddingLeft: spacing.containerMargin },
  rowContent: { paddingRight: spacing.containerMargin },
  gap: { marginRight: spacing.unit3 },
});
