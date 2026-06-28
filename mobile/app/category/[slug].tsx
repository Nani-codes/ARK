import { keepPreviousData, useQuery } from '@tanstack/react-query';
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', slug, brand],
    queryFn: () => fetchProducts({ categorySlug: slug, brand: brand ?? undefined, pageSize: 50 }),
    enabled: !!slug,
    placeholderData: keepPreviousData,
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
  const title =
    products[0]?.category?.name ??
    allInCategory?.data?.[0]?.category?.name ??
    slug?.replace(/-/g, ' ') ??
    'Category';

  const showInitialLoading = isLoading && !data;
  const showEmpty = !isFetching && products.length === 0;

  return (
    <View style={styles.container}>
      <AppHeader title={title} showBack showLocation={false} showSearch />

      {brands.length > 1 ? (
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.brandRow}
            contentContainerStyle={styles.brandRowContent}>
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
        </View>
      ) : null}

      <View style={styles.productArea}>
        {showInitialLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : showEmpty ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No products in this category yet.</Text>
            <Text style={styles.emptySub}>Try searching the full catalog or browse other categories.</Text>
            <PrimaryButton label="Search Catalog" onPress={() => router.push('/search')} />
          </View>
        ) : (
          <ScrollView style={styles.listScroll} contentContainerStyle={styles.grid}>
            {products.map((p, i) => {
              // 2-column grid — pair items
              if (i % 2 !== 0) return null;
              const next = products[i + 1];
              return (
                <View key={p.documentId} style={styles.gridRow}>
                  <View style={styles.gridCell}>
                    <ProductCard product={p} compact />
                  </View>
                  <View style={styles.gridCell}>
                    {next ? <ProductCard product={next} compact /> : null}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterSection: {
    flexShrink: 0,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  brandRow: {
    flexGrow: 0,
    height: 57,
    paddingTop: spacing.unit2,
    paddingBottom: spacing.unit3,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  brandRowContent: {
    flexDirection: 'row',
    gap: spacing.unit2,
    alignItems: 'center',
    height: 36,
    paddingHorizontal: spacing.containerMargin,
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.secondary, backgroundColor: colors.secondary },
  chipText: {
    ...typography.labelLg,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    includeFontPadding: false,
  },
  chipTextActive: { color: colors.onSecondary, fontWeight: '700' },
  productArea: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  listScroll: { flex: 1 },
  loader: { marginTop: 40 },
  grid: {
    padding: spacing.containerMargin,
    gap: spacing.unit3,
    paddingBottom: spacing.unit12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.unit3,
    alignItems: 'stretch',
  },
  gridCell: {
    flex: 1,
    minWidth: 0,       // prevents flex children from overflowing
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.unit8,
    gap: spacing.unit3,
  },
  empty: { ...typography.headlineMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  emptySub: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});
