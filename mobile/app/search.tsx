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
import { colors, spacing, typography } from '@/lib/theme';

type SortKey = ProductSearchParams['sort'];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name:asc', label: 'Name A–Z' },
  { key: 'price:asc', label: 'Price ↑' },
  { key: 'price:desc', label: 'Price ↓' },
];

export default function SearchScreen() {
  const { q: initialQ } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(initialQ ?? '');
  const [submitted, setSubmitted] = useState(initialQ ?? '');
  const [sort, setSort] = useState<SortKey>('name:asc');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      <AppHeader showBack showLocation={false} />
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color={colors.iconMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search cement, steel, tiles..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={runSearch}
            returnKeyType="search"
            autoFocus={!initialQ}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => { setQuery(''); setSubmitted(''); }}>
              <MaterialIcons name="close" size={20} color={colors.iconMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortRow}
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

        {brands.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.brandRow}
            contentContainerStyle={styles.chipRowContent}>
            <Pressable
              style={[styles.chip, !brand && styles.chipActive]}
              onPress={() => setBrand(null)}>
              <Text style={[styles.chipText, !brand && styles.chipTextActive]}>All brands</Text>
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
        ) : null}

        {!submitted && !brand ? (
          <View style={styles.hint}>
            <MaterialIcons name="search" size={48} color={colors.iconMuted} />
            <Text style={styles.hintText}>Search across the full catalog</Text>
          </View>
        ) : isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : products.length === 0 ? (
          <Text style={styles.empty}>No products found{submitted ? ` for "${submitted.trim()}"` : ''}</Text>
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
    paddingTop: spacing.unit2,
    paddingBottom: spacing.unit12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: spacing.unit3,
    paddingVertical: spacing.unit2,
    marginBottom: spacing.unit2,
  },
  input: { flex: 1, ...typography.bodyMd, color: colors.onSurface, padding: 0 },
  sortRow: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.unit2,
  },
  brandRow: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.unit3,
  },
  chipRowContent: {
    flexDirection: 'row',
    gap: spacing.unit2,
    alignItems: 'center',
    height: 36,
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
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
  chipTextActive: { color: colors.onSecondary },
  hint: { alignItems: 'center', paddingTop: 80, gap: spacing.unit3 },
  hintText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  empty: { ...typography.bodyLg, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 40 },
  list: { gap: spacing.unit4 },
  resultCount: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.unit2 },
  item: { width: '100%' },
});
