import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/AppHeader';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts, type ProductSearchParams } from '@/lib/api';
import { colors, shadows, spacing, typography } from '@/lib/theme';

type SortKey = ProductSearchParams['sort'];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name:asc', label: 'Name A–Z' },
  { key: 'price:asc', label: 'Price ↑' },
  { key: 'price:desc', label: 'Price ↓' },
];

const TRENDING = ['Cement', 'TMT Bars', 'Wall Tiles', 'Waterproofing', 'Plywood', 'Paints'];

export default function SearchScreen() {
  const { q: initialQ } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(initialQ ?? '');
  const [submitted, setSubmitted] = useState(initialQ ?? '');
  const [sort, setSort] = useState<SortKey>('name:asc');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const { data: brandSource } = useQuery({
    queryKey: ['brands'],
    queryFn: () => fetchProducts({ pageSize: 100 }),
  });

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of brandSource?.data ?? []) {
      if (p.brand) set.add(p.brand);
    }
    return [...set].sort();
  }, [brandSource]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', submitted, sort, inStockOnly, brand],
    queryFn: () =>
      fetchProducts({
        q: submitted || undefined,
        sort,
        inStock: inStockOnly || undefined,
        brand: brand ?? undefined,
        pageSize: 50,
      }),
    enabled: submitted.length > 0 || !!brand,
  });

  const products = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  const runSearch = () => {
    setSubmitted(query.trim());
  };

  const isEmpty = !submitted && !brand;

  return (
    <View style={styles.container}>
      <AppHeader showBack showLocation={false} />
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Search bar */}
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <MaterialIcons name="search" size={22} color={focused ? colors.secondary : colors.iconMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search cement, steel, tiles..."
            placeholderTextColor={colors.iconMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            autoFocus={!initialQ}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => { setQuery(''); setSubmitted(''); }}>
              <MaterialIcons name="close" size={20} color={colors.iconMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter rows */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Sort by</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.chip, sort === opt.key && styles.chipActive]}
                onPress={() => setSort(opt.key)}>
                <Text style={[styles.chipText, sort === opt.key && styles.chipTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.chip, inStockOnly && styles.chipActive]}
              onPress={() => setInStockOnly((v) => !v)}>
              <Text style={[styles.chipText, inStockOnly && styles.chipTextActive]}>In stock</Text>
            </Pressable>
          </ScrollView>
        </View>

        {brands.length > 0 ? (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Brand</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
              contentContainerStyle={styles.chipRowContent}>
              <Pressable
                style={[styles.chip, !brand && styles.chipActive]}
                onPress={() => setBrand(null)}>
                <Text style={[styles.chipText, !brand && styles.chipTextActive]}>All</Text>
              </Pressable>
              {brands.map((b) => (
                <Pressable
                  key={b}
                  style={[styles.chip, brand === b && styles.chipActive]}
                  onPress={() => { setBrand(b); if (!submitted) setSubmitted(' '); }}>
                  <Text style={[styles.chipText, brand === b && styles.chipTextActive]}>{b}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* States */}
        {isEmpty ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="search" size={40} color={colors.secondary} />
            </View>
            <Text style={styles.emptyTitle}>Search the full catalog</Text>
            <Text style={styles.emptySubtitle}>Find cement, steel, tiles, plywood and thousands more products</Text>
            <View style={styles.trendingSection}>
              <Text style={styles.trendingLabel}>Trending searches</Text>
              <View style={styles.trendingChips}>
                {TRENDING.map((term) => (
                  <Pressable
                    key={term}
                    style={({ pressed }) => [styles.trendingChip, pressed && { opacity: 0.7 }]}
                    onPress={() => { setQuery(term); setSubmitted(term); }}>
                    <MaterialIcons name="trending-up" size={13} color={colors.secondary} />
                    <Text style={styles.trendingChipText}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : products.length === 0 ? (
          <View style={styles.noResults}>
            <MaterialIcons name="search-off" size={48} color={colors.outlineVariant} />
            <Text style={styles.noResultsText}>
              No products found{submitted ? ` for "${submitted.trim()}"` : ''}
            </Text>
            <Pressable style={styles.browseBtn} onPress={() => router.push('/(tabs)/categories')}>
              <Text style={styles.browseBtnText}>Browse Categories</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.resultCount}>
              {pagination?.total ?? products.length} result{(pagination?.total ?? 0) !== 1 ? 's' : ''}
            </Text>
            <View style={styles.list}>
              {products.map((p) => (
                <View key={p.documentId} style={styles.item}>
                  <ProductCard product={p} compact />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollRoot: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: spacing.containerMargin,
    paddingTop: spacing.unit3,
    paddingBottom: spacing.unit12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit3,
    marginBottom: spacing.unit4,
    ...shadows.sm,
  },
  searchBarFocused: {
    borderColor: colors.secondary,
    ...shadows.md,
  },
  input: { flex: 1, ...typography.bodyMd, color: colors.onSurface, padding: 0 },
  filterSection: {
    marginBottom: spacing.unit3,
  },
  filterLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.unit2,
    paddingLeft: 2,
  },
  chipRow: { flexGrow: 0, flexShrink: 0 },
  chipRowContent: {
    flexDirection: 'row',
    gap: spacing.unit2,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    height: 38,
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
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.unit8,
    gap: spacing.unit3,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.unit2,
  },
  emptyTitle: { ...typography.headlineMd, color: colors.primary, textAlign: 'center' },
  emptySubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.unit4,
  },
  trendingSection: { width: '100%', marginTop: spacing.unit4 },
  trendingLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.unit3,
    textAlign: 'center',
  },
  trendingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit2,
    justifyContent: 'center',
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: spacing.unit2,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadows.sm,
  },
  trendingChipText: { ...typography.labelLg, color: colors.primary },
  // No results
  noResults: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.unit3,
  },
  noResultsText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  browseBtn: {
    marginTop: spacing.unit2,
    paddingHorizontal: spacing.unit6,
    paddingVertical: spacing.unit3,
    backgroundColor: colors.secondary,
    borderRadius: 999,
  },
  browseBtnText: { ...typography.labelLg, color: colors.onSecondary, fontWeight: '700' },
  // Results
  list: { gap: spacing.unit4 },
  resultCount: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit3 },
  item: { width: '100%' },
});
