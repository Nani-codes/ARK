import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts } from '@/lib/api';
import { colors, spacing, typography } from '@/lib/theme';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [brand, setBrand] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', slug, brand],
    queryFn: () => fetchProducts({ categorySlug: slug, brand: brand ?? undefined, pageSize: 50 }),
    enabled: !!slug,
  });

  const { data: allInCategory } = useQuery({
    queryKey: ['products', slug, 'brands'],
    queryFn: () => fetchProducts({ categorySlug: slug, pageSize: 50 }),
    enabled: !!slug,
  });

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of allInCategory?.data ?? []) {
      if (p.brand) set.add(p.brand);
    }
    return [...set].sort();
  }, [allInCategory]);

  const products = data?.data ?? [];
  const title = products[0]?.category?.name ?? slug?.replace(/-/g, ' ') ?? 'Category';

  return (
    <View style={styles.container}>
      <AppHeader title={title} showBack showLocation={false} />
      {brands.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandRow}>
          <Pressable
            style={[styles.chip, !brand && styles.chipActive]}
            onPress={() => setBrand(null)}>
            <Text style={[styles.chipText, !brand && styles.chipTextActive]}>All</Text>
          </Pressable>
          {brands.map((b) => (
            <Pressable
              key={b}
              style={[styles.chip, brand === b && styles.chipActive]}
              onPress={() => setBrand(b)}>
              <Text style={[styles.chipText, brand === b && styles.chipTextActive]}>{b}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>No products in this category yet.</Text>
          <Text style={styles.emptySub}>Try searching the full catalog or browse other categories.</Text>
          <PrimaryButton label="Search Catalog" onPress={() => router.push('/search')} />
        </View>
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
  brandRow: { paddingHorizontal: spacing.containerMargin, paddingVertical: spacing.unit2, maxHeight: 44 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    marginRight: spacing.unit2,
  },
  chipActive: { borderColor: colors.secondary, backgroundColor: colors.secondaryContainer },
  chipText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.containerMargin, gap: spacing.unit4, paddingBottom: spacing.unit12 },
  item: { width: '100%' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.unit8, gap: spacing.unit3 },
  empty: { ...typography.headlineMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  emptySub: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});
