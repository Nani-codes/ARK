import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['products', slug],
    queryFn: () => fetchProducts({ categorySlug: slug }),
    enabled: !!slug,
  });

  const products = data?.data ?? [];
  const title = products[0]?.category?.name ?? slug?.replace(/-/g, ' ') ?? 'Category';

  return (
    <View style={styles.container}>
      <AppHeader title={title} showBack showLocation={false} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : products.length === 0 ? (
        <Text style={styles.empty}>No products in this category.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {products.map((p) => (
            <View key={p.documentId} style={styles.item}>
              <ProductCard product={p} compact />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.containerMargin, gap: spacing.unit4, paddingBottom: spacing.unit12 },
  item: { width: '100%' },
  empty: { ...typography.bodyLg, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
});
